import sharp from "sharp";

const SIZE = 160;
const PADDING = 32;
const RADIUS = 24;

const svg = `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${SIZE}" height="${SIZE}" rx="${RADIUS}" ry="${RADIUS}" fill="#e5a10e"/>
  <g transform="translate(${PADDING}, ${PADDING + 2}) scale(${(SIZE - PADDING * 2) / 122.88})">
    <path fill-rule="evenodd" clip-rule="evenodd"
      d="M12.35,121.46c-8.01-9.72-11.92-19.29-12.31-28.71C-0.78,73.01,10.92,58.28,28.3,47.67
      c18.28-11.16,37.08-13.93,55.36-22.25C92.79,21.27,103.68,14.47,121.8,0c5.92,15.69-12.92,40.9-43.52,54.23
      c9.48,0.37,19.69-2.54,30.85-9.74c-0.76,19.94-16.46,32.21-51.3,36.95c7.33,2.45,16.09,2.58,27.27-0.58
      C74.33,116.81,29.9,91.06,12.35,121.46L12.35,121.46z"
      fill="white"/>
  </g>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile("assets/logo.png");
console.log("assets/logo.png oluşturuldu");
