/**
 * Phone with swipeable screenshots (case-study hero). Swipe/drag, arrow buttons and dots
 * (all keyboard-reachable buttons). Slides spring sideways; reduced motion swaps instantly.
 */
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import type { ResponsiveImage } from '../../lib/images';

type Props = {
  images: ResponsiveImage[];
  label: string;
  labels: { prev: string; next: string; goTo: string };
  width?: string;
};

export default function PhoneCarousel({ images, label, labels, width = '300px' }: Props) {
  const [[index, dir], setState] = useState<[number, number]>([0, 0]);
  const reduce = useReducedMotion();
  const count = images.length;
  const go = (next: number) => setState([(next + count) % count, next > index ? 1 : -1]);
  const img = images[index]!;
  const contain = img.width / img.height > 0.7;

  return (
    <div
      className="ak-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      style={{ ['--phone-w' as string]: width }}
    >
      <div className="ak-phone">
        <div className="ak-phone__body has-shadow">
          <div className="ak-phone__bezel" />
          <div className="ak-phone__screen">
            <AnimatePresence initial={false} custom={dir}>
              <motion.img
                key={index}
                custom={dir}
                src={img.src}
                srcSet={img.srcSet}
                sizes={width}
                width={img.width}
                height={img.height}
                alt={img.alt}
                className={['ak-phone__img', 'ak-carousel__img', contain && 'is-contain']
                  .filter(Boolean)
                  .join(' ')}
                draggable={false}
                drag={count > 1 ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.4}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -50) go(index + 1);
                  else if (info.offset.x > 50) go(index - 1);
                }}
                variants={{
                  enter: (d: number) => (reduce ? { opacity: 0 } : { x: d >= 0 ? '100%' : '-100%' }),
                  center: { x: 0, opacity: 1 },
                  exit: (d: number) => (reduce ? { opacity: 0 } : { x: d >= 0 ? '-100%' : '100%' }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 34 }}
              />
            </AnimatePresence>
          </div>
          <div className="ak-phone__glare" aria-hidden="true" />
          <div className="ak-phone__camera" aria-hidden="true" />
          <div className="ak-phone__btn ak-phone__btn--power" aria-hidden="true" />
          <div className="ak-phone__btn ak-phone__btn--volume" aria-hidden="true" />
        </div>
      </div>

      {count > 1 && (
        <div className="ak-carousel__controls">
          <button
            type="button"
            className="ak-carousel__arrow"
            aria-label={labels.prev}
            onClick={() => go(index - 1)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M16 10H4M9 15L4 10L9 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="ak-carousel__dots">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                className="ak-carousel__dot"
                aria-label={labels.goTo.replace('{n}', String(i + 1))}
                aria-current={i === index ? 'true' : undefined}
                onClick={() => go(i)}
              />
            ))}
          </div>
          <button
            type="button"
            className="ak-carousel__arrow"
            aria-label={labels.next}
            onClick={() => go(index + 1)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M4 10H16M11 15L16 10L11 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
