"use client";

import * as React from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import type { ConstellationData } from "./types";
import { StarNode } from "./StarNode";

export interface ConstellationProps {
  data: ConstellationData;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function Constellation({
  data,
  isSelected = false,
  onSelect,
}: ConstellationProps) {
  const { invalidate } = useThree();
  const { stars, edges, attribute } = data;

  // Split edges into illuminated (both ends ignited) and dormant (uncharted)
  const { illuminatedGeometry, dormantGeometry } = React.useMemo(() => {
    const illuminatedPoints: THREE.Vector3[] = [];
    const dormantPoints: THREE.Vector3[] = [];

    for (const [i, j] of edges) {
      const starA = stars[i];
      const starB = stars[j];
      if (!starA || !starB) continue;

      const pA = new THREE.Vector3(...starA.position);
      const pB = new THREE.Vector3(...starB.position);

      if (starA.isIgnited && starB.isIgnited) {
        illuminatedPoints.push(pA, pB);
      } else {
        dormantPoints.push(pA, pB);
      }
    }

    const illGeom = new THREE.BufferGeometry().setFromPoints(illuminatedPoints);
    const dormGeom = new THREE.BufferGeometry().setFromPoints(dormantPoints);

    return { illuminatedGeometry: illGeom, dormantGeometry: dormGeom };
  }, [stars, edges]);

  // Clean up geometries on unmount
  React.useEffect(() => {
    return () => {
      illuminatedGeometry.dispose();
      dormantGeometry.dispose();
    };
  }, [illuminatedGeometry, dormantGeometry]);

  const handleGroupClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onSelect?.();
    invalidate();
  };

  return (
    <group onClick={handleGroupClick}>
      {/* 1. Star Nodes (5 stars per constellation) */}
      {stars.map((star) => (
        <StarNode
          key={star.id}
          position={star.position}
          isIgnited={star.isIgnited}
          isMajor={star.isMajor}
          colorHex={star.colorHex}
          name={star.name}
          isSelected={isSelected && star.isMajor}
          onClick={() => {
            onSelect?.();
            invalidate();
          }}
        />
      ))}

      {/* 2. Batched Illuminated Constellation Lines */}
      {illuminatedGeometry.attributes.position && (
        <lineSegments geometry={illuminatedGeometry}>
          <lineBasicMaterial
            color={attribute.colorHex}
            transparent
            opacity={isSelected ? 0.95 : 0.75}
            toneMapped={false}
          />
        </lineSegments>
      )}

      {/* 3. Batched Dormant / Uncharted Constellation Lines */}
      {dormantGeometry.attributes.position && (
        <lineSegments geometry={dormantGeometry}>
          <lineBasicMaterial
            color="#334155"
            transparent
            opacity={0.2}
            toneMapped={false}
          />
        </lineSegments>
      )}
    </group>
  );
}
