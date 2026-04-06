import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon512() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#030712",
          borderRadius: 96,
        }}
      >
        <svg
          viewBox="0 0 32 32"
          width="380"
          height="380"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 18C6 11.373 11.373 6 18 6c5.523 0 10 4.477 10 10v4"
            stroke="#FF6B6B"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <rect x="4" y="17" width="5" height="9" rx="2.5" fill="#FF6B6B" />
          <rect x="25" y="17" width="5" height="9" rx="2.5" fill="#FF6B6B" />
          <rect x="13" y="19" width="1.5" height="5" rx="0.75" fill="#FF6B6B" opacity="0.6" />
          <rect x="16" y="17" width="1.5" height="9" rx="0.75" fill="#FF6B6B" opacity="0.8" />
          <rect x="19" y="18" width="1.5" height="7" rx="0.75" fill="#FF6B6B" opacity="0.6" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
