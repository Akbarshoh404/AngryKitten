# AngryKitten studio website

Production site for AngryKitten, an independent app studio from Tashkent.
Astro 6 · TypeScript · Tailwind CSS 4 · React islands · Cloudflare.

Design source: Figma file `WH6iV3GR9tqWfBb7Xn15lr` (AngryKitten — Studio Website v2).

> Full maintenance docs (adding apps, team members, translations, deploy, env vars,
> domain redirect) arrive in phase 10.

## Run it

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # static site + contact function in dist/
npm run check      # astro check + eslint + prettier
npm run favicons   # regenerate favicons from src/assets/brand/mark.png
```

Requires Node 22.12+. (Astro 7 needs Node 22.23+, so the project stays on Astro 6 for now.)

## Where things live

- `src/styles/tokens.css`: design tokens generated from the Figma variable collections
  (primitives, semantic Light/Dark/Tangerine modes, radius, effects).
- `src/styles/global.css`: text styles (Display/2XL … Caps/Eyebrow), layout utilities.
- `src/i18n/`: UI strings (`en.json`, `uz.json`, `ru.json`) and routing helpers.
- `src/pages/[...lang]/`: each page is written once and generated for `/`, `/uz/` and `/ru/`.
- `src/components/`: `ui/` primitives, `cards/`, `layout/` nav, menu and footer, `islands/` React,
  `pages/` page bodies. All components with their states: `/_styleguide` (not indexed).
- `src/content/`: content collections (schemas in `src/content.config.ts`):
  - `apps/<slug>.md`: one per app. Front matter = facts and card copy; body = Google Play description.
    Images are found by folder: `src/assets/apps/<slug>/icon.*`, `banner.*`, `shot-1..3.*`.
  - `privacy/<slug>.md`: privacy policy per app (imported from telegra.ph, see below).
  - `services/*.yaml`, `faqs/*.yaml`, `team/*.yaml`, and `site.json` (contact details, socials).
  - Translatable text sits under `text: { en, uz?, ru? }`; missing locales fall back to English.

## Where the data came from

- App names, categories and descriptions: the Google Play listings (fetched with `&gl=UZ`).
  Card copy (one-liners, "Real estate · Android") is from the Figma Work page.
- Privacy policies: the telegra.ph pages linked from each Play listing. Template instructions left
  in the originals were removed (UyBek, Pulchi) and Spinject's broken `mailto:` link was fixed.
  Every file has `reviewed: false` until someone checks it.

## Missing content

Placeholders are written in `[brackets]` so they're easy to find:

- `[Name Surname]`, `[Role]` and photos for each team member
- `[@angrykitten]` Telegram handle
- `[+998 __ ___ __ __]` phone number
- Studio street address (currently "Tashkent, Uzbekistan")
- `[two working days]` client reply time, `[24 hours]` press reply time
- `[Year]` founded, `[Number]` team size, `[Total installs]`
- Testimonials (real quotes only)
- Apps 13–15 names and assets
- Uzbek and Russian translations (`src/i18n/uz.json`, `ru.json` hold English copy)
- Social links (Telegram, Instagram, LinkedIn) in `src/content/site.json`
- FAQ answers (4 of 5 are `[Answer needed]`; the iOS one needs confirming) in `src/content/faqs/`
- Prices and timelines for the three ways to work (Services page)
- Real case-study metrics (rating, installs, timeline) in each app's `outcome`
- **UyBek privacy policy:** words are missing in the published source ("Welcome to .",
  "handled using services", "stored using .", "powered using Realtime Database"). Fix the text
  on telegra.ph too, since Google Play links there.
- A Cyrillic-capable font for Russian: Bricolage Grotesque and DM Sans have no Cyrillic glyphs
