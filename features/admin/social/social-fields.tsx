import { isSocialPlatform } from "@/lib/admin/social";
import { cn } from "@/lib/cn";
import { SOCIAL_PLATFORMS, socialLabel, type SocialPlatform } from "@/lib/social";

export const socialInputClassName =
  "w-full rounded-control border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-caramel-deep";

type SocialFieldsProps = {
  idPrefix: string;
  platform?: SocialPlatform;
  url?: string;
  platformError?: string;
  urlError?: string;
  disabled?: boolean;
  onPlatformChange: (platform: SocialPlatform) => void;
};

export function SocialFields({
  idPrefix,
  platform = "instagram",
  url = "",
  platformError,
  urlError,
  disabled,
  onPlatformChange,
}: SocialFieldsProps) {
  const platformId = `${idPrefix}-platform`;
  const urlId = `${idPrefix}-url`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={platformId} className="text-sm font-medium text-foreground">
          פלטפורמה
          <span className="ms-1 text-caramel-deep" aria-hidden="true">
            *
          </span>
        </label>
        <select
          id={platformId}
          name="platform"
          required
          value={platform}
          disabled={disabled}
          aria-invalid={Boolean(platformError)}
          aria-describedby={platformError ? `${platformId}-error` : undefined}
          className={socialInputClassName}
          onChange={(event) => {
            const next = event.target.value;
            if (isSocialPlatform(next)) {
              onPlatformChange(next);
            }
          }}
        >
          {SOCIAL_PLATFORMS.map((value) => (
            <option key={value} value={value}>
              {socialLabel(value)}
            </option>
          ))}
        </select>
        {platformError ? (
          <p id={`${platformId}-error`} role="alert" className="text-sm text-caramel-deep">
            {platformError}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={urlId} className="text-sm font-medium text-foreground">
          קישור
          <span className="ms-1 text-caramel-deep" aria-hidden="true">
            *
          </span>
        </label>
        <input
          id={urlId}
          name="url"
          type="text"
          required
          dir="ltr"
          inputMode="url"
          autoComplete="url"
          placeholder="https://"
          defaultValue={url}
          disabled={disabled}
          aria-invalid={Boolean(urlError)}
          aria-describedby={urlError ? `${urlId}-error` : undefined}
          className={cn(socialInputClassName, "font-mono")}
        />
        {urlError ? (
          <p id={`${urlId}-error`} role="alert" className="text-sm text-caramel-deep">
            {urlError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
