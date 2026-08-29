import { Constants, type Enums } from "@/types/database";

export type SocialPlatform = Enums<"social_platform">;

export type PublicSocialLink = {
  id: number;
  platform: SocialPlatform;
  url: string;
};

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  ...Constants.public.Enums.social_platform,
];

export const SOCIAL_LABELS_HE: Record<SocialPlatform, string> = {
  instagram: "אינסטגרם",
  facebook: "פייסבוק",
  tiktok: "טיקטוק",
  whatsapp: "וואטסאפ",
  youtube: "יוטיוב",
  x: "X",
  website: "אתר",
  other: "קישור",
};

export function socialLabel(platform: SocialPlatform): string {
  return SOCIAL_LABELS_HE[platform];
}
