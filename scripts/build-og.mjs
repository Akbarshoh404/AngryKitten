// Generates Open Graph / Twitter images (1200 × 630, tangerine style) into public/og/ (git-ignored).
// One image per page: home, work, services, studio, contact, press, privacy and every live app.
// Text comes from src/i18n/en.json and src/content/apps/*.md, so it stays in sync with the site.
// Runs before `npm run dev` / `npm run build`.
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { parse } from 'yaml';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';

const OUT = 'public/og';
const font = (pkg, file) => readFile(`node_modules/@fontsource/${pkg}/files/${file}`);
const fonts = [
  {
    name: 'Bricolage',
    data: await font('bricolage-grotesque', 'bricolage-grotesque-latin-800-normal.woff'),
    weight: 800,
  },
  {
    name: 'Bricolage',
    data: await font('bricolage-grotesque', 'bricolage-grotesque-latin-700-normal.woff'),
    weight: 700,
  },
  { name: 'DM Sans', data: await font('dm-sans', 'dm-sans-latin-500-normal.woff'), weight: 500 },
];
const C = { tabby: '#FF5A1F', ink: '#17110C', paper: '#FAF7F2', white: '#FFFFFF', gold: '#FFD43B' };
const dataUri = async (path, size) =>
  `data:image/png;base64,${(await sharp(path).resize(size, size).png().toBuffer()).toString('base64')}`;
const mark = await dataUri('src/assets/brand/mark.png', 160);

const h = (type, style, children) => ({ type, props: { style, children } });
const img = (src, size, style = {}) => ({ type: 'img', props: { src, width: size, height: size, style } });

/** "Small studio. **Sharp claws.**" → spans, highlighted part in white. */
function title(text, size) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return h(
    'div',
    {
      display: 'flex',
      flexWrap: 'wrap',
      fontFamily: 'Bricolage',
      fontWeight: 800,
      fontSize: size,
      lineHeight: 0.95,
      letterSpacing: -size * 0.03,
      color: C.ink,
    },
    parts.flatMap((p, i) =>
      p
        .split(' ')
        .filter(Boolean)
        .map((word) => h('span', { color: i % 2 ? C.white : C.ink, marginRight: size * 0.22 }, word)),
    ),
  );
}

function card({ eyebrow, heading, sub, icon }) {
  const size = heading.replace(/\*\*/g, '').length > 34 ? 76 : 92;
  const inner = h(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: 1200,
      height: 630,
      boxSizing: 'border-box',
      padding: 52,
      border: `12px solid ${C.ink}`,
      background: C.tabby,
      fontFamily: 'DM Sans',
    },
    [
      h('div', { display: 'flex', alignItems: 'center', gap: 16 }, [
        img(mark, 72),
        h('div', { display: 'flex', fontFamily: 'Bricolage', fontWeight: 700, fontSize: 40, color: C.ink }, [
          h('span', {}, 'angrykitten'),
          h('span', { color: C.paper }, '.'),
        ]),
      ]),
      h(
        'div',
        { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 48 },
        [
          h(
            'div',
            { display: 'flex', flexDirection: 'column', gap: 20, flex: 1, minWidth: 0 },
            [
              h(
                'div',
                { fontSize: 22, fontWeight: 500, letterSpacing: 3, textTransform: 'uppercase', color: C.ink },
                eyebrow,
              ),
              title(heading, size),
              sub ? h('div', { fontSize: 28, fontWeight: 500, color: C.ink, opacity: 0.85 }, sub) : null,
            ].filter(Boolean),
          ),
          icon
            ? h(
                'div',
                {
                  display: 'flex',
                  padding: 0,
                  border: `6px solid ${C.ink}`,
                  borderRadius: 56,
                  boxShadow: `12px 12px 0 ${C.ink}`,
                  overflow: 'hidden',
                  transform: 'rotate(-6deg)',
                  marginRight: 24,
                  flexShrink: 0,
                },
                [img(icon, 220)],
              )
            : null,
        ].filter(Boolean),
      ),
      h('div', { display: 'flex', fontSize: 24, fontWeight: 500, color: C.ink }, 'angrykitten.uz'),
    ],
  );
  return h('div', { display: 'flex', width: 1200, height: 630 }, [inner]);
}

async function render(name, node) {
  const svg = await satori(node, { width: 1200, height: 630, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  await writeFile(`${OUT}/${name}.png`, png);
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
const en = JSON.parse(await readFile('src/i18n/en.json', 'utf8'));

const pages = {
  home: { eyebrow: 'Independent app studio · Tashkent', heading: 'Apps and games **with claws.**' },
  work: { eyebrow: 'Work', heading: en.work.title },
  services: { eyebrow: en.servicesPage.eyebrow, heading: en.servicesPage.title },
  studio: { eyebrow: en.studio.eyebrow, heading: en.studio.title },
  contact: { eyebrow: en.contactPage.eyebrow, heading: en.contactPage.title },
  press: { eyebrow: en.press.eyebrow, heading: en.press.title },
  privacy: { eyebrow: 'Legal', heading: 'Privacy **policies.**' },
};
for (const [name, p] of Object.entries(pages)) await render(name, card(p));

let apps = 0;
for (const file of await readdir('src/content/apps')) {
  const src = await readFile(`src/content/apps/${file}`, 'utf8');
  const fm = parse(src.split('---')[1]);
  if (fm.status !== 'live') continue;
  const slug = file.replace(/\.md$/, '');
  const icon = await dataUri(`src/assets/apps/${slug}/icon.png`, 220).catch(() => undefined);
  await render(
    `work-${slug}`,
    card({ eyebrow: fm.text.en.meta, heading: fm.name, sub: fm.text.en.oneLiner, icon }),
  );
  apps++;
}
console.log(`og images: ${Object.keys(pages).length} pages + ${apps} apps`);
