import sharp from "sharp";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const artwork =
  Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
<rect width="1200" height="630" fill="#f7f4ed"/>
<rect x="24" y="24" width="1152" height="582" rx="32" fill="none" stroke="#c5aa72" stroke-width="2"/>
<circle cx="600" cy="205" r="168" fill="#eee5d2"/>
<text x="600" y="449" text-anchor="middle" font-family="Arial, sans-serif" font-size="60" font-weight="700" fill="#2a1208">Caramel</text>
<text x="600" y="507" text-anchor="middle" direction="rtl" font-family="Arial, sans-serif" font-size="36" fill="#78552c">גן עדן לציליאקים</text>
<text x="600" y="566" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" letter-spacing="3" fill="#726b5c">caramel.darb.co.il</text>
</svg>`);
const logo = await sharp(`${root}public/Caramel_Assets/caramel-logo-master.png`)
  .resize(294, 294, { fit: "contain", background: "#00000000" })
  .toBuffer();
await sharp(artwork)
  .composite([{ input: logo, left: 453, top: 58 }])
  .png({ compressionLevel: 9, palette: true })
  .toFile(`${root}public/Caramel_Assets/social-preview-v1.png`);
