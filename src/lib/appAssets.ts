/**
 * App images, found by folder convention:
 *   src/assets/apps/<slug>/icon.(png|jpg|webp)
 *   src/assets/apps/<slug>/banner.(png|jpg|webp)
 *   src/assets/apps/<slug>/shot-1..3.(png|jpg|webp)
 * Drop the files in and every page that shows the app picks them up.
 */
import type { ImageMetadata } from 'astro';

const files = import.meta.glob<{ default: ImageMetadata }>('../assets/apps/*/*.{png,jpg,jpeg,webp}', {
  eager: true,
});

const bySlug = new Map<string, Map<string, ImageMetadata>>();
for (const [path, mod] of Object.entries(files)) {
  const match = path.match(/apps\/([^/]+)\/([^/.]+)\.\w+$/);
  if (!match) continue;
  const [, slug, name] = match;
  if (!bySlug.has(slug)) bySlug.set(slug, new Map());
  bySlug.get(slug)!.set(name, mod.default);
}

export type AppAssets = {
  icon?: ImageMetadata;
  banner?: ImageMetadata;
  screenshots: ImageMetadata[];
};

export function appAssets(slug: string): AppAssets {
  const set = bySlug.get(slug);
  return {
    icon: set?.get('icon'),
    banner: set?.get('banner'),
    screenshots: ['shot-1', 'shot-2', 'shot-3']
      .map((n) => set?.get(n))
      .filter((img): img is ImageMetadata => Boolean(img)),
  };
}
