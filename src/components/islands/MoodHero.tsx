/**
 * Home hero — Figma 7:4 / mobile 15:2. Play mode (games) and Work mode (client apps).
 * Switching crossfades the copy and springs the phones into place. The choice is kept in
 * localStorage ("ak-mood") and pre-selects the matching filter on the Work page.
 * Desktop: phones float (±6px, 4s) and follow the mouse a little. Reduced motion: no float,
 * no parallax, instant swaps.
 */
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import MoodToggle, { type Mood } from './MoodToggle';
import PhoneMockup from './PhoneMockup';
import type { ResponsiveImage } from '../../lib/images';

export const MOOD_KEY = 'ak-mood';

type MoodCopy = { line1: string; line2: string; body: string; secondary: string; secondaryHref: string };
type Badge = { icon: ResponsiveImage; name: string; meta: string };
type MoodSet = { copy: MoodCopy; phones: [ResponsiveImage, ResponsiveImage, ResponsiveImage]; badge: Badge };

type Props = {
  play: MoodSet;
  work: MoodSet;
  primary: { label: string; href: string };
  toggleLabels: { group: string; play: string; work: string };
  sticker: ResponsiveImage;
  scratchSvg: string;
  phonesLabel: { play: string; work: string };
};

// Phone poses from the Figma "Hero art" frame (580 × 700 units): centre x/y, width, rotation.
const POSES = [
  { x: 93, y: 426, w: 250, r: 9, depth: 0.6 },
  { x: 315, y: 331, w: 280, r: 0, depth: 1 },
  { x: 530, y: 370, w: 250, r: -8, depth: 0.8 },
] as const;

export default function MoodHero({
  play,
  work,
  primary,
  toggleLabels,
  sticker,
  scratchSvg,
  phonesLabel,
}: Props) {
  const [mood, setMood] = useState<Mood>('play');
  const reduce = useReducedMotion();
  const set = mood === 'play' ? play : work;

  // Restore the visitor's last choice.
  useEffect(() => {
    const saved = localStorage.getItem(MOOD_KEY);
    if (saved === 'work' || saved === 'play') setMood(saved);
  }, []);

  const choose = (next: Mood) => {
    setMood(next);
    try {
      localStorage.setItem(MOOD_KEY, next);
    } catch {
      /* private mode: ignore */
    }
  };

  // Gentle mouse parallax (desktop pointers only).
  const artRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 20 });
  const sy = useSpring(my, { stiffness: 120, damping: 20 });
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType !== 'mouse' || !artRef.current) return;
    const r = artRef.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const fade = reduce
    ? { initial: false as const, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -12 },
        transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <div className="ak-hero">
      <div className="ak-hero__copy">
        <MoodToggle value={mood} onChange={choose} labels={toggleLabels} />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={mood} className="ak-hero__text" {...fade}>
            <h1 className="ak-hero__title">
              <span className="ak-hero__line1">{set.copy.line1}</span> <span>{set.copy.line2}</span>
            </h1>
            <p className="text-body-l">{set.copy.body}</p>
          </motion.div>
        </AnimatePresence>
        <div className="ak-hero__ctas">
          <a href={primary.href} className="ak-btn ak-btn--primary ak-btn--L">
            <span>{primary.label}</span>
            <svg
              className="ak-btn__arrow"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 10H16M11 15L16 10L11 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          <a href={set.copy.secondaryHref} className="ak-btn ak-btn--light ak-btn--L">
            <span>{set.copy.secondary}</span>
          </a>
        </div>
      </div>

      <div
        ref={artRef}
        className="ak-hero__art"
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        role="img"
        aria-label={mood === 'play' ? phonesLabel.play : phonesLabel.work}
      >
        <div
          className="ak-hero__scratch"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: scratchSvg }}
        />
        {POSES.map((pose, i) => (
          <Parallax key={i} sx={sx} sy={sy} depth={reduce ? 0 : pose.depth} pose={pose}>
            <AnimatePresence initial={false}>
              <motion.div
                key={`${mood}-${i}`}
                className="ak-hero__phone-anim"
                initial={
                  reduce ? { opacity: 0 } : { opacity: 0, y: 80, rotate: pose.r + (i - 1) * 10, scale: 0.92 }
                }
                animate={{ opacity: 1, y: 0, rotate: pose.r, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -40, scale: 0.96 }}
                transition={
                  reduce ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 22, delay: i * 0.06 }
                }
              >
                <div
                  className={reduce ? undefined : 'ak-hero__float'}
                  style={{ animationDelay: `${i * -1.3}s` }}
                >
                  <PhoneMockup
                    image={set.phones[i]!}
                    width="100%"
                    sizes="(min-width: 1024px) 280px, 30vw"
                    priority={i === 1}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </Parallax>
        ))}
        <img
          className="ak-hero__sticker"
          src={sticker.src}
          srcSet={sticker.srcSet}
          sizes="190px"
          width={sticker.width}
          height={sticker.height}
          alt=""
          decoding="async"
        />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={mood} className="ak-hero__badge" {...fade} aria-hidden="true">
            <img
              src={set.badge.icon.src}
              srcSet={set.badge.icon.srcSet}
              sizes="36px"
              width={36}
              height={36}
              alt=""
            />
            <span>
              <span className="ak-hero__badge-name">{set.badge.name}</span>
              <span className="ak-hero__badge-meta">{set.badge.meta}</span>
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Parallax({
  sx,
  sy,
  depth,
  pose,
  children,
}: {
  sx: ReturnType<typeof useSpring>;
  sy: ReturnType<typeof useSpring>;
  depth: number;
  pose: (typeof POSES)[number];
  children: React.ReactNode;
}) {
  const x = useTransform(sx, (v) => v * 24 * depth);
  const y = useTransform(sy, (v) => v * 18 * depth);
  return (
    <motion.div
      className="ak-hero__slot"
      style={{
        x,
        y,
        ['--x' as string]: pose.x,
        ['--y' as string]: pose.y,
        ['--w' as string]: pose.w,
        zIndex: pose.depth === 1 ? 2 : 1,
      }}
    >
      {children}
    </motion.div>
  );
}
