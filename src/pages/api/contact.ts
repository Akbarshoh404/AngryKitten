/**
 * POST /api/contact: the only server route (runs as a Cloudflare Worker function).
 * Same-origin + JSON check → honeypot → validation → Turnstile (required when the site key is
 * built in) → Telegram (+ optional Resend email).
 */
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import {
  formatMessage,
  isJson,
  isSameOrigin,
  parsePayload,
  sendEmail,
  sendTelegram,
  validate,
  verifyTurnstile,
} from '../../lib/server/contact';

export const prerender = false;

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
  if (!isSameOrigin(request.headers.get('origin'), request.url)) {
    return json(403, { ok: false, error: 'origin' });
  }
  if (!isJson(request.headers.get('content-type'))) {
    return json(415, { ok: false, error: 'unsupported' });
  }
  const payload = parsePayload(await request.json().catch(() => null));

  // Bots fill every field. Pretend it worked so they don't retry.
  if (payload.website) return json(200, { ok: true });

  const errors = validate(payload);
  if (errors.length) return json(400, { ok: false, errors });

  // The widget is built in whenever the public site key is set; without the secret every
  // submission would be unverifiable, so refuse instead of silently skipping the check.
  if (import.meta.env.PUBLIC_TURNSTILE_SITE_KEY && !env.TURNSTILE_SECRET_KEY) {
    console.error('Contact form: PUBLIC_TURNSTILE_SITE_KEY is set but TURNSTILE_SECRET_KEY is missing.');
    return json(503, { ok: false, error: 'not-configured' });
  }
  if (env.TURNSTILE_SECRET_KEY) {
    const ok = await verifyTurnstile(
      env.TURNSTILE_SECRET_KEY,
      payload.turnstileToken,
      request.headers.get('CF-Connecting-IP'),
    );
    if (!ok) return json(403, { ok: false, error: 'turnstile' });
  }

  const { html, text } = formatMessage(payload);
  const results: boolean[] = [];
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    results.push(await sendTelegram(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, html).catch(() => false));
  }
  if (env.RESEND_API_KEY && env.CONTACT_EMAIL_TO) {
    const from = env.CONTACT_EMAIL_FROM || 'AngryKitten website <onboarding@resend.dev>';
    results.push(
      await sendEmail(env.RESEND_API_KEY, from, env.CONTACT_EMAIL_TO, payload, text).catch(() => false),
    );
  }

  if (results.length === 0) {
    console.error(
      'Contact form: no delivery channel configured (set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID).',
    );
    return json(503, { ok: false, error: 'not-configured' });
  }
  return results.some(Boolean) ? json(200, { ok: true }) : json(502, { ok: false, error: 'delivery' });
};
