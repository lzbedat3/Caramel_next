import "server-only";

import sharp from "sharp";

import {
  COMPACT_SKIP_MAX_BYTES,
  WEB_IMAGE_OUTPUT_MIME,
  WEB_IMAGE_QUALITY,
} from "@/lib/media/web-image";

export type EncodedWebImage = {
  bytes: Buffer;
  mime: typeof WEB_IMAGE_OUTPUT_MIME;
};

export async function encodeWebImage(
  input: Buffer,
  maxEdge: number,
): Promise<EncodedWebImage | "skip" | null> {
  try {
    const pipeline = sharp(input, { failOn: "none" }).rotate();
    const meta = await pipeline.metadata();
    const output = pipeline.clone();

    if (meta.format === "gif" || meta.format === "svg") {
      return "skip";
    }

    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    const alreadyFit =
      input.byteLength <= COMPACT_SKIP_MAX_BYTES &&
      meta.format === "webp" &&
      width <= maxEdge &&
      height <= maxEdge;

    if (alreadyFit) {
      return "skip";
    }

    const bytes = await output
      .resize(maxEdge, maxEdge, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: WEB_IMAGE_QUALITY })
      .toBuffer();

    if (bytes.byteLength === 0) {
      return null;
    }

    return { bytes, mime: WEB_IMAGE_OUTPUT_MIME };
  } catch {
    return null;
  }
}
