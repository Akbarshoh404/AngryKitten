// Generates the favicon set from the cat mark on a tabby background.
// Run: node scripts/build-favicons.mjs  (outputs to public/)
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

const MARK = 'src/assets/brand/mark.png';
const TABBY = { r: 255, g: 90, b: 31, alpha: 1 };

async function icon(size, { radius = 0.22, padding = 0.1 } = {}) {
  const inner = Math.round(size * (1 - padding * 2));
  const mark = await sharp(MARK).resize(inner, inner, { fit: 'contain' }).png().toBuffer();
  const r = Math.round(size * radius);
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" ry="${r}"/></svg>`,
  );
  return sharp({ create: { width: size, height: size, channels: 4, background: TABBY } })
    .composite([
      { input: mark, gravity: 'center' },
      { input: mask, blend: 'dest-in' },
    ])
    .png()
    .toBuffer();
}

const out = (name, buf) => writeFile(`public/${name}`, buf);
await out('favicon-32.png', await icon(32, { padding: 0.04 }));
await out('apple-touch-icon.png', await icon(180, { radius: 0, padding: 0.12 }));
await out('icon-192.png', await icon(192));
await out('icon-512.png', await icon(512));
await out('icon-maskable-512.png', await icon(512, { radius: 0, padding: 0.2 }));
await writeFile(
  'public/site.webmanifest',
  JSON.stringify(
    {
      name: 'AngryKitten',
      short_name: 'AngryKitten',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
      theme_color: '#ff5a1f',
      background_color: '#faf7f2',
      display: 'standalone',
      start_url: '/',
    },
    null,
    2,
  ) + '\n',
);
console.log('favicons written to public/');
