// Runs after `astro build` (npm "postbuild"). Adds security headers to dist/client/_headers,
// which Cloudflare serves for the static pages.
//
// The Content-Security-Policy allows scripts only from this site, Cloudflare Turnstile, and the
// exact inline scripts Astro emitted (hashed here, so the policy follows the build automatically).
// Inline styles stay allowed: components pass custom properties through style="--x:…" attributes.
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = 'dist/client';
const turnstile = 'https://challenges.cloudflare.com';

async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await htmlFiles(path)));
    else if (entry.name.endsWith('.html')) out.push(path);
  }
  return out;
}

// Inline, executable scripts only (no src, and not JSON-LD / JSON data blocks).
const scriptRe = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g;
const hashes = new Set();
for (const file of await htmlFiles(root)) {
  const html = await readFile(file, 'utf8');
  for (const [, attrs, body] of html.matchAll(scriptRe)) {
    const type = attrs.match(/type="([^"]+)"/)?.[1];
    if (type && type !== 'module' && type !== 'text/javascript') continue;
    if (!body.trim()) continue;
    hashes.add(`'sha256-${createHash('sha256').update(body).digest('base64')}'`);
  }
}

const csp = [
  "default-src 'self'",
  `script-src 'self' ${turnstile} ${[...hashes].sort().join(' ')}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self' ${turnstile}`,
  `frame-src ${turnstile}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

const block = `
/*
  Content-Security-Policy: ${csp}
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
  Cross-Origin-Opener-Policy: same-origin
`;

const path = join(root, '_headers');
let existing = '';
try {
  existing = await readFile(path, 'utf8');
} catch {
  // no adapter headers yet
}
const marker = '# security headers (scripts/build-headers.mjs)';
existing = existing.split(marker)[0].trimEnd();
await writeFile(path, `${existing}\n\n${marker}${block}`.trimStart());
console.log(`security headers: CSP with ${hashes.size} inline script hashes`);
