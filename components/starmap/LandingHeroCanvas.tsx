"use client";

import * as React from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMotionPreferences } from "@/lib/game/motion-config";
import { checkWebGLSupport } from "./starmap-math";

/**
 * Low-poly cinematic astrolabe armillary sphere (Under 1,200 triangles)
 */
function CinematicAstrolabe() {
  const groupRef = React.useRef<THREE.Group>(null);
  const ring1Ref = React.useRef<THREE.Group>(null);
  const ring2Ref = React.useRef<THREE.Group>(null);

  // Subtle restrained precession (pauses automatically if canvas frameloop pauses)
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08;
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x += delta * 0.05;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z -= delta * 0.04;
    }
  });

  const ringGeometry = React.useMemo(() => {
    const segments = 48;
    const r = 2.0;
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(r * Math.cos(theta), r * Math.sin(theta), 0));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  React.useEffect(() => {
    return () => ringGeometry.dispose();
  }, [ringGeometry]);

  // 12 Astrolabe Star Nodes (20 triangles each = 240 triangles total)
  const stars = React.useMemo(() => {
    const items: [number, number, number][] = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const r = 2.0;
      items.push([
        r * Math.cos(angle),
        r * Math.sin(angle) * 0.5,
        r * Math.sin(angle) * 0.866,
      ]);
    }
    return items;
  }, []);

  return (
    <group ref={groupRef}>
      {/* Outer Armillary Ring */}
      <group ref={ring1Ref}>
        <lineLoop geometry={ringGeometry}>
          <lineBasicMaterial color="#f59e0b" opacity={0.5} transparent toneMapped={false} />
        </lineLoop>
      </group>

      {/* Tilted Oblique Ring */}
      <group ref={ring2Ref} rotation={[Math.PI / 4, Math.PI / 6, 0]}>
        <lineLoop geometry={ringGeometry}>
          <lineBasicMaterial color="#38bdf8" opacity={0.35} transparent toneMapped={false} />
        </lineLoop>
      </group>

      {/* Polar Axis */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 4.4, 8]} />
        <meshBasicMaterial color="#64748b" opacity={0.3} transparent />
      </mesh>

      {/* Central Luminary Core */}
      <mesh position={[0, 0, 0]}>
        <icosahedronGeometry args={[0.12, 1]} />
        <meshBasicMaterial color="#f59e0b" toneMapped={false} />
      </mesh>

      {/* 12 Astral Coordinate Star Points */}
      {stars.map((pos, i) => (
        <mesh key={i} position={pos}>
          <icosahedronGeometry args={[0.04, 1]} />
          <meshBasicMaterial
            color={i % 2 === 0 ? "#f59e0b" : "#38bdf8"}
            opacity={0.8}
            transparent
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export function LandingHeroCanvas() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const [isTabVisible, setIsTabVisible] = React.useState(true);

  const { shouldReduceMotion } = useMotionPreferences();

  const hasWebGL = React.useSyncExternalStore(
    () => () => {},
    () => checkWebGLSupport(),
    () => false
  );

  const isMobile = React.useSyncExternalStore(
    () => () => {},
    () =>
      typeof window !== "undefined" &&
      (window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent)),
    () => false
  );

  // IntersectionObserver to pause rendering when offscreen
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(Boolean(entry?.isIntersecting));
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Tab visibility listener
  React.useEffect(() => {
    const onVisibility = () => {
      setIsTabVisible(document.visibilityState !== "hidden");
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Static fallback if WebGL unsupported or reduced motion
  if (!hasWebGL || shouldReduceMotion) {
    return (
      <div
        ref={containerRef}
        className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center opacity-15"
        aria-hidden="true"
      >
        <div className="h-[520px] w-[520px] rounded-full border border-[var(--atlas-line)]" />
        <div className="absolute h-[380px] w-[380px] rounded-full border border-dashed border-[var(--atlas-reward)]" />
        <div className="absolute h-[680px] w-px bg-[var(--atlas-line)]" />
        <div className="absolute w-[680px] h-px bg-[var(--atlas-line)]" />
      </div>
    );
  }

  const shouldRender = isIntersecting && isTabVisible;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden opacity-35"
      aria-hidden="true"
    >
      {shouldRender ? (
        <Canvas
          dpr={isMobile ? [1, 1] : [1, 1.5]}
          camera={{ position: [0, 0, 5], fov: 45 }}
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
          <CinematicAstrolabe />
        </Canvas>
      ) : null}
    </div>
  );
}
