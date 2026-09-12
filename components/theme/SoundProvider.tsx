"use client";

import * as React from "react";
import { AudioManager } from "@/lib/game/audio-manager";

export function SoundProvider() {
  React.useEffect(() => {
    // 1. Preload only essential short sounds (completion, bonus, critical)
    AudioManager.preloadEssential();

    // 2. Register first user interaction listener to ensure Howler context is ready
    const handleGesture = () => {
      AudioManager.markUserInteracted();
      window.removeEventListener("pointerdown", handleGesture, true);
      window.removeEventListener("keydown", handleGesture, true);
      window.removeEventListener("touchstart", handleGesture, true);
    };

    window.addEventListener("pointerdown", handleGesture, true);
    window.addEventListener("keydown", handleGesture, true);
    window.addEventListener("touchstart", handleGesture, true);

    return () => {
      window.removeEventListener("pointerdown", handleGesture, true);
      window.removeEventListener("keydown", handleGesture, true);
      window.removeEventListener("touchstart", handleGesture, true);
    };
  }, []);

  return null;
}
