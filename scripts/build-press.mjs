// Builds the Press kit downloads into public/press/ (git-ignored) and writes
// src/generated/press-manifest.json (file sizes for the page).
//   - logos: full logo (dark + light text, PNG + SVG), mark on light / orange / dark, sticker
//   - apps/<slug>.zip: icon + banner + 3 screenshots for each live app
//   - logos.zip, app-assets.zip and angrykitten-press-kit.zip (everything + fact sheet)
// Runs automatically before `npm run dev` and `npm run build`.
import sharp from 'sharp';
import { zipSync } from 'fflate';
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT = 'public/press';
const APPS = 'src/assets/apps';
const BRAND = 'src/assets/brand';
const COLORS = { paper: '#FAF7F2', tabby: '#FF5A1F', night: '#2B1640', ink: '#17110C' };

await rm(OUT, { recursive: true, force: true });
await mkdir(`${OUT}/logos`, { recursive: true });
await mkdir(`${OUT}/apps`, { recursive: true });

const files = {}; // zip path -> bytes
const put = async (rel, buf) => {
  await mkdir(path.dirname(`${OUT}/${rel}`), { recursive: true });
  await writeFile(`${OUT}/${rel}`, buf);
  return buf;
};

/* ---- Logos ---- */
const logos = {};
async function markOn(bg) {
  const size = 1024;
  const mark = await sharp(`${BRAND}/mark.png`)
    .resize(Math.round(size * 0.7))
    .png()
    .toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toBuffer();
}
const svgDark = await readFile(`${BRAND}/press/logo-full.svg`);
const svgLight = await readFile(`${BRAND}/press/logo-full-light.svg`);
logos['angrykitten-logo.svg'] = svgDark;
logos['angrykitten-logo-light.svg'] = svgLight;
logos['angrykitten-logo.png'] = await sharp(svgDark, { density: 384 }).png().toBuffer();
logos['angrykitten-logo-light.png'] = await sharp(svgLight, { density: 384 }).png().toBuffer();
logos['mark-transparent.png'] = await readFile(`${BRAND}/mark.png`);
logos['mark-sticker.png'] = await readFile(`${BRAND}/sticker.png`);
logos['mark-on-light.png'] = await markOn(COLORS.paper);
logos['mark-on-orange.png'] = await markOn(COLORS.tabby);
logos['mark-on-dark.png'] = await markOn(COLORS.night);
for (const [name, buf] of Object.entries(logos)) {
  await put(`logos/${name}`, buf);
  files[`angrykitten-press-kit/logos/${name}`] = new Uint8Array(buf);
}
const logosZip = zipSync(
  Object.fromEntries(Object.entries(logos).map(([n, b]) => [`angrykitten-logos/${n}`, new Uint8Array(b)])),
  { level: 6 },
);
await put('logos.zip', logosZip);

/* ---- App assets ---- */
const appZips = {};
const all = {};
for (const slug of (await readdir(APPS)).sort()) {
  const dir = `${APPS}/${slug}`;
  const entries = {};
  for (const f of (await readdir(dir)).sort()) {
    const bytes = new Uint8Array(await readFile(`${dir}/${f}`));
    entries[`${slug}/${f}`] = bytes;
    all[`angrykitten-app-assets/${slug}/${f}`] = bytes;
    files[`angrykitten-press-kit/apps/${slug}/${f}`] = bytes;
  }
  // Images are already compressed: store, don't deflate.
  const zip = zipSync(entries, { level: 0 });
  await put(`apps/${slug}.zip`, zip);
  appZips[slug] = zip.byteLength;
}
const appAssetsZip = zipSync(all, { level: 0 });
await put('app-assets.zip', appAssetsZip);

/* ---- Fact sheet + everything ---- */
const en = JSON.parse(await readFile('src/i18n/en.json', 'utf8'));
const site = JSON.parse(await readFile('src/content/site.json', 'utf8'));
const press = en.press ?? {};
const factSheet = [
  'AngryKitten · Press fact sheet',
  '',
  'SHORT',
  press.shortVersion ?? '',
  '',
  'LONG',
  press.longVersion ?? '',
  '',
  ...(press.facts ?? []).map((f) => `${f.label}: ${f.value}`),
  '',
  `Press contact: ${site.email}`,
  'Brand colours: Tabby #FF5A1F · Ink #17110C · Warm Ivory #FAF7F2 · Plum Night #2B1640 · Gold #FFD43B',
  'Type: Bricolage Grotesque (headlines), DM Sans (body). Both free on Google Fonts.',
].join('\n');
files['angrykitten-press-kit/fact-sheet.txt'] = new TextEncoder().encode(factSheet);
const kit = zipSync(files, { level: 0 });
await put('angrykitten-press-kit.zip', kit);

/* ---- Manifest ---- */
const size = async (rel) => (await stat(`${OUT}/${rel}`)).size;
const manifest = {
  generated: new Date().toISOString().slice(0, 10),
  kit: await size('angrykitten-press-kit.zip'),
  logosZip: await size('logos.zip'),
  appAssetsZip: await size('app-assets.zip'),
  apps: appZips,
  logos: Object.fromEntries(
    await Promise.all(Object.keys(logos).map(async (n) => [n, await size(`logos/${n}`)])),
  ),
};
await mkdir('src/generated', { recursive: true });
await writeFile('src/generated/press-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(`press kit: ${(manifest.kit / 1e6).toFixed(1)} MB, ${Object.keys(appZips).length} app packs`);
