"use client";

import * as React from "react";
import { Canvas } from "@react-three/fiber";
import { StarmapScene } from "./StarmapScene";

const emptySubscribe = () => () => {};

export function StarmapCanvas() {
  const isMounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isMounted) {
    return (
      <div className="flex h-full min-h-[300px] w-full items-center justify-center rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-500">
        Initializing Stellar Visualizer...
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[300px] w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <StarmapScene />
      </Canvas>
    </div>
  );
}
