import { ImageResponse } from "next/og";

// Social sharing image placeholder. Replace with a designed 1200×630 image
// (e.g. /public/og.png + metadata.openGraph.images) when brand assets are ready.
export const alt = "DealBuddy AI – AI Brand Deal Assistant for Influencers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#fafaf7",
          padding: 72,
          color: "#18181b",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "#18181b", display: "flex" }} />
          <div style={{ fontSize: 36, fontWeight: 600, display: "flex" }}>
            <span>DealBuddy</span>
            <span style={{ color: "#5b47f0", marginLeft: 10 }}>AI</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>Stop Undervaluing Your Brand Collaborations.</div>
          <div style={{ fontSize: 30, color: "#63636b" }}>Reply to brands · Negotiate deals · Check terms · Calculate your rate</div>
        </div>
      </div>
    ),
    size,
  );
}
