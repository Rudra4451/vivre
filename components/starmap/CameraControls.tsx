"use client";

import * as React from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls as DreiOrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export interface CameraControlsProps {
  autoRotate?: boolean;
  minDistance?: number;
  maxDistance?: number;
}

export function CameraControls({
  minDistance = 2.2,
  maxDistance = 7.0,
}: CameraControlsProps) {
  const { invalidate } = useThree();
  const controlsRef = React.useRef<OrbitControlsImpl>(null);

  // Invalidate on user interaction only — never runs a continuous idle loop
  const handleChange = React.useCallback(() => {
    invalidate();
  }, [invalidate]);

  return (
    <DreiOrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={false}
      enableDamping={true}
      dampingFactor={0.15}
      minDistance={minDistance}
      maxDistance={maxDistance}
      minPolarAngle={Math.PI * 0.15}
      maxPolarAngle={Math.PI * 0.85}
      rotateSpeed={0.7}
      zoomSpeed={0.75}
      onChange={handleChange}
      onStart={handleChange}
      onEnd={handleChange}
    />
  );
}
