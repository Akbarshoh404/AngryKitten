/**
 * Mood toggle — Figma 33:29 (State=Play / State=Work).
 * Ink pill with a gold thumb that springs between the two options.
 * Controlled component: the Home hero island owns the state.
 */
import { motion, useReducedMotion } from 'motion/react';
import { useId } from 'react';

export type Mood = 'play' | 'work';

type Props = {
  value: Mood;
  onChange: (mood: Mood) => void;
  labels: { group: string; play: string; work: string };
  className?: string;
};

export default function MoodToggle({ value, onChange, labels, className }: Props) {
  const reduce = useReducedMotion();
  const layoutId = useId();
  const options: Mood[] = ['play', 'work'];

  return (
    <div role="group" aria-label={labels.group} className={['ak-mood', className].filter(Boolean).join(' ')}>
      {options.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            className="ak-mood__option"
            onClick={() => onChange(option)}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="ak-mood__thumb"
                transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 520, damping: 34 }}
                aria-hidden="true"
              />
            )}
            <span className="ak-mood__label">{labels[option]}</span>
          </button>
        );
      })}
    </div>
  );
}
