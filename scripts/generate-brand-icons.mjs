// Rebuilds every icon in public/Caramel_Assets from one square logo with a
// transparent background:  node scripts/generate-brand-icons.mjs path/to/logo.png
import sharp from "sharp";

const source = process.argv[2];
if (!source) {
  throw new Error("Pass the path of the logo PNG.");
}

const out = new URL("../public/Caramel_Assets/", import.meta.url).pathname;
// The page background of the menu; icons that cannot be transparent sit on it.
const DARK = { r: 13, g: 8, b: 6, alpha: 1 };
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };

const cut = await sharp(source).trim().png().toBuffer();
const { width = 0, height = 0 } = await sharp(cut).metadata();
// Background removal can eat into the white plate of the badge. A white disc
// under the artwork, kept inside the gold rim, closes any such hole.
const plate = Buffer.from(
  `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) * 0.45}" fill="#fffdf8"/></svg>`,
);
const trimmed = await sharp({
  create: { width, height, channels: 4, background: CLEAR },
})
  .composite([{ input: plate }, { input: cut }])
  .png()
  .toBuffer();

// The logo centred on a square canvas, filling `fill` of its side.
async function icon(size, fill, background) {
  const inner = Math.round(size * fill);
  const logo = await sharp(trimmed)
    .resize(inner, inner, { fit: "contain", background: CLEAR })
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background },
  }).composite([{ input: logo, gravity: "centre" }]);
}

const png = { compressionLevel: 9, palette: false };

for (const size of [16, 32, 48]) {
  await (
    await icon(size, 1, CLEAR)
  )
    .png(png)
    .toFile(`${out}favicon-${size}x${size}.png`);
}
for (const size of [192, 512]) {
  await (
    await icon(size, 1, CLEAR)
  )
    .png(png)
    .toFile(`${out}android-chrome-${size}x${size}.png`);
  // Maskable icons are cropped to a circle or squircle: the logo stays inside the safe zone.
  await (
    await icon(size, 0.74, DARK)
  )
    .png(png)
    .toFile(`${out}maskable-icon-${size}x${size}.png`);
}
// iOS paints transparency black and rounds the corners itself.
await (
  await icon(180, 0.9, DARK)
)
  .png(png)
  .toFile(`${out}apple-touch-icon.png`);
for (const size of [180, 512]) {
  await (
    await icon(size, 0.9, DARK)
  )
    .png(png)
    .toFile(`${out}app-icon-rounded-${size}x${size}.png`);
}
await (
  await icon(640, 1, CLEAR)
)
  .png(png)
  .toFile(`${out}caramel-logo-master.png`);
await (
  await icon(512, 1, CLEAR)
)
  .webp({ quality: 86 })
  .toFile(`${out}caramel-logo-splash.webp`);
await (
  await icon(240, 1, CLEAR)
)
  .webp({ quality: 84 })
  .toFile(`${out}caramel-logo-mark.webp`);
