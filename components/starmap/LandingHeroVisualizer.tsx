"use client";

import * as React from "react";
import dynamic from "next/dynamic";

const LazyLandingHeroCanvas = dynamic(
  () =>
    import("./LandingHeroCanvas").then((m) => m.LandingHeroCanvas),
  {
    ssr: false,
    loading: () => (
      <div
        className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center opacity-10"
        aria-hidden="true"
      >
        <div className="h-[600px] w-[600px] rounded-full border border-[var(--atlas-line)]" />
      </div>
    ),
  }
);

export function LandingHeroVisualizer() {
  return <LazyLandingHeroCanvas />;
}
