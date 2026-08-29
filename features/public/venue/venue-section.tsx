import { cn } from "@/lib/cn";
import { PublicSection } from "@/components/public/section";
import { HoursList } from "@/features/public/venue/hours-list";
import { LocationBlock } from "@/features/public/venue/location-block";
import type { WeekdayHoursRow } from "@/lib/opening-hours";

type VenueSectionProps = {
  address: string | null;
  wazeUrl: string | null;
  hourRows: WeekdayHoursRow[];
};

export function VenueSection({
  address,
  wazeUrl,
  hourRows,
}: VenueSectionProps) {
  const hasLocation = Boolean(address || wazeUrl);
  const hasHours = hourRows.length > 0;

  if (!hasLocation && !hasHours) {
    return null;
  }

  return (
    <PublicSection
      aria-label="מיקום ושעות"
      className="pb-16 sm:pb-20"
      containerClassName={cn(
        "grid gap-12 lg:items-start",
        hasLocation && hasHours && "lg:grid-cols-2 lg:gap-20",
      )}
    >
      {hasLocation ? (
        <LocationBlock address={address} wazeUrl={wazeUrl} />
      ) : null}
      {hasHours ? <HoursList rows={hourRows} /> : null}
    </PublicSection>
  );
}
