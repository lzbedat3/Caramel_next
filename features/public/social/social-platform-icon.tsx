import type { ComponentType } from "react";

import type { SocialPlatform } from "@/lib/social";
import {
  FacebookIcon,
  GlobeIcon,
  InstagramIcon,
  LinkIcon,
  TikTokIcon,
  WhatsAppIcon,
  XIcon,
  YouTubeIcon,
} from "@/components/icons";

const ICONS: Record<SocialPlatform, ComponentType<{ className?: string }>> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  tiktok: TikTokIcon,
  whatsapp: WhatsAppIcon,
  youtube: YouTubeIcon,
  x: XIcon,
  website: GlobeIcon,
  other: LinkIcon,
};

export function SocialPlatformIcon({
  platform,
  className,
}: {
  platform: SocialPlatform;
  className?: string;
}) {
  const Icon = ICONS[platform] ?? LinkIcon;
  return <Icon className={className} />;
}
