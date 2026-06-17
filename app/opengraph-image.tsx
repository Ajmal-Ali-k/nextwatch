import { ImageResponse } from "next/og";

import { DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/seo";

export const runtime = "edge";
export const alt = SITE_NAME;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #050505 0%, #111111 44%, #D6212A 100%)",
          color: "#ffffff",
          padding: "72px",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            fontSize: "34px",
            fontWeight: 700,
            letterSpacing: "0",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              backgroundColor: "#D6212A",
              border: "2px solid rgba(255,255,255,0.45)",
            }}
          />
          {SITE_NAME}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "26px",
            maxWidth: "860px",
          }}
        >
          <div
            style={{
              fontSize: "76px",
              lineHeight: 1,
              fontWeight: 900,
              letterSpacing: "0",
            }}
          >
            Discover what to watch next.
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.78)",
              fontSize: "28px",
              lineHeight: 1.35,
            }}
          >
            {DEFAULT_DESCRIPTION}
          </div>
        </div>
      </div>
    ),
    size
  );
}
