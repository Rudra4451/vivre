"use client";

import * as React from "react";
import { useThree } from "@react-three/fiber";

export interface StarNodeProps {
  position: [number, number, number];
  isIgnited: boolean;
  isMajor: boolean;
  colorHex: string;
  name: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export function StarNode({
  position,
  isIgnited,
  isMajor,
  colorHex,
  name,
  isSelected = false,
  onClick,
}: StarNodeProps) {
  const { invalidate } = useThree();
  const [isHovered, setIsHovered] = React.useState(false);

  const radius = isMajor ? (isHovered ? 0.08 : 0.065) : isHovered ? 0.055 : 0.04;
  const activeColor = isSelected ? "#ffffff" : isIgnited ? colorHex : "#475569";
  const opacity = isIgnited ? 1.0 : 0.35;

  const handlePointerOver = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setIsHovered(true);
    invalidate();
  };

  const handlePointerOut = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setIsHovered(false);
    invalidate();
  };

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onClick?.();
    invalidate();
  };

  return (
    <group position={position}>
      {/* Primary Star Core - 20 Triangles (Icosahedron) */}
      <mesh
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <icosahedronGeometry args={[radius, 1]} />
        <meshBasicMaterial
          color={activeColor}
          transparent={!isIgnited}
          opacity={opacity}
          toneMapped={false}
        />
      </mesh>

      {/* Subtle Halo / Selection Ring for Major or Ignited Stars */}
      {(isMajor || isSelected || isHovered) && (
        <mesh scale={isHovered ? 1.5 : 1.25}>
          <icosahedronGeometry args={[radius, 1]} />
          <meshBasicMaterial
            color={activeColor}
            wireframe
            transparent
            opacity={isHovered ? 0.8 : isSelected ? 0.6 : 0.25}
            toneMapped={false}
          />
        </mesh>
      )}
    </group>
  );
}
