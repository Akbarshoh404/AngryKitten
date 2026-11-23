/** React twin of Phone.astro (same markup and classes) for use inside islands. */
import type { CSSProperties } from 'react';
import type { ResponsiveImage } from '../../lib/images';

type Props = {
  image: ResponsiveImage;
  width?: string;
  sizes?: string;
  priority?: boolean;
  style?: CSSProperties;
  className?: string;
};

export default function PhoneMockup({
  image,
  width = '320px',
  sizes = '320px',
  priority,
  style,
  className,
}: Props) {
  return (
    <div
      className={['ak-phone', className].filter(Boolean).join(' ')}
      style={{ ['--phone-w' as string]: width, ...style }}
    >
      <div className="ak-phone__body has-shadow">
        <div className="ak-phone__bezel" />
        <div className="ak-phone__screen">
          <img
            src={image.src}
            srcSet={image.srcSet}
            sizes={sizes}
            width={image.width}
            height={image.height}
            alt={image.alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            {...(priority ? { fetchPriority: 'high' as const } : {})}
            className={['ak-phone__img', image.width / image.height > 0.7 && 'is-contain']
              .filter(Boolean)
              .join(' ')}
          />
        </div>
        <div className="ak-phone__glare" aria-hidden="true" />
        <div className="ak-phone__camera" aria-hidden="true" />
        <div className="ak-phone__btn ak-phone__btn--power" aria-hidden="true" />
        <div className="ak-phone__btn ak-phone__btn--volume" aria-hidden="true" />
      </div>
    </div>
  );
}
