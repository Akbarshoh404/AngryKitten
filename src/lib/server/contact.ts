/** Validation and delivery for the contact form (used by src/pages/api/contact.ts). */

export type ContactPayload = {
  name: string;
  contact: string;
  company: string;
  message: string;
  types: string[];
  budget: string;
  variant: string;
  locale: string;
  page: string;
  website: string; // honeypot
  turnstileToken: string;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TELEGRAM = /^(@|https?:\/\/t\.me\/|t\.me\/)?[a-zA-Z0-9_]{5,32}$/;
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export function parsePayload(body: unknown): ContactPayload {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  return {
    name: str(b.name, 200),
    contact: str(b.contact, 200),
    company: str(b.company, 200),
    message: str(b.message, 4000),
    types: Array.isArray(b.types)
      ? b.types
          .map((t) => str(t, 60))
          .filter(Boolean)
          .slice(0, 8)
      : [],
    budget: str(b.budget, 60),
    variant: str(b.variant, 20),
    locale: str(b.locale, 5),
    page: str(b.page, 200),
    website: str(b.website, 200),
    turnstileToken: str(b.turnstileToken, 4096),
  };
}

export function validate(p: ContactPayload): string[] {
  const errors: string[] = [];
  if (!p.name) errors.push('name');
  if (!(EMAIL.test(p.contact) || TELEGRAM.test(p.contact))) errors.push('contact');
  if (p.message.length < 10) errors.push('message');
  return errors;
}

export async function verifyTurnstile(secret: string, token: string, ip: string | null): Promise<boolean> {
  if (!token) return false;
  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  });
  const data = (await res.json().catch(() => ({}))) as { success?: boolean };
  return Boolean(data.success);
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function formatMessage(p: ContactPayload): { html: string; text: string } {
  const rows: [string, string][] = [
    ['Name', p.name],
    ['Contact', p.contact],
    ['Company', p.company],
    ['Building', p.types.join(', ')],
    ['Budget', p.budget],
    ['Form', `${p.variant} · ${p.locale} · ${p.page}`],
  ];
  const filled = rows.filter(([, v]) => v);
  const html =
    '🐱 <b>New message from angrykitten.uz</b>\n\n' +
    filled.map(([k, v]) => `<b>${k}:</b> ${escapeHtml(v)}`).join('\n') +
    `\n\n${escapeHtml(p.message)}`;
  const text = filled.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\n${p.message}`;
  return { html, text };
}

export async function sendTelegram(token: string, chatId: string, html: string): Promise<boolean> {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: html, parse_mode: 'HTML', disable_web_page_preview: true }),
  });
  return res.ok;
}

export async function sendEmail(
  apiKey: string,
  from: string,
  to: string,
  p: ContactPayload,
  text: string,
): Promise<boolean> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `New project enquiry from ${p.name}`,
      text,
      ...(EMAIL.test(p.contact) ? { reply_to: p.contact } : {}),
    }),
  });
  return res.ok;
}
