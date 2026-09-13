import { ImageResponse } from "next/og";

export const alt = "Vivre - Constellation Atlas & Celestial Quests";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#070a13",
          backgroundImage:
            "radial-gradient(circle at 50% 20%, rgba(56, 189, 248, 0.15) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(251, 191, 36, 0.1) 0%, transparent 50%)",
          color: "#f8fafc",
          padding: "60px 80px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle celestial border */}
        <div
          style={{
            position: "absolute",
            inset: "24px",
            border: "1px solid rgba(251, 191, 36, 0.25)",
            borderRadius: "16px",
            display: "flex",
          }}
        />

        {/* Constellation Star Icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "80px",
            height: "80px",
            borderRadius: "20px",
            backgroundColor: "rgba(251, 191, 36, 0.1)",
            border: "1px solid rgba(251, 191, 36, 0.4)",
            marginBottom: "28px",
          }}
        >
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "64px",
            fontWeight: "bold",
            letterSpacing: "0.2em",
            color: "#fbbf24",
            textTransform: "uppercase",
            marginBottom: "16px",
            textShadow: "0 0 40px rgba(251, 191, 36, 0.3)",
          }}
        >
          V I V R E
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "24px",
            color: "#94a3b8",
            letterSpacing: "0.08em",
            textAlign: "center",
            maxWidth: "780px",
            lineHeight: 1.4,
            marginBottom: "36px",
          }}
        >
          Server-Authoritative Constellation Atlas & Celestial Productivity Engine
        </div>

        {/* Badges */}
        <div
          style={{
            display: "flex",
            gap: "16px",
          }}
        >
          <div
            style={{
              padding: "8px 20px",
              borderRadius: "9999px",
              backgroundColor: "rgba(56, 189, 248, 0.1)",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              color: "#38bdf8",
              fontSize: "15px",
              letterSpacing: "0.05em",
            }}
          >
            3D WebGL Atlas
          </div>
          <div
            style={{
              padding: "8px 20px",
              borderRadius: "9999px",
              backgroundColor: "rgba(251, 191, 36, 0.1)",
              border: "1px solid rgba(251, 191, 36, 0.3)",
              color: "#fbbf24",
              fontSize: "15px",
              letterSpacing: "0.05em",
            }}
          >
            Atomic RPG Progression
          </div>
          <div
            style={{
              padding: "8px 20px",
              borderRadius: "9999px",
              backgroundColor: "rgba(168, 85, 247, 0.1)",
              border: "1px solid rgba(168, 85, 247, 0.3)",
              color: "#c084fc",
              fontSize: "15px",
              letterSpacing: "0.05em",
            }}
          >
            Pentagonal Radar Balance
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
