import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

/** A pre-optimized image that React islands can render as a plain <img>. */
export type ResponsiveImage = { src: string; srcSet: string; width: number; height: number; alt: string };

/** Optimizes an image at build time (WebP, several widths) for use inside islands. */
export async function responsive(
  image: ImageMetadata,
  alt: string,
  widths: number[] = [240, 360, 480, 720],
): Promise<ResponsiveImage> {
  const usable = widths.filter((w) => w <= image.width);
  const result = await getImage({
    src: image,
    widths: usable.length ? usable : [image.width],
    format: 'webp',
  });
  return {
    src: result.src,
    srcSet: result.srcSet.attribute,
    width: image.width,
    height: image.height,
    alt,
  };
}
