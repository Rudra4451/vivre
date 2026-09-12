"use client";

import * as React from "react";
import { Stars } from "@react-three/drei";

export function StarmapScene() {
  return (
    <>
      <color attach="background" args={["#030712"]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <Stars
        radius={100}
        depth={50}
        count={3000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.3} emissive="#0284c7" emissiveIntensity={0.2} />
      </mesh>
    </>
  );
}
