// @ts-check
import { defineConfig, sessionDrivers } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

// Every page is prerendered (static). Only routes that opt out with
// `export const prerender = false` (the contact form endpoint) run on
// Cloudflare as a function.
export default defineConfig({
  site: 'https://angrykitten.uz',
  output: 'static',
  adapter: cloudflare({ imageService: 'compile' }),
  // The site keeps no server-side sessions; an in-memory driver avoids requiring a KV namespace.
  session: { driver: sessionDrivers.lruCache() },
  trailingSlash: 'never',
  build: { format: 'file' },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'uz', 'ru'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    react(),
    sitemap({
      // Keep internal pages and error pages out of the sitemap.
      filter: (page) => !/\/(_styleguide|api\/|404)/.test(page),
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', uz: 'uz', ru: 'ru' },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: { include: ['react', 'react-dom', 'react-dom/client', 'motion/react'] },
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          // zod ships /*#__PURE__*/ comments in positions Rollup ignores; harmless.
          if (warning.code === 'INVALID_ANNOTATION' && warning.id?.includes('node_modules')) return;
          warn(warning);
        },
      },
    },
  },
});
