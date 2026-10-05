// Bump the version whenever the files in public/Caramel_Assets are regenerated
// (scripts/generate-brand-icons.mjs), so browsers and installed apps refetch
// them. public/sw.js and public/offline.html carry the same value by hand.
const VERSION = "2";
const asset = (file: string) => `/Caramel_Assets/${file}?v=${VERSION}`;

export const brandAssets = {
  favicon32: asset("favicon-32x32.png"),
  favicon48: asset("favicon-48x48.png"),
  appleTouchIcon: asset("apple-touch-icon.png"),
  icon192: asset("android-chrome-192x192.png"),
  icon512: asset("android-chrome-512x512.png"),
  maskable192: asset("maskable-icon-192x192.png"),
  maskable512: asset("maskable-icon-512x512.png"),
  socialPreview: asset("social-preview-v1.png"),
  // The round badge: large for the splash, small inside the menu.
  logo: asset("caramel-logo-splash.webp"),
  logoMark: asset("caramel-logo-mark.webp"),
} as const;
