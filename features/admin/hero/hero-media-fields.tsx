import { cn } from "@/lib/cn";

const inputClassName =
  "w-full rounded-control border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60";

type HeroMediaFieldsProps = {
  idPrefix: string;
  altText?: string;
  duration?: string;
  isVisible?: boolean;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  showVideoSettings: boolean;
  disabled?: boolean;
  durationError?: string;
};

export function HeroMediaFields({
  idPrefix,
  altText = "",
  duration = "",
  isVisible = true,
  autoplay = false,
  loop = false,
  muted = true,
  showVideoSettings,
  disabled,
  durationError,
}: HeroMediaFieldsProps) {
  const altId = `${idPrefix}-alt`;
  const durationId = `${idPrefix}-duration`;
  const visibleId = `${idPrefix}-visible`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={altId} className="text-sm font-medium text-foreground">
          טקסט חלופי
        </label>
        <input
          id={altId}
          name="alt_text"
          defaultValue={altText}
          disabled={disabled}
          className={inputClassName}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={durationId} className="text-sm font-medium text-foreground">
          משך תצוגה (שניות)
        </label>
        <input
          id={durationId}
          name="duration_seconds"
          inputMode="decimal"
          defaultValue={duration}
          disabled={disabled}
          aria-invalid={Boolean(durationError)}
          aria-describedby={
            durationError ? `${durationId}-error` : `${durationId}-hint`
          }
          className={inputClassName}
        />
        {durationError ? (
          <p
            id={`${durationId}-error`}
            role="alert"
            className="text-sm text-caramel-deep"
          >
            {durationError}
          </p>
        ) : (
          <p id={`${durationId}-hint`} className="text-xs text-muted-soft">
            ריק משתמש בברירת המחדל: 7 שניות לתמונה, 10 לסרטון.
          </p>
        )}
      </div>
      <label
        htmlFor={visibleId}
        className="flex cursor-pointer items-center gap-2 rounded-control px-1 py-1 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
      >
        <input
          id={visibleId}
          name="is_visible"
          type="checkbox"
          defaultChecked={isVisible}
          disabled={disabled}
          className="size-4 accent-caramel"
        />
        <span className="text-sm text-foreground">גלוי באתר הציבורי</span>
      </label>
      {showVideoSettings ? (
        <div className="grid gap-2 sm:grid-cols-3">
          <CheckField
            id={`${idPrefix}-autoplay`}
            name="autoplay"
            label="ניגון אוטומטי"
            defaultChecked={autoplay}
            disabled={disabled}
          />
          <CheckField
            id={`${idPrefix}-loop`}
            name="loop"
            label="לולאה"
            defaultChecked={loop}
            disabled={disabled}
          />
          <CheckField
            id={`${idPrefix}-muted`}
            name="muted"
            label="ללא קול"
            defaultChecked={muted}
            disabled={disabled}
          />
        </div>
      ) : null}
    </div>
  );
}

function CheckField({
  id,
  name,
  label,
  defaultChecked,
  disabled,
}: {
  id: string;
  name: string;
  label: string;
  defaultChecked: boolean;
  disabled?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-control px-1 py-1 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <input
        id={id}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="size-4 accent-caramel"
      />
      <span className="text-sm text-foreground">{label}</span>
    </label>
  );
}
