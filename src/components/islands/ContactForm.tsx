/**
 * Contact form — Home "Quick message" (Figma 38:908) and Contact page form (13:650).
 * Chips for project type (and budget on the full form), inline validation, loading and a
 * playful success state. Posts JSON to /api/contact (Telegram + optional email).
 * Spam protection: honeypot field + Cloudflare Turnstile when PUBLIC_TURNSTILE_SITE_KEY is set.
 * Other islands can pre-fill it: window.dispatchEvent(new CustomEvent('ak:prefill', { detail: { type: 'game' } })).
 */
import { useEffect, useId, useRef, useState, type SyntheticEvent } from 'react';

type Labels = {
  quickTitle: string;
  typeLabel: string;
  types: Record<string, string>;
  budgetLabel: string;
  budgets: Record<string, string>;
  name: string;
  namePlaceholder: string;
  contactField: string;
  contactPlaceholder: string;
  company: string;
  optional: string;
  message: string;
  messagePlaceholder: string;
  send: string;
  sending: string;
  errors: { name: string; contact: string; message: string; generic: string };
  successTitle: string;
  successBody: string;
  sendAnother: string;
};

type Props = {
  variant: 'quick' | 'full';
  labels: Labels;
  locale: string;
  replyTime: string;
  email: string;
  turnstileSiteKey?: string;
  /** Show the "Quick message" title inside the card (Home). */
  showTitle?: boolean;
  /** Small cat sticker shown in the success state. */
  successImage?: string;
};

type Errors = Partial<Record<'name' | 'contact' | 'message' | 'form', string>>;

const QUICK_TYPES = ['mobile', 'game', 'website', 'design', 'notSure'];
const FULL_TYPES = ['mobile', 'game', 'website', 'design', 'update', 'notSure'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TELEGRAM = /^(@|https?:\/\/t\.me\/|t\.me\/)?[a-zA-Z0-9_]{5,32}$/;

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
    };
  }
}

export default function ContactForm({
  variant,
  labels,
  locale,
  replyTime,
  email,
  turnstileSiteKey,
  showTitle,
  successImage,
}: Props) {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const types = variant === 'quick' ? QUICK_TYPES : FULL_TYPES;

  const [selected, setSelected] = useState<string[]>([]);
  const [budget, setBudget] = useState<string>('');
  const [values, setValues] = useState({ name: '', contact: '', company: '', message: '', website: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [token, setToken] = useState('');
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const successRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Pre-fill from ?type=… and from other islands (Contact chat hero).
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fromUrl = params.get('type');
    if (fromUrl && types.includes(fromUrl)) setSelected([fromUrl]);
    const brief = params.get('brief');
    if (brief) setValues((v) => ({ ...v, message: v.message || brief.slice(0, 600) }));
    const onPrefill = (e: Event) => {
      const detail = (e as CustomEvent<{ type?: string; message?: string }>).detail ?? {};
      if (detail.type && types.includes(detail.type)) setSelected([detail.type]);
      if (detail.message) setValues((v) => ({ ...v, message: v.message || detail.message! }));
      setStatus('idle');
    };
    window.addEventListener('ak:prefill', onPrefill);
    return () => window.removeEventListener('ak:prefill', onPrefill);
  }, []);

  // Cloudflare Turnstile (only when a site key is configured).
  useEffect(() => {
    if (!turnstileSiteKey || !turnstileRef.current) return;
    const render = () => {
      if (!window.turnstile || !turnstileRef.current || widgetId.current) return;
      widgetId.current = window.turnstile.render(turnstileRef.current, {
        sitekey: turnstileSiteKey,
        callback: (t: string) => setToken(t),
        'expired-callback': () => setToken(''),
        appearance: 'interaction-only',
        language: locale,
      });
    };
    if (window.turnstile) return render();
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.defer = true;
    s.onload = render;
    document.head.appendChild(s);
  }, [turnstileSiteKey, locale]);

  const validate = (v = values): Errors => {
    const e: Errors = {};
    if (!v.name.trim()) e.name = labels.errors.name;
    const c = v.contact.trim();
    if (!c || !(EMAIL.test(c) || TELEGRAM.test(c))) e.contact = labels.errors.contact;
    if (v.message.trim().length < 10) e.message = labels.errors.message;
    return e;
  };

  const set = (field: keyof typeof values) => (value: string) => {
    const next = { ...values, [field]: value };
    setValues(next);
    if (errors[field as keyof Errors])
      setErrors((prev) => ({ ...prev, [field]: validate(next)[field as keyof Errors] }));
  };
  const blur = (field: 'name' | 'contact' | 'message') => () => {
    if (!values[field]) return;
    setErrors((prev) => ({ ...prev, [field]: validate()[field] }));
  };

  const toggleType = (t: string) =>
    setSelected((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  async function onSubmit(ev: SyntheticEvent<HTMLFormElement>) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      const first = (['name', 'contact', 'message'] as const).find((k) => e[k]);
      if (first) document.getElementById(id(first))?.focus();
      return;
    }
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          types: selected.map((t) => labels.types[t] ?? t),
          budget: budget ? labels.budgets[budget] : '',
          variant,
          locale,
          page: location.pathname,
          turnstileToken: token,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus('sent');
      requestAnimationFrame(() => successRef.current?.focus());
    } catch {
      setStatus('idle');
      setErrors({ form: labels.errors.generic });
      if (widgetId.current) window.turnstile?.reset(widgetId.current);
    }
  }

  const reset = () => {
    setValues({ name: '', contact: '', company: '', message: '', website: '' });
    setSelected([]);
    setBudget('');
    setErrors({});
    setStatus('idle');
    requestAnimationFrame(() => document.getElementById(id('name'))?.focus());
  };

  if (status === 'sent') {
    return (
      <div className="ak-form-success" role="status">
        {successImage && (
          <img
            className="ak-form-success__cat"
            src={successImage}
            width={96}
            height={96}
            alt=""
            decoding="async"
          />
        )}
        <h3 ref={successRef} tabIndex={-1} className="text-h2">
          {labels.successTitle}
        </h3>
        <p className="text-body-m text-fg-2">{labels.successBody.replace('{replyTime}', replyTime)}</p>
        <button type="button" className="ak-btn ak-btn--secondary ak-btn--M" onClick={reset}>
          <span>{labels.sendAnother}</span>
        </button>
      </div>
    );
  }

  const field = (
    name: 'name' | 'contact' | 'company' | 'message',
    label: string,
    opts: {
      placeholder?: string;
      multiline?: boolean;
      optional?: boolean;
      autoComplete?: string;
      type?: string;
    },
  ) => {
    const err = name !== 'company' ? errors[name] : undefined;
    const common = {
      id: id(name),
      name,
      value: values[name],
      placeholder: opts.placeholder,
      className: ['ak-field__control', opts.multiline && 'ak-field__control--multi']
        .filter(Boolean)
        .join(' '),
      'aria-invalid': err ? true : undefined,
      'aria-describedby': err ? id(`${name}-error`) : undefined,
      required: !opts.optional,
      onBlur: name !== 'company' ? blur(name) : undefined,
    };
    return (
      <div className={['ak-field', err && 'has-error'].filter(Boolean).join(' ')}>
        <label htmlFor={id(name)} className="ak-field__label">
          {label}
          {opts.optional && <span className="ak-field__optional">{labels.optional}</span>}
        </label>
        {opts.multiline ? (
          <textarea {...common} rows={5} maxLength={4000} onChange={(e) => set(name)(e.target.value)} />
        ) : (
          <input
            {...common}
            type={opts.type ?? 'text'}
            maxLength={200}
            autoComplete={opts.autoComplete}
            onChange={(e) => set(name)(e.target.value)}
          />
        )}
        {err && (
          <p id={id(`${name}-error`)} className="ak-field__error">
            {err}
          </p>
        )}
      </div>
    );
  };

  return (
    <form ref={formRef} className="ak-form" noValidate onSubmit={onSubmit} aria-busy={status === 'sending'}>
      {showTitle && <h3 className="text-h2">{labels.quickTitle}</h3>}

      <fieldset className="ak-form__group">
        <legend className="ak-field__label">{labels.typeLabel}</legend>
        <div className="ak-form__chips">
          {types.map((t) => (
            <button
              key={t}
              type="button"
              className="ak-chip"
              aria-pressed={selected.includes(t)}
              onClick={() => toggleType(t)}
            >
              <span className="ak-chip__label">{labels.types[t]}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {variant === 'full' && (
        <fieldset className="ak-form__group">
          <legend className="ak-field__label">{labels.budgetLabel}</legend>
          <div className="ak-form__chips" role="radiogroup" aria-label={labels.budgetLabel}>
            {Object.keys(labels.budgets).map((b) => (
              <button
                key={b}
                type="button"
                role="radio"
                className="ak-chip"
                aria-checked={budget === b}
                onClick={() => setBudget(budget === b ? '' : b)}
              >
                <span className="ak-chip__label">{labels.budgets[b]}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className={variant === 'full' ? 'ak-form__row' : 'contents'}>
        {field('name', labels.name, { placeholder: labels.namePlaceholder, autoComplete: 'name' })}
        {field('contact', labels.contactField, {
          placeholder: labels.contactPlaceholder,
          autoComplete: 'email',
        })}
      </div>
      {variant === 'full' &&
        field('company', labels.company, { optional: true, autoComplete: 'organization' })}
      {field('message', labels.message, { placeholder: labels.messagePlaceholder, multiline: true })}

      {/* Honeypot: hidden from people, tempting for bots. */}
      <div className="ak-form__hp" aria-hidden="true">
        <label htmlFor={id('website')}>Website</label>
        <input
          id={id('website')}
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(e) => set('website')(e.target.value)}
        />
      </div>

      {turnstileSiteKey && <div ref={turnstileRef} className="ak-form__turnstile" />}

      {errors.form && (
        <p className="ak-field__error" role="alert">
          {errors.form} <a href={`mailto:${email}`}>{email}</a>
        </p>
      )}

      <button
        type="submit"
        className="ak-btn ak-btn--accent ak-btn--L ak-btn--block"
        disabled={status === 'sending'}
      >
        <span>{status === 'sending' ? labels.sending : labels.send}</span>
        {status === 'sending' ? (
          <span className="ak-form__spinner" aria-hidden="true" />
        ) : (
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
        )}
      </button>
    </form>
  );
}
