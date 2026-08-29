"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";

import { Button } from "@/components/ui/button";
import {
  HERO_ACCEPT,
  heroMediaTypeFromMime,
  resolveHeroMime,
  validateHeroFile,
  validateHeroMetadata,
  type HeroMediaType,
} from "@/lib/admin/hero";
import { cn } from "@/lib/cn";

import type { HeroActionState } from "./actions";
import { HeroMediaFields } from "./hero-media-fields";
import {
  removeUploadedHeroFile,
  uploadHeroFile,
} from "./storage-upload";

type HeroUploadFormProps = {
  disabled: boolean;
  onCreate: (formData: FormData) => Promise<HeroActionState>;
};

export function HeroUploadForm({ disabled, onCreate }: HeroUploadFormProps) {
  const formId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<HeroMediaType | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [durationError, setDurationError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const busy = disabled || uploading;

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function clearFile() {
    setFile(null);
    setMediaType(null);
    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return null;
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function applyFile(next: File | null) {
    if (!next) {
      return;
    }

    const error = validateHeroFile(next);
    if (error) {
      setFileError(error);
      clearFile();
      return;
    }

    const mime = resolveHeroMime(next);
    const type = mime ? heroMediaTypeFromMime(mime) : null;
    if (!type) {
      setFileError("סוג הקובץ אינו נתמך");
      return;
    }

    setFileError(null);
    setFile(next);
    setMediaType(type);
    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return URL.createObjectURL(next);
    });
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    applyFile(event.target.files?.[0] ?? null);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    applyFile(event.dataTransfer.files[0] ?? null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const metadata = {
      altText: String(formData.get("alt_text") ?? ""),
      duration: String(formData.get("duration_seconds") ?? ""),
      isVisible: formData.get("is_visible") === "on",
      autoplay: formData.get("autoplay") === "on",
      loop: formData.get("loop") === "on",
      muted: formData.get("muted") === "on",
    };

    const nextErrors = validateHeroMetadata(metadata);
    if (!file) {
      setFileError("בחרו תמונה או סרטון להעלאה");
      return;
    }
    if (nextErrors.duration) {
      setDurationError(nextErrors.duration);
      return;
    }

    setDurationError(null);
    setFileError(null);
    setUploading(true);

    const uploaded = await uploadHeroFile(file);
    if ("error" in uploaded) {
      setFileError(uploaded.error);
      setUploading(false);
      return;
    }

    formData.set("storage_path", uploaded.path);
    const result = await onCreate(formData);
    if (result.status === "error") {
      await removeUploadedHeroFile(uploaded.path);
      setUploading(false);
      return;
    }

    form.reset();
    clearFile();
    setUploading(false);
  }

  return (
    <form
      onSubmit={onSubmit}
      aria-busy={busy}
      className="rounded-card border border-border bg-surface px-5 py-5 sm:px-6"
    >
      <h2 className="text-base font-medium text-foreground">הוספת מדיה</h2>
      <p className="mt-1 text-sm leading-6 text-muted">
        תמונה או סרטון להירו. JPG, PNG, WebP, AVIF, GIF, MP4, WebM או MOV. עד
        50MB.
      </p>

      <input
        ref={fileInputRef}
        id={`${formId}-file`}
        type="file"
        accept={HERO_ACCEPT}
        onChange={onFileChange}
        disabled={busy}
        className="peer sr-only"
      />
      <label
        htmlFor={`${formId}-file`}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "mt-4 flex min-h-36 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-control border border-dashed border-border bg-surface-warm/40 px-4 py-6 text-center transition peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
          dragging && "border-caramel bg-caramel-soft/40",
          busy && "pointer-events-none opacity-60",
        )}
      >
        {previewUrl && mediaType ? (
          <span className="relative block h-32 w-full max-w-sm overflow-hidden rounded-control">
            {mediaType === "video" ? (
              <video
                src={previewUrl}
                className="size-full object-cover"
                muted
                playsInline
                preload="metadata"
              />
            ) : (
              // Local blob preview is not in the remote image loader.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt=""
                className="size-full object-cover"
              />
            )}
          </span>
        ) : (
          <span className="text-sm text-muted">
            גררו קובץ לכאן או לחצו לבחירה
          </span>
        )}
        {file ? (
          <span className="mt-3 text-xs text-muted-soft">{file.name}</span>
        ) : null}
      </label>
      {fileError ? (
        <p role="alert" className="mt-2 text-sm text-caramel-deep">
          {fileError}
        </p>
      ) : null}

      <div className="mt-5">
        <HeroMediaFields
          idPrefix={formId}
          showVideoSettings={mediaType === "video"}
          disabled={busy}
          durationError={durationError ?? undefined}
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button type="submit" disabled={busy || !file}>
          {uploading ? "מעלה…" : "הוספה להירו"}
        </Button>
        {file ? (
          <Button type="button" variant="ghost" disabled={busy} onClick={clearFile}>
            ביטול קובץ
          </Button>
        ) : null}
      </div>
    </form>
  );
}
