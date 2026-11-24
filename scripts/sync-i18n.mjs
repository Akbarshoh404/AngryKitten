// Keeps uz.json and ru.json in step with en.json.
//  - Keys missing in a locale are added in English (shown until someone translates them).
//  - Values that are still the untranslated English copy are refreshed when the English changes.
//  - Real translations (anything that differs from the English it was copied from) are never touched.
// The English used for the last sync is stored in src/i18n/.en-snapshot.json.
// Run: npm run i18n:sync
import { readFile, writeFile } from 'node:fs/promises';

const dir = 'src/i18n';
const read = async (f, fallback) => {
  try {
    return JSON.parse(await readFile(`${dir}/${f}`, 'utf8'));
  } catch {
    return fallback;
  }
};
const en = await read('en.json');
const snapshot = await read('.en-snapshot.json', null);

function merge(base, target, snap) {
  if (Array.isArray(base)) return base.map((v, i) => merge(v, target?.[i], snap?.[i]));
  if (base && typeof base === 'object') {
    const out = {};
    if (target && typeof target === 'object')
      for (const k of Object.keys(target)) if (k.startsWith('_')) out[k] = target[k];
    for (const [k, v] of Object.entries(base)) out[k] = merge(v, target?.[k], snap?.[k]);
    return out;
  }
  if (target === undefined) return base; // missing → English
  if (snap !== undefined && target === snap) return base; // still the English copy → refresh
  if (snapshot === null && typeof target === 'string' && target === base) return base;
  return target; // translated
}

for (const l of ['uz', 'ru']) {
  const merged = merge(en, await read(`${l}.json`, {}), snapshot);
  await writeFile(`${dir}/${l}.json`, JSON.stringify(merged, null, 2) + '\n');
  console.log(`synced ${l}.json`);
}
await writeFile(`${dir}/.en-snapshot.json`, JSON.stringify(en, null, 2) + '\n');
