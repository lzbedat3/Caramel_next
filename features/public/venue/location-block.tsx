import { PinIcon, WazeIcon } from "@/components/icons";
import { buttonClassName } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type LocationBlockProps = {
  address: string | null;
  wazeUrl: string | null;
};

export function LocationBlock({ address, wazeUrl }: LocationBlockProps) {
  if (!address && !wazeUrl) {
    return null;
  }

  const isHttpWaze = Boolean(wazeUrl && /^https?:/i.test(wazeUrl));

  return (
    <div id="location" className="scroll-mt-8">
      <h2 className="font-display text-3xl leading-tight text-foreground sm:text-4xl">
        איך מגיעים
      </h2>
      {address ? (
        <p className="mt-5 flex items-start gap-3 text-lg leading-8 text-foreground">
          <PinIcon className="mt-1 size-5 shrink-0 text-caramel-deep" />
          <span>{address}</span>
        </p>
      ) : null}
      {wazeUrl ? (
        <a
          href={wazeUrl}
          target={isHttpWaze ? "_blank" : undefined}
          rel={isHttpWaze ? "noopener noreferrer" : undefined}
          className={cn(buttonClassName("primary"), "mt-6 gap-2")}
          aria-label={
            address ? `ניווט ל${address} ב-Waze` : "ניווט ב-Waze"
          }
        >
          <WazeIcon className="size-5" />
          ניווט ב-Waze
        </a>
      ) : null}
    </div>
  );
}
