"use client";

import * as React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[Vivre Global Error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          minHeight: "100vh",
          backgroundColor: "#0B0E1A",
          color: "#F2EEE3",
          fontFamily: "system-ui, -apple-system, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          role="alert"
          style={{
            maxWidth: "480px",
            width: "90%",
            backgroundColor: "#141828",
            border: "1px solid rgba(214, 81, 81, 0.3)",
            borderRadius: "16px",
            padding: "36px",
            textAlign: "center",
            boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
          }}
        >
          <div
            style={{
              fontSize: "32px",
              marginBottom: "16px",
            }}
          >
            ✦
          </div>

          <h1
            style={{
              fontSize: "22px",
              fontWeight: 700,
              margin: "0 0 12px 0",
              color: "#F2EEE3",
            }}
          >
            System Astrolabe Suspended
          </h1>

          <p
            style={{
              fontSize: "14px",
              lineHeight: "1.6",
              color: "#8E98B0",
              margin: "0 0 28px 0",
            }}
          >
            A critical operational failure occurred at the system foundation. Telemetry has been paused to protect account integrity.
          </p>

          <button
            type="button"
            onClick={() => reset()}
            style={{
              backgroundColor: "#D4A85A",
              color: "#0B0E1A",
              border: "none",
              borderRadius: "9999px",
              padding: "12px 28px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Reboot Engine
          </button>
        </div>
      </body>
    </html>
  );
}
