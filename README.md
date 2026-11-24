# AngryKitten studio website

Production site for **AngryKitten**, an independent app studio from Tashkent: 12 Android apps and
games live on Google Play, 3 more coming, plus client work (apps, games, websites).

- **Stack:** Astro 6 · TypeScript (strict) · Tailwind CSS 4 · a few React islands · Motion · Cloudflare
- **Design source:** Figma file `WH6iV3GR9tqWfBb7Xn15lr` (AngryKitten — Studio Website v2)
- **Languages:** English at `/`, Uzbek at `/uz/`, Russian at `/ru/`
- **Production URL:** https://angrykitten.uz

---

## 1. Run it

```sh
npm install
npm run dev          # http://localhost:4321 (also builds press-kit ZIPs and OG images first)
npm run build        # production build into dist/
npm run preview      # build, then run it locally on Cloudflare's runtime (wrangler dev)
npm run check        # astro check + eslint + prettier --check (must pass before committing)
npm run format       # prettier --write .
```

Requires **Node 22.12+**. (Astro 7 needs Node 22.23+, so the project stays on Astro 6 for now.
Upgrading later: bump Node, then `npx @astrojs/upgrade`.)

Other scripts:

| Script              | What it does                                                        |
| ------------------- | ------------------------------------------------------------------- |
| `npm run press`     | Rebuild the Press kit downloads (`public/press/`, git-ignored)      |
| `npm run og`        | Rebuild Open Graph images (`public/og/`, git-ignored)               |
| `npm run favicons`  | Regenerate favicons + web manifest from `src/assets/brand/mark.png` |
| `npm run i18n:sync` | Copy new English UI strings into `uz.json` / `ru.json`              |
| `npm run deploy`    | Build and deploy to Cloudflare                                      |

`press` and `og` run automatically before `dev` and `build`.

## 2. How the project is organised

```
src/
  content/            # ← most edits happen here (see §3)
    apps/<slug>.md      one file per app
    privacy/<slug>.md   privacy policy per app
    services/*.yaml     the five services
    faqs/*.yaml         FAQ on the Services page
    team/*.yaml         team members
    site.json           email, Telegram, phone, address, reply times, socials
  content.config.ts   # schemas for the collections above
  i18n/               # UI copy: en.json (source), uz.json, ru.json + helpers
  assets/             # images (optimised at build time)
    apps/<slug>/        icon.png, banner.jpg, shot-1..3.jpg
    brand/              cat mark, sticker, press logos
    team/               portraits (4:5)
  components/
    ui/                 Button, Tag, Chip, Phone, PhoneCarousel, MoodToggle, Sticker…
    cards/              ProjectCard, ServiceCard, TeamCard, ContactMethod, Testimonial…
    layout/             Nav, MobileMenu, Footer, LangSwitch
    sections/           page sections (home/, work/, shared ones)
    islands/            React: ContactForm, ChatHero, WorkFilters, BuildYourAppCard
  layouts/            # BaseLayout (head, SEO, JSON-LD), PageLayout (nav + footer)
  pages/
    [...lang]/          every page is written once and built for /, /uz/ and /ru/
    api/contact.ts      the only server route (contact form → Telegram/email)
    404.astro, uz/404.astro, ru/404.astro
    [styleguide].astro  /_styleguide: every component and state (not indexed)
  styles/
    tokens.css          design tokens from the Figma variables (Light/Dark/Tangerine)
    global.css          text styles, layout utilities, reduced-motion rules
    components.css      styles shared by Astro components and React islands
scripts/              # press kit, OG images, favicons, i18n sync
```

**Design tokens.** `src/styles/tokens.css` mirrors the Figma variable collections: 17 colour
primitives, the semantic collection in three modes (`data-theme="light|dark|tangerine"` on any
section re-themes everything inside it), radii and shadows. Components only use tokens. If the
Figma variables change, update this file.

**Styleguide.** Open `/_styleguide` while developing to see every component, variant and state.

## 3. Everyday content changes

### Change copy

- **Page text, buttons, headings:** `src/i18n/en.json`. Wrap one word in `**double asterisks**`
  to make it the orange highlight (e.g. `"Small studio. **Sharp claws.**"`).
- **Contact details, reply times, social links:** `src/content/site.json`. Social links left empty
  are shown greyed out in the footer; phone/Telegram in `[brackets]` aren't linked.
- **Services, FAQ, team:** the YAML files in `src/content/`.

### Add an app

1. Create `src/content/apps/<slug>.md` (copy an existing one). Required: `name`, `type`
   (`game`/`app`), `order`, `packageId` (for live apps) and `text.en.oneLiner|meta|description`.
   Optional: `genre` (Work filter), `featured` (Home "Selected work"; the first one gets the big
   card), `showcase` (Home "Games lab"), `themeColor`, `languages`, `outcome`, and a full
   `text.en.caseStudy` (see `uybek.md`). The body is the long description.
2. Add images to `src/assets/apps/<slug>/`: `icon.png` (square, 512px ideal), `banner.jpg`
   (1024 × 500), `shot-1.jpg`…`shot-3.jpg` (portrait 9:16; other shapes are letterboxed).
3. Add `src/content/privacy/<slug>.md` with the policy (front matter: `app`, `title`).
4. `npm run dev`. The app appears on Work (with filter counts), gets a case study at
   `/work/<slug>` in all three languages, a privacy page, an OG image and a Press kit pack.

To turn a "coming soon" placeholder (`app-13.md`…`app-15.md`) into a real app, rename the file to
the app's slug, set `status: live`, add `packageId` and the images.

### Add or update a team member

Edit or add `src/content/team/NN-name.yaml`:

```yaml
order: 1
name: Jane Doe
photo: ../../assets/team/jane.jpg # 4:5 portrait; leave out to show the cat placeholder
telegram: https://t.me/janedoe # optional
linkedin: https://www.linkedin.com/in/janedoe # optional
text:
  en: { badge: Design, jobTitle: Product designer }
```

### Translate (Uzbek and Russian)

- UI strings: `src/i18n/uz.json` and `src/i18n/ru.json` currently hold the **English copy** (each
  file starts with a `_TODO` marker). Translate values in place; keep the keys.
- After adding new English strings, run `npm run i18n:sync`: new keys are copied into `uz`/`ru`,
  untranslated copies follow English changes, and real translations are never overwritten.
- Content collections: add a `uz:` or `ru:` block under `text:` with any subset of fields; missing
  fields fall back to English.
- Privacy policies stay in English on every language (pages say so).
- Russian uses **Onest** for Cyrillic letters automatically (the brand fonts are Latin-only); it
  only downloads on pages that contain Cyrillic.
- Please don't machine-translate without a native review.

## 4. Deploy (Cloudflare)

The site is static except `POST /api/contact`. The Cloudflare adapter builds a Worker with static
assets (`dist/client`) and that one function (`dist/server`). This is Cloudflare's current setup
for Astro; it replaces the older "Pages" flow and is also free.

**One-off setup**

1. `npx wrangler login`
2. `npm run deploy` (creates the `angrykitten` Worker on first run)
3. In the Cloudflare dashboard → Workers & Pages → `angrykitten` → Settings → Domains & Routes,
   add the custom domain `angrykitten.uz` (and `www.angrykitten.uz` if wanted).

Or connect the GitHub repo in Workers & Pages → Create → Import a repository, with build command
`npm run build` and deploy command `npx wrangler deploy`, so every push to `main` deploys.

**Environment variables / secrets**

| Name                        | Where               | Purpose                                                    |
| --------------------------- | ------------------- | ---------------------------------------------------------- |
| `TELEGRAM_BOT_TOKEN`        | secret              | Bot that posts form messages (required for the form)       |
| `TELEGRAM_CHAT_ID`          | secret              | Chat (you, or a group) that receives them                  |
| `TURNSTILE_SECRET_KEY`      | secret              | Cloudflare Turnstile server key (optional, recommended)    |
| `RESEND_API_KEY`            | secret              | Also email each message via Resend (optional)              |
| `CONTACT_EMAIL_TO`          | variable            | Where Resend emails go                                     |
| `CONTACT_EMAIL_FROM`        | variable            | Verified sender, e.g. `AngryKitten <hello@angrykitten.uz>` |
| `PUBLIC_TURNSTILE_SITE_KEY` | build-time (`.env`) | Turnstile site key; shows the widget                       |

Set secrets with `npx wrangler secret put TELEGRAM_BOT_TOKEN` (etc.) or in the dashboard under
Settings → Variables and secrets. Locally, copy `.dev.vars.example` to `.dev.vars` and
`.env.example` to `.env` (both git-ignored).

**Telegram bot in 2 minutes:** message [@BotFather](https://t.me/BotFather) → `/newbot` → copy the
token. Send your new bot any message, then open
`https://api.telegram.org/bot<TOKEN>/getUpdates` and copy `message.chat.id`.

Without Telegram (or Resend) configured, the form shows a friendly error with the email address,
so nothing is silently lost.

**Spam protection:** a hidden honeypot field always; Cloudflare Turnstile when both keys are set
(create a widget in the dashboard → Turnstile, mode "Invisible" or "Managed").

### Redirect `angry-kitten.uz` → `angrykitten.uz`

1. Add `angry-kitten.uz` to Cloudflare as its own zone and point its nameservers to Cloudflare.
2. DNS: add a proxied (orange-cloud) `A` record `@` → `192.0.2.1` and `CNAME www` → `@`
   (placeholder targets; the redirect answers before they're used).
3. Rules → Redirect Rules → Create: _All incoming requests_ → Dynamic →
   `concat("https://angrykitten.uz", http.request.uri.path)`, status **301**, preserve query string.

## 5. Quality notes

- **Performance (Lighthouse mobile, local static server):** Home 98, case study 98; CLS 0,
  TBT 0 ms; LCP ≈ 2.3 s in Lighthouse's simulation of a slow 4G phone. The first screen of Home and
  the case studies uses no framework JavaScript; React loads only for the forms, Work filters and
  the Services builder. On Cloudflare (HTTP/2/3, CDN) LCP should be lower than measured locally.
- **Accessibility / Best Practices / SEO:** 100 on every page (404 is intentionally `noindex`).
  Skip link, visible focus rings, keyboard-reachable carousel and menus, reduced-motion support
  (no float, parallax, marquee or falling icons; fades only).
- **SEO:** unique title + description per page and language, `hreflang` alternates, canonical
  URLs, Open Graph/Twitter images per page and app, `sitemap-index.xml`, `robots.txt`,
  `Organization` and `SoftwareApplication` JSON-LD (no invented ratings).
- **Tested** at 360, 390, 768, 1024, 1280, 1440 and 1920 px (no horizontal scroll) in Chromium.
  Safari (iOS), Firefox and Samsung Internet still need a manual pass on real devices.

### Motion

- **Heroes** animate in pure CSS (`src/styles/components.css`, "Motion layer"), so the first
  screen never waits for JavaScript.
- **Everything below the hero** is driven by `src/scripts/motion.ts` (Motion's DOM API, loaded on
  every page when the browser is idle): split-word heading reveals, staggered card grids, media
  wipes, squiggle underlines, count-up stats, scroll progress bar, parallax phones, CTA lines
  that slide in with the scroll, 3D card tilt and magnetic buttons (mouse only), draggable
  stickers (`data-drag`).
- **React islands** (forms, filters, chat, builder) use `motion/react` gestures, springs and
  shared-layout pills.
- **Between pages:** native cross-document view transitions (the nav stays, the page slides).
- **Reduced motion:** all of the above is off; changes are instant. Content is never hidden
  unless the motion script runs, and anything already scrolled past is always revealed.

### Where the build departs from Figma (on purpose)

- Orange highlight words use `tabby-deep` (#E04412) on light sections; Figma's `tabby` is 2.9:1
  on ivory and fails WCAG for large text. On tangerine sections the highlight is white.
- "View project" hover text on cards uses `rust` (small text needs 4.5:1).
- Form field borders are darker than Figma's `line` colour (3:1 needed for inputs).
- The Work page uses Figma's filter set (All, Apps, Games, Arcade, Puzzle and word, Party and
  board, Coming soon), which is richer than the brief's All/Games/Apps.
- The press boilerplate was corrected: Cipher is a game (tools are Pulchi, Nerva, UyBek) and the
  catalogue is 12 live apps + 3 coming, not "15 apps on Google Play".
- Logos: the cat mark only exists as a bitmap, so the "SVG" downloads keep the wordmark as vector
  outlines with the mark embedded as an image.

## 6. Where the data came from

- App names, packages, categories and descriptions: the Google Play listings (`&gl=UZ`).
  Card copy (one-liners, "Real estate · Android") and all page copy: the Figma file.
- Images: the Figma Assets page (icons, banners, screenshots).
- Privacy policies: the telegra.ph pages linked from each Play listing. Template instructions left
  in the originals were removed (UyBek, Pulchi), Spinject's broken `mailto:` was fixed, and
  UyBek's "Google Play Data Safety Notes" (advice to the author, not policy) was left out. Every
  file has `reviewed: false` until someone checks it.

## 7. Missing content

Placeholders are written in `[brackets]` so they're easy to find (search the repo for `[`):

- Team: `[Name Surname]`, roles and 4:5 photos (`src/content/team/`, `src/assets/team/`)
- `[@angrykitten]` Telegram handle and `[+998 __ ___ __ __]` phone (`site.json`)
- Studio street address (currently "Tashkent, Uzbekistan")
- `[two working days]` client reply time, `[24 hours]` press reply time
- `[Year]` founded, `[Number]` team size, `[Total installs]` (press fact sheet)
- Testimonials: real quotes only (placeholder cards are dashed)
- Apps 13–15: names, type and assets (`src/content/apps/app-13.md`…)
- Uzbek and Russian translations (`src/i18n/uz.json`, `ru.json`, content `text.uz/ru`)
- Social links: Telegram, Instagram, LinkedIn (`site.json`)
- FAQ answers: 4 of 5 are `[Answer needed]`; the iOS one needs confirming (`src/content/faqs/`)
- Budget ranges on the contact form (`form.budgets` in `en.json`) and prices/timelines for the
  three ways to work (`servicesPage.ways`)
- Founder story on the Studio page (`studio.story`)
- UyBek case study: the goal paragraph is marked `[Draft — confirm with the team]`; real outcome
  metrics for every app (`outcome` / `caseStudy.stats`)
- Full case studies for Pulchi and Nerva (they currently use the lighter template)
- **UyBek privacy policy:** words are missing in the published source ("Welcome to .",
  "handled using services", "stored using .", "powered using Realtime Database"). Fix the
  text on telegra.ph too, since Google Play links there.
- 512px app icons for the Press kit (the Figma icons are 240px)
- Turnstile keys, Telegram bot token/chat id (see §4)
