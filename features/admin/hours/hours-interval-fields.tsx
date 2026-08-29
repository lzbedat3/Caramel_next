import { HOUR_NOTE_MAX_LENGTH, type HourIntervalFieldErrors } from "@/lib/admin/hours";
import { cn } from "@/lib/cn";

export const hoursInputClassName =
  "w-full rounded-control border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-caramel-deep";

type HoursIntervalFieldsProps = {
  idPrefix: string;
  opensAt?: string;
  closesAt?: string;
  note?: string;
  disabled?: boolean;
  errors?: HourIntervalFieldErrors;
};

export function HoursIntervalFields({
  idPrefix,
  opensAt = "",
  closesAt = "",
  note = "",
  disabled,
  errors,
}: HoursIntervalFieldsProps) {
  const opensId = `${idPrefix}-opens`;
  const closesId = `${idPrefix}-closes`;
  const noteId = `${idPrefix}-note`;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={opensId} className="text-sm font-medium text-foreground">
            פתיחה
            <span className="ms-1 text-caramel-deep" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id={opensId}
            name="opens_at"
            type="time"
            required
            dir="ltr"
            defaultValue={opensAt}
            disabled={disabled}
            aria-invalid={Boolean(errors?.opensAt)}
            aria-describedby={errors?.opensAt ? `${opensId}-error` : undefined}
            className={cn(hoursInputClassName, "font-mono")}
          />
          {errors?.opensAt ? (
            <p id={`${opensId}-error`} role="alert" className="text-sm text-caramel-deep">
              {errors.opensAt}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={closesId} className="text-sm font-medium text-foreground">
            סגירה
            <span className="ms-1 text-caramel-deep" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id={closesId}
            name="closes_at"
            type="time"
            required
            dir="ltr"
            defaultValue={closesAt}
            disabled={disabled}
            aria-invalid={Boolean(errors?.closesAt)}
            aria-describedby={errors?.closesAt ? `${closesId}-error` : undefined}
            className={cn(hoursInputClassName, "font-mono")}
          />
          {errors?.closesAt ? (
            <p id={`${closesId}-error`} role="alert" className="text-sm text-caramel-deep">
              {errors.closesAt}
            </p>
          ) : null}
        </div>
      </div>
      {errors?.interval ? (
        <p role="alert" className="text-sm text-caramel-deep">
          {errors.interval}
        </p>
      ) : (
        <p className="text-xs leading-5 text-muted-soft">
          אם שעת הסגירה מוקדמת משעת הפתיחה, המשמרת נחשבת לילית.
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={noteId} className="text-sm font-medium text-foreground">
          הערה
        </label>
        <input
          id={noteId}
          name="note"
          defaultValue={note}
          disabled={disabled}
          maxLength={HOUR_NOTE_MAX_LENGTH}
          aria-invalid={Boolean(errors?.note)}
          aria-describedby={errors?.note ? `${noteId}-error` : undefined}
          className={hoursInputClassName}
        />
        {errors?.note ? (
          <p id={`${noteId}-error`} role="alert" className="text-sm text-caramel-deep">
            {errors.note}
          </p>
        ) : null}
      </div>
    </div>
  );
}
