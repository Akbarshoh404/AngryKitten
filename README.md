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
- `src/components/`: `ui/` primitives, `layout/` nav, menu and footer, `pages/` page bodies.

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
- A Cyrillic-capable font for Russian: Bricolage Grotesque and DM Sans have no Cyrillic glyphs
