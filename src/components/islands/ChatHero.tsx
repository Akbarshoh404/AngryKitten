/**
 * Contact hero chat (Figma 13:617). The kitten asks "What are we building?"; tapping a quick
 * reply (or typing an idea) answers in the chat, pre-fills the form below and scrolls to it.
 */
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState, type SyntheticEvent } from 'react';

type Chip = { label: string; type: string };
type Labels = {
  label: string;
  name: string;
  status: string;
  hello: string;
  chips: Chip[];
  reply: string;
  replyTyped: string;
  placeholder: string;
  send: string;
  typing: string;
};
type Msg = { from: 'cat' | 'me'; text: string };

type Props = { labels: Labels; avatar: string; sticker: string; formId: string };

export default function ChatHero({ labels, avatar, sticker, formId }: Props) {
  const reduce = useReducedMotion();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(true);
  const [draft, setDraft] = useState('');
  const [answered, setAnswered] = useState(false);
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, reduce ? 0 : ms));

  useEffect(() => {
    later(() => {
      setTyping(false);
      setMessages([{ from: 'cat', text: labels.hello }]);
    }, 900);
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const answer = (text: string, detail: { type?: string; message?: string }, reply: string) => {
    setAnswered(true);
    setMessages((m) => [...m, { from: 'me', text }]);
    setTyping(true);
    // The form may not be hydrated yet (it loads when visible): leave the choice for it too.
    (window as unknown as { akPrefill?: typeof detail }).akPrefill = detail;
    window.dispatchEvent(new CustomEvent('ak:prefill', { detail }));
    later(() => {
      setTyping(false);
      setMessages((m) => [...m, { from: 'cat', text: reply }]);
      later(() => {
        document
          .getElementById(formId)
          ?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      }, 700);
    }, 900);
  };

  const onSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    answer(text, { message: text }, labels.replyTyped);
  };

  const bubble = reduce
    ? { initial: false as const, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0, y: 10, scale: 0.96 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { type: 'spring' as const, stiffness: 380, damping: 28 },
      };

  return (
    <section className="ak-chat" aria-label={labels.label}>
      <img className="ak-chat__sticker" src={sticker} width={140} height={140} alt="" decoding="async" />
      <header className="ak-chat__head">
        <img src={avatar} width={36} height={36} alt="" />
        <div>
          <p className="ak-chat__name">{labels.name}</p>
          <p className="ak-chat__status">{labels.status}</p>
        </div>
      </header>

      <div className="ak-chat__log" role="log" aria-live="polite">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.p key={i} className={`ak-chat__msg is-${m.from}`} {...bubble}>
              {m.text}
            </motion.p>
          ))}
        </AnimatePresence>
        {!answered && messages.length > 0 && (
          <motion.div className="ak-chat__chips" {...bubble}>
            {labels.chips.map((c) => (
              <button
                key={c.type}
                type="button"
                className="ak-chip"
                onClick={() => answer(c.label, { type: c.type }, labels.reply)}
              >
                <span className="ak-chip__label">{c.label}</span>
              </button>
            ))}
          </motion.div>
        )}
        {typing && (
          <p className="ak-chat__typing" aria-label={labels.typing}>
            <span />
            <span />
            <span />
          </p>
        )}
      </div>

      <form className="ak-chat__input" onSubmit={onSubmit}>
        <label htmlFor="ak-chat-draft" className="sr-only">
          {labels.placeholder}
        </label>
        <input
          id="ak-chat-draft"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={labels.placeholder}
          maxLength={300}
          autoComplete="off"
        />
        <button type="submit" aria-label={labels.send} disabled={!draft.trim()}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M4 10H16M11 15L16 10L11 5"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </form>
    </section>
  );
}
