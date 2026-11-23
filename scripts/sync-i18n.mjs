// Adds keys that exist in en.json but are missing in uz.json / ru.json (copied in English),
// so every locale has the full set. Existing translations are never overwritten.
// Run: npm run i18n:sync
import { readFile, writeFile } from 'node:fs/promises';

const read = async (l) => JSON.parse(await readFile(`src/i18n/${l}.json`, 'utf8'));
const en = await read('en');

function merge(base, target) {
  const out = Array.isArray(base) ? [] : {};
  if (!Array.isArray(base) && target && '_TODO' in target) out._TODO = target._TODO;
  for (const [k, v] of Object.entries(base)) {
    const t = target?.[k];
    out[k] = v && typeof v === 'object' ? merge(v, t ?? (Array.isArray(v) ? [] : {})) : (t ?? v);
  }
  return out;
}
for (const l of ['uz', 'ru']) {
  const merged = merge(en, await read(l));
  await writeFile(`src/i18n/${l}.json`, JSON.stringify(merged, null, 2) + '\n');
  console.log(`synced ${l}.json`);
}
