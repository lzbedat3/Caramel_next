import { cn } from "@/lib/cn";

type IconProps = {
  className?: string;
};

function IconFrame({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("size-5", className)}
    >
      {children}
    </svg>
  );
}

export function PinIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path
        d="M12 21s7-6.2 7-11.2A7 7 0 1 0 5 9.8C5 14.8 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.5" r="2.2" stroke="currentColor" strokeWidth="1.7" />
    </IconFrame>
  );
}

export function WazeIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path
        d="M12 3.5c-4.4 0-8 3.2-8 8.1 0 3.2 1.7 5.6 3.4 7.3.6.6 1.6.5 2.1-.2l1-1.4c.4-.5 1.1-.7 1.7-.4.7.3 1.5.3 2.2 0 .6-.3 1.3-.1 1.7.4l1 1.4c.5.7 1.5.8 2.1.2 1.7-1.7 3.4-4.1 3.4-7.3 0-4.9-3.6-8.1-8-8.1Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="9.2" cy="10.2" r="1.1" fill="currentColor" />
      <circle cx="14.8" cy="10.2" r="1.1" fill="currentColor" />
      <path
        d="M9.2 13.4c.8.8 1.8 1.2 2.8 1.2s2-.4 2.8-1.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </IconFrame>
  );
}

export function PhoneIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path
        d="M8.2 3.8h2.1c.6 0 1.1.4 1.2 1l.6 2.4c.1.5 0 1-.4 1.3L10.4 10a12.4 12.4 0 0 0 3.6 3.6l1.5-1.3c.4-.3.9-.4 1.3-.3l2.4.6c.6.1 1 .6 1 1.2v2.1c0 .7-.6 1.3-1.3 1.2C10.8 16.5 7.5 13.2 6.6 5.1c-.1-.7.5-1.3 1.2-1.3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </IconFrame>
  );
}

export function InstagramIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="16.6" cy="7.4" r="0.9" fill="currentColor" />
    </IconFrame>
  );
}

export function FacebookIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path
        d="M14 8.5h2.2V5.8h-2.2c-2.4 0-4 1.5-4 4V12H8v2.7h1.99V20h2.8v-5.3H15.4L16 12h-3.2V9.9c0-.8.4-1.4 1.2-1.4Z"
        fill="currentColor"
      />
    </IconFrame>
  );
}

export function TikTokIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path
        d="M14.2 4v9.1a3.3 3.3 0 1 1-2.4-3.2V7.3c.9 1.5 2.4 2.6 4.2 2.9V7.5A4.7 4.7 0 0 0 19 6.2V4h-4.8Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </IconFrame>
  );
}

export function WhatsAppIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path
        d="M12 4.5a7.5 7.5 0 0 0-6.4 11.3L5 19.5l3.8-.6A7.5 7.5 0 1 0 12 4.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M9.4 9.7c.2-.5.4-.5.7-.5h.6c.2 0 .4.1.5.4l.7 1.6c.1.3 0 .5-.2.7l-.4.4c-.1.1-.1.3 0 .5.4.7 1.1 1.4 1.9 1.8.2.1.4.1.5 0l.5-.4c.2-.2.5-.2.7-.1l1.5.7c.3.1.4.3.4.5v.6c0 .3 0 .5-.5.7-1 .4-3.2.4-5.5-1.8-2-2-2.3-4.1-2-5.2.1-.3.3-.4.6-.5Z"
        fill="currentColor"
      />
    </IconFrame>
  );
}

export function YouTubeIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path
        d="M20 9.2c-.2-1.2-1-2-2.2-2.2C16 6.7 12 6.7 12 6.7s-4 0-5.8.3C5 7.2 4.2 8 4 9.2 3.7 10.9 3.7 13 4 14.8c.2 1.2 1 2 2.2 2.2 1.8.3 5.8.3 5.8.3s4 0 5.8-.3c1.2-.2 2-1 2.2-2.2.3-1.8.3-3.9 0-5.6Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M10.8 14.2V9.8L15 12l-4.2 2.2Z" fill="currentColor" />
    </IconFrame>
  );
}

export function XIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path
        d="M5 5.8 10.6 12 5.3 18.2h1.9L11.4 13l3.4 5.2H19L13.1 11.7 18.1 5.8h-1.9l-3.8 4.8L9.3 5.8H5Z"
        fill="currentColor"
      />
    </IconFrame>
  );
}

export function GlobeIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M4.5 12h15M12 4.5c2.2 2.3 3.3 4.8 3.3 7.5S14.2 17.2 12 19.5C9.8 17.2 8.7 14.7 8.7 12S9.8 6.8 12 4.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </IconFrame>
  );
}

export function LinkIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path
        d="M10 14.5 8.8 15.7a3 3 0 0 1-4.2-4.2L6.7 9.3a3 3 0 0 1 4.3 0"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M14 9.5 15.2 8.3a3 3 0 1 1 4.2 4.2L17.3 14.7a3 3 0 0 1-4.3 0"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="m9.5 14.5 5-5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </IconFrame>
  );
}

export function DashboardIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <rect x="4" y="4" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.7" />
      <rect x="13" y="4" width="7" height="4.5" rx="1.6" stroke="currentColor" strokeWidth="1.7" />
      <rect x="13" y="11" width="7" height="9" rx="1.6" stroke="currentColor" strokeWidth="1.7" />
      <rect x="4" y="13.5" width="7" height="6.5" rx="1.6" stroke="currentColor" strokeWidth="1.7" />
    </IconFrame>
  );
}

export function StorefrontIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path
        d="M5 10.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M4 7.5 6.2 4h11.6L20 7.5v1.2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0V7.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </IconFrame>
  );
}

export function ImageIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <rect x="4" y="5" width="16" height="14" rx="2.2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="9" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="m8 16 3.2-3.2a1.2 1.2 0 0 1 1.6 0L16.5 16 19 13.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconFrame>
  );
}

export function CategoriesIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="16" cy="8" r="3" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="8" cy="16" r="3" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="16" cy="16" r="3" stroke="currentColor" strokeWidth="1.7" />
    </IconFrame>
  );
}

export function MenuListIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path
        d="M7 7h13M7 12h13M7 17h13"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="4" cy="7" r="1" fill="currentColor" />
      <circle cx="4" cy="12" r="1" fill="currentColor" />
      <circle cx="4" cy="17" r="1" fill="currentColor" />
    </IconFrame>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 8v4.2L15 15"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconFrame>
  );
}

export function ShareIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <circle cx="6.5" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17" cy="6.5" r="2.2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17" cy="17.5" r="2.2" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="m8.4 10.8 5.2-3.1M8.4 13.2l5.2 3.1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </IconFrame>
  );
}

export function BrandingIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.7" />
    </IconFrame>
  );
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 4.5v1.7M12 17.8v1.7M4.5 12h1.7M17.8 12h1.7M6.4 6.4l1.2 1.2M16.4 16.4l1.2 1.2M6.4 17.6l1.2-1.2M16.4 7.6l1.2-1.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </IconFrame>
  );
}

export function MenuGlyphIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path
        d="M5 7h14M5 12h14M5 17h14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </IconFrame>
  );
}

export function HeartIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path
        d="M12 20.4S4.4 15.6 2.7 11.2C1.2 7.4 3.1 4.2 6.6 4.2c1.9 0 3.3 1.1 4.1 2.6.8-1.5 2.2-2.6 4.1-2.6 3.5 0 5.4 3.2 3.9 7-1.7 4.4-9.3 9.2-9.3 9.2Z"
        fill="currentColor"
      />
    </IconFrame>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <IconFrame className={className}>
      <path
        d="M6 6 18 18M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </IconFrame>
  );
}
