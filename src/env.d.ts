/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Cloudflare Turnstile site key (public). Leave empty to disable the widget. */
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
}

/** Runtime secrets on Cloudflare (set with `wrangler secret put` or in the dashboard; `.dev.vars` locally). */
declare module 'cloudflare:workers' {
  export const env: {
    TELEGRAM_BOT_TOKEN?: string;
    TELEGRAM_CHAT_ID?: string;
    TURNSTILE_SECRET_KEY?: string;
    RESEND_API_KEY?: string;
    CONTACT_EMAIL_TO?: string;
    CONTACT_EMAIL_FROM?: string;
    [key: string]: unknown;
  };
}
