import { ImageResponse } from "next/og";

import { isRemoteSvg } from "@/lib/storage-url";
import { getPublicSeoContent } from "@/services/public-seo";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

function CaramelMark() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F07A12",
        borderRadius: 999,
      }}
    />
  );
}

export default async function Icon() {
  try {
    const { logoSrc } = await getPublicSeoContent();
    if (logoSrc && !isRemoteSvg(logoSrc)) {
      return new ImageResponse(
        (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#FFE7C2",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <img
              src={logoSrc}
              alt=""
              width={32}
              height={32}
              style={{ width: 32, height: 32, objectFit: "cover" }}
            />
          </div>
        ),
        { ...size },
      );
    }
  } catch {
    // Fall through to the branded mark.
  }

  return new ImageResponse(<CaramelMark />, { ...size });
}
