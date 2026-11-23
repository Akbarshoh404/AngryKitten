/**
 * "Build your app" card — Services hero (Figma 34:829). Pick what you need, flip a few switches,
 * and "Get a proposal" opens the contact form pre-filled with that brief.
 */
import { motion, useReducedMotion } from 'motion/react';
import { useId, useState } from 'react';

type Labels = {
  eyebrow: string;
  title: string;
  options: Record<string, string>;
  toggles: Record<string, string>;
  button: string;
  summary: string;
  nothing: string;
  messageIntro: string;
};

type Props = { labels: Labels; contactHref: string };

// Builder options that match a contact-form project type.
const FORM_TYPE: Record<string, string> = {
  mobile: 'mobile',
  game: 'game',
  design: 'design',
  website: 'website',
};

export default function BuildYourAppCard({ labels, contactHref }: Props) {
  const uid = useId();
  const reduce = useReducedMotion();
  const [options, setOptions] = useState<string[]>(['mobile', 'design']);
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    offline: true,
    languages: true,
    dark: false,
  });

  const toggleOption = (key: string) =>
    setOptions((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const items = [
    ...options.map((o) => labels.options[o]),
    ...Object.entries(toggles)
      .filter(([, on]) => on)
      .map(([k]) => labels.toggles[k]),
  ].filter(Boolean) as string[];

  const href = (() => {
    const url = new URL(contactHref, 'https://x.local');
    const type = options.map((o) => FORM_TYPE[o]).find(Boolean);
    if (type) url.searchParams.set('type', type);
    url.searchParams.set('brief', `${labels.messageIntro} ${items.join(', ')}.`);
    return url.pathname + url.search + url.hash;
  })();

  return (
    <motion.div
      className="ak-builder"
      initial={reduce ? false : { rotate: -2, y: 12, opacity: 0 }}
      animate={{ rotate: -2, y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      <p className="text-eyebrow text-fg-accent">{labels.eyebrow}</p>
      <h2 className="text-h3">{labels.title}</h2>

      <div className="ak-builder__options" role="group" aria-label={labels.title}>
        {Object.entries(labels.options).map(([key, label]) => {
          const on = options.includes(key);
          return (
            <button
              key={key}
              type="button"
              className="ak-chip"
              aria-pressed={on}
              onClick={() => toggleOption(key)}
            >
              <span className="ak-chip__label">
                {on && <span aria-hidden="true">✓ </span>}
                {label}
              </span>
            </button>
          );
        })}
      </div>

      <ul className="ak-builder__toggles">
        {Object.entries(labels.toggles).map(([key, label]) => (
          <li key={key}>
            <label htmlFor={`${uid}-${key}`}>{label}</label>
            <button
              id={`${uid}-${key}`}
              type="button"
              role="switch"
              aria-checked={toggles[key]}
              className="ak-switch"
              onClick={() => setToggles((t) => ({ ...t, [key]: !t[key] }))}
            >
              <span className="ak-switch__thumb" />
            </button>
          </li>
        ))}
      </ul>

      <p className="text-meta text-fg-2" aria-live="polite">
        {options.length ? labels.summary.replace('{items}', items.join(' · ')) : labels.nothing}
      </p>

      {options.length > 0 ? (
        <a href={href} className="ak-btn ak-btn--accent ak-btn--M ak-btn--block">
          <span>{labels.button}</span>
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
      ) : (
        <button type="button" className="ak-btn ak-btn--accent ak-btn--M ak-btn--block" disabled>
          <span>{labels.button}</span>
        </button>
      )}
    </motion.div>
  );
}
