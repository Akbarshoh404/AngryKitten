/**
 * Content collections. Add or edit content in src/content/<collection>/.
 *
 * Translatable text lives in a `text` object keyed by locale. `en` is required;
 * `uz` and `ru` are optional and fall back to English field by field
 * (see src/lib/content.ts → `localized`).
 *
 * App images are found by convention, not listed here:
 *   src/assets/apps/<slug>/icon.png, banner.jpg, shot-1..3.jpg
 * (see src/lib/appAssets.ts).
 */
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** English is required; Uzbek and Russian may translate any subset of fields. */
const locale = <T extends z.ZodRawShape>(shape: T) => {
  const en = z.object(shape);
  return z.object({ en, uz: en.partial().optional(), ru: en.partial().optional() });
};

/* ---------------------------------------------------------------- apps --- */
const appText = {
  /** Card line on Work/Home ("Buy, sell and browse homes across Uzbekistan…"). */
  oneLiner: z.string(),
  /** Category line under the name ("Real estate · Android"). */
  meta: z.string(),
  /** Longer summary for the case study page and SEO description. */
  description: z.string(),
  /** Short category tag ("Real estate"), used on the featured card. */
  category: z.string().optional(),
  /** What we built, e.g. "Search · Chat · Listings · Auth". */
  built: z.string().optional(),
  /** Full case-study copy (Figma template 11:469). Apps without it get a lighter page. */
  caseStudy: z
    .object({
      /** Hero lead; wrap one word in **…** to highlight it. */
      lead: z.string(),
      tags: z.array(z.string()).default([]),
      category: z.string(),
      role: z.string(),
      keyFeatures: z.string(),
      goalTitle: z.string(),
      goal: z.array(z.string()),
      screensTitle: z.string(),
      /** One per screenshot (shot-1..3), in order. */
      screens: z.array(z.object({ title: z.string(), body: z.string() })),
      outcomeTitle: z.string(),
      stats: z.array(z.object({ value: z.string(), label: z.string() })),
    })
    .optional(),
};

const apps = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/apps' }),
  schema: z
    .object({
      name: z.string(),
      type: z.enum(['game', 'app']),
      status: z.enum(['live', 'coming']).default('live'),
      /** Display order on Work (lower first). */
      order: z.number(),
      /** Show in "Selected work" on Home (the first one by order gets the big card). */
      featured: z.boolean().default(false),
      /** Work-page filter group for games (Figma chips: Arcade, Puzzle and word, Party and board). */
      genre: z.enum(['arcade', 'puzzle', 'party']).optional(),
      /** Show as a phone in the Home "Games lab". */
      showcase: z.boolean().default(false),
      /** Background colour behind the app's screens (featured card, case study hero). */
      themeColor: z
        .string()
        .regex(/^#[0-9a-f]{6}$/i)
        .optional(),
      /** Which hero mood shows it on Home. */
      mood: z.enum(['play', 'work']).optional(),
      /** Has a full case study (Figma: apps link to "Read case study", games to Google Play). */
      hasCaseStudy: z.boolean().default(false),
      /** Google Play package id; the store URL is built from it. */
      packageId: z.string().optional(),
      /** Google Play category as listed on the store. */
      playCategory: z.string().optional(),
      /** Languages stated on the store listing (ISO codes). Leave empty if unknown. */
      languages: z.array(z.string()).default([]),
      tags: z.array(z.string()).default([]),
      text: locale(appText),
      /** Case-study facts; unknown values stay as [placeholders]. */
      outcome: z
        .object({
          rating: z.string().default('[Rating]'),
          installs: z.string().default('[Installs]'),
          languages: z.string().default('[Languages]'),
          timeline: z.string().default('[Timeline]'),
        })
        .default({
          rating: '[Rating]',
          installs: '[Installs]',
          languages: '[Languages]',
          timeline: '[Timeline]',
        }),
      /** Where the privacy policy was originally published (before /privacy/<slug>). */
      privacySource: z.url().optional(),
    })
    .refine((a) => a.status === 'coming' || Boolean(a.packageId), {
      message: 'Live apps need a packageId',
    }),
});

/* ------------------------------------------------------------- privacy --- */
const privacy = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/privacy' }),
  schema: z.object({
    app: reference('apps'),
    title: z.string(),
    /** Original URL the policy was imported from. */
    source: z.url().optional(),
    effectiveDate: z.string().optional(),
    /** Set true once someone has checked the text after import. */
    reviewed: z.boolean().default(false),
  }),
});

/* ---------------------------------------------------------------- team --- */
const team = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/team' }),
  schema: ({ image }) =>
    z.object({
      order: z.number(),
      name: z.string(),
      /** Optional portrait, 4:5. Path relative to the YAML file. */
      photo: image().optional(),
      telegram: z.url().optional(),
      linkedin: z.url().optional(),
      text: locale({ jobTitle: z.string(), badge: z.string().optional() }),
    }),
});

/* ------------------------------------------------------------ services --- */
const serviceText = {
  title: z.string(),
  /** Service row pitch (Services page). */
  pitch: z.string(),
  /** Shorter card pitch (Home). */
  cardPitch: z.string(),
  deliverables: z.array(z.string()),
  /** Three short bullets for the Home card. */
  cardDeliverables: z.array(z.string()),
  goodFor: z.string(),
};

const services = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/services' }),
  schema: z.object({
    number: z.string(),
    order: z.number(),
    exampleApps: z.array(reference('apps')).default([]),
    text: locale(serviceText),
  }),
});

/* ---------------------------------------------------------------- faqs --- */
const faqs = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/faqs' }),
  schema: z.object({
    order: z.number(),
    /** Answer may be a [placeholder] until the studio confirms it. */
    text: locale({ question: z.string(), answer: z.string() }),
  }),
});

export const collections = { apps, privacy, team, services, faqs };
