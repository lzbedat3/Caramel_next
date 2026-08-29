import { ImageResponse } from "next/og";

import { siteConfig } from "@/config/site";
import { isRemoteSvg } from "@/lib/storage-url";
import { getPublicSeoContent } from "@/services/public-seo";

export const alt = siteConfig.nameLocalized;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const pageBackground =
  "linear-gradient(135deg, #FFE7C2 0%, #FFB020 42%, #F07A12 78%, #1B8F4A 100%)";

function FallbackMark() {
  return (
    <div
      style={{
        width: 128,
        height: 128,
        borderRadius: 999,
        background: "#F07A12",
      }}
    />
  );
}

export default async function OpenGraphImage() {
  try {
    const { profile, logoSrc } = await getPublicSeoContent();
    const name = profile?.name?.trim() || siteConfig.nameLocalized;
    const subtitle = profile?.subtitle?.trim() || null;
    const showLogo = Boolean(logoSrc && !isRemoteSvg(logoSrc));

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
            background: pageBackground,
            color: "#2B1106",
            padding: 64,
          }}
        >
          {showLogo && logoSrc ? (
            <img
              src={logoSrc}
              alt=""
              width={128}
              height={128}
              style={{
                width: 128,
                height: 128,
                borderRadius: 999,
                objectFit: "cover",
                marginBottom: 36,
              }}
            />
          ) : (
            <div style={{ display: "flex", marginBottom: 36 }}>
              <FallbackMark />
            </div>
          )}
          <div
            style={{
              fontSize: name.length > 18 ? 64 : 84,
              fontWeight: 600,
              textAlign: "center",
              lineHeight: 1.15,
            }}
          >
            {name}
          </div>
          {subtitle ? (
            <div
              style={{
                marginTop: 18,
                fontSize: 30,
                color: "#8D4316",
                textAlign: "center",
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
      ),
      { ...size },
    );
  } catch {
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
            background: pageBackground,
            color: "#2B1106",
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 999,
              background: "#F07A12",
              marginBottom: 36,
            }}
          />
          <div style={{ fontSize: 88, fontWeight: 600 }}>
            {siteConfig.nameLocalized}
          </div>
        </div>
      ),
      { ...size },
    );
  }
}
