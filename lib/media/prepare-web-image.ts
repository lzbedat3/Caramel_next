import {
  WEB_IMAGE_OUTPUT_MIME,
  WEB_IMAGE_QUALITY,
  shouldPrepareImage,
} from "@/lib/media/web-image";

function outputFileName(name: string): string {
  const base = name.replace(/\.[^.]+$/, "").trim() || "image";
  return `${base}.webp`;
}

export async function prepareWebImage(
  file: File,
  maxEdge: number,
): Promise<File> {
  const namedGif = file.name.toLowerCase().endsWith(".gif");
  const namedSvg = file.name.toLowerCase().endsWith(".svg");
  if (namedGif || namedSvg) {
    return file;
  }

  if (file.type && !shouldPrepareImage(file.type)) {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
  } catch {
    return file;
  }

  try {
    const longest = Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(1, maxEdge / longest);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      return file;
    }

    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, WEB_IMAGE_OUTPUT_MIME, WEB_IMAGE_QUALITY / 100);
    });

    if (!blob || blob.size === 0) {
      return file;
    }

    if (
      blob.size >= file.size &&
      scale === 1 &&
      file.type === WEB_IMAGE_OUTPUT_MIME
    ) {
      return file;
    }

    return new File([blob], outputFileName(file.name), {
      type: WEB_IMAGE_OUTPUT_MIME,
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}
