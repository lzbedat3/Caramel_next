import sharp from "sharp";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const artwork =
  Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
<defs>
<radialGradient id="glow" cx="50%" cy="38%" r="60%">
<stop offset="0" stop-color="#4a2408"/>
<stop offset="0.55" stop-color="#1a0d06"/>
<stop offset="1" stop-color="#0d0806"/>
</radialGradient>
</defs>
<rect width="1200" height="630" fill="url(#glow)"/>
<rect x="24" y="24" width="1152" height="582" rx="32" fill="none" stroke="#e9a43a" stroke-opacity="0.45" stroke-width="2"/>
<text x="600" y="508" text-anchor="middle" font-family="Arial, sans-serif" font-size="58" font-weight="700" fill="#f6ead7">Caramel · קרמל</text>
<text x="600" y="566" text-anchor="middle" direction="rtl" font-family="Arial, sans-serif" font-size="34" fill="#e9a43a">קונדיטוריה בעבודת יד ללא גלוטן</text>
</svg>`);
const logo = await sharp(`${root}public/Caramel_Assets/caramel-logo-master.png`)
  .resize(380, 380, { fit: "contain", background: "#00000000" })
  .toBuffer();
await sharp(artwork)
  .composite([{ input: logo, left: 410, top: 46 }])
  .png({ compressionLevel: 9 })
  .toFile(`${root}public/Caramel_Assets/social-preview-v1.png`);
