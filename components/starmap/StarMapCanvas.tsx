"use client";

import * as React from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import type { ConstellationData, StarAtlasTelemetry } from "./types";
import { Constellation } from "./Constellation";
import { CameraControls } from "./CameraControls";
import type { QuestCategory } from "@/lib/game/category-guesser";

export interface StarMapCanvasProps {
  constellations: ConstellationData[];
  selectedCategory?: QuestCategory | null;
  onSelectCategory?: (category: QuestCategory) => void;
  onTelemetryChange?: (telemetry: StarAtlasTelemetry) => void;
}

/**
 * Cartographic Celestial Sphere Grid Lines (0 Triangles — GL Lines Only)
 */
function AstrolabeCoordinateGrid() {
  const rings = React.useMemo(() => {
    const segments = 64;
    const r = 2.4;

    const eqPoints: THREE.Vector3[] = [];
    const merPoints: THREE.Vector3[] = [];

    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      eqPoints.push(new THREE.Vector3(r * Math.cos(theta), 0, r * Math.sin(theta)));
      merPoints.push(new THREE.Vector3(0, r * Math.cos(theta), r * Math.sin(theta)));
    }

    const eqGeom = new THREE.BufferGeometry().setFromPoints(eqPoints);
    const merGeom = new THREE.BufferGeometry().setFromPoints(merPoints);

    return { eqGeom, merGeom };
  }, []);

  React.useEffect(() => {
    return () => {
      rings.eqGeom.dispose();
      rings.merGeom.dispose();
    };
  }, [rings]);

  return (
    <group>
      {/* Equator Ring */}
      <lineLoop geometry={rings.eqGeom}>
        <lineBasicMaterial color="#334155" opacity={0.35} transparent toneMapped={false} />
      </lineLoop>
      {/* Meridian Ring */}
      <lineLoop geometry={rings.merGeom}>
        <lineBasicMaterial color="#334155" opacity={0.25} transparent toneMapped={false} />
      </lineLoop>
      {/* Central Origin Cartographer Star */}
      <mesh position={[0, 0, 0]}>
        <icosahedronGeometry args={[0.04, 1]} />
        <meshBasicMaterial color="#f59e0b" toneMapped={false} />
      </mesh>
    </group>
  );
}

/**
 * Development Telemetry Collector inspecting WebGL renderer on demand frames
 */
function TelemetryCollector({
  onTelemetryChange,
  isMobile,
}: {
  onTelemetryChange?: (telemetry: StarAtlasTelemetry) => void;
  isMobile: boolean;
}) {
  const { gl } = useThree();
  const invalidationCount = React.useRef(0);

  React.useEffect(() => {
    if (process.env.NODE_ENV !== "development" || !onTelemetryChange) return;

    invalidationCount.current += 1;
    const dpr = gl.getPixelRatio();
    const info = gl.info;

    onTelemetryChange({
      triangles: info.render.triangles,
      drawCalls: info.render.calls,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      invalidations: invalidationCount.current,
      dpr,
      frameloop: "demand",
      isMobile,
    });
  });

  return null;
}

/**
 * Scene inner tree: triggers an initial frame invalidation when constellation state updates
 */
function SceneContent({
  constellations,
  selectedCategory,
  onSelectCategory,
  onTelemetryChange,
  isMobile,
}: StarMapCanvasProps & { isMobile: boolean }) {
  const { invalidate } = useThree();

  // Invalidate strictly when constellation state changes
  React.useEffect(() => {
    invalidate();
  }, [constellations, selectedCategory, invalidate]);

  return (
    <>
      <AstrolabeCoordinateGrid />

      {constellations.map((c) => (
        <Constellation
          key={c.category}
          data={c}
          isSelected={selectedCategory === c.category}
          onSelect={() => onSelectCategory?.(c.category)}
        />
      ))}

      <CameraControls />

      {process.env.NODE_ENV === "development" && onTelemetryChange && (
        <TelemetryCollector
          onTelemetryChange={onTelemetryChange}
          isMobile={isMobile}
        />
      )}
    </>
  );
}

export function StarMapCanvas({
  constellations,
  selectedCategory,
  onSelectCategory,
  onTelemetryChange,
}: StarMapCanvasProps) {
  // Adaptive DPR: Lower on mobile (1.0), capped on desktop (1.5)
  const isMobile = React.useSyncExternalStore(
    () => () => {},
    () =>
      typeof window !== "undefined" &&
      (window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent)),
    () => false
  );

  const dpr: [number, number] = isMobile ? [1, 1] : [1, 1.5];

  return (
    <div className="relative h-full w-full overflow-hidden bg-[var(--atlas-bg)]">
      <Canvas
        frameloop="demand"
        dpr={dpr}
        camera={{ position: [0, 1.2, 4.5], fov: 50 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          depth: true,
          stencil: false,
        }}
        style={{ width: "100%", height: "100%" }}
        shadows={false}
      >
        <SceneContent
          constellations={constellations}
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
          onTelemetryChange={onTelemetryChange}
          isMobile={isMobile}
        />
      </Canvas>
    </div>
  );
}
