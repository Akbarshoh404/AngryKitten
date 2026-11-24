/**
 * Site-wide motion layer (Motion / Framer Motion's vanilla DOM API). Loaded on every page.
 *
 *  - Scroll reveals: headings split into words that spring up, eyebrows slide in, card grids
 *    pop in with a stagger, feature media wipes open, highlight words draw their squiggle.
 *  - Count-up numbers (stats).
 *  - Scroll-linked: progress bar, gentle parallax on phones, sliding CTA lines.
 *  - Micro-interactions (mouse/trackpad only): 3D tilt on cards, magnetic buttons.
 *  - Draggable stickers that spring back home ([data-drag]).
 *
 * Rules: transform/opacity only, nothing is hidden unless this script runs, elements already on
 * screen at load are left alone (heroes animate in CSS), inline styles are cleared after each
 * entrance so CSS hover states keep working, and prefers-reduced-motion turns it all off.
 */
import { animate, inView, scroll, stagger } from 'motion';

const SPRING = { type: 'spring', stiffness: 230, damping: 22, mass: 0.9 } as const;
const SOFT = { type: 'spring', stiffness: 140, damping: 20 } as const;
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

type El = HTMLElement;
const $$ = <T extends Element = El>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));
const notInHero = (el: Element) => !el.closest('[data-hero]');
/**
 * Root margin for reveals: the viewport extended infinitely upwards, so anything the visitor
 * has already scrolled past counts as "seen" (fast flicks, End key and anchor jumps can skip
 * an element in a single frame; it must never stay hidden).
 */
const SEEN = '100000px 0px -6% 0px';
const clearInline = (el: El) => {
  el.style.removeProperty('opacity');
  el.style.removeProperty('transform');
  el.style.removeProperty('clip-path');
};

/* ------------------------------------------------------------------ reveals */

type Preset = 'rise' | 'pop' | 'slide' | 'wipe' | 'words' | 'line';

const FROM: Record<Exclude<Preset, 'words'>, Record<string, string | number>> = {
  rise: { opacity: 0, transform: 'translateY(28px)' },
  pop: { opacity: 0, transform: 'translateY(32px) scale(0.92) rotate(-1.5deg)' },
  slide: { opacity: 0, transform: 'translateX(-28px)' },
  wipe: { opacity: 1, clipPath: 'inset(0% 100% 0% 0%)' },
  line: { opacity: 0, transform: 'scaleX(0.4)' },
};
const TO: Record<Exclude<Preset, 'words'>, Record<string, string | number>> = {
  rise: { opacity: 1, transform: 'translateY(0px)' },
  pop: { opacity: 1, transform: 'translateY(0px) scale(1) rotate(0deg)' },
  slide: { opacity: 1, transform: 'translateX(0px)' },
  wipe: { opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' },
  line: { opacity: 1, transform: 'scaleX(1)' },
};

/** Wraps each word of a heading in spans (keeps inline markup like <em class="ak-hl">). */
function splitWords(el: El): El[] {
  if (el.dataset.split) return $$('.ak-w', el);
  el.dataset.split = '1';
  const words: El[] = [];
  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const parts = (child.textContent ?? '').split(/(\s+)/);
        const frag = document.createDocumentFragment();
        for (const part of parts) {
          if (!part) continue;
          if (/^\s+$/.test(part)) {
            frag.append(part);
          } else {
            const w = document.createElement('span');
            w.className = 'ak-w';
            w.textContent = part;
            words.push(w);
            frag.append(w);
          }
        }
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
      }
    }
  };
  walk(el);
  return words;
}

function hide(el: El, preset: Exclude<Preset, 'words'>) {
  Object.assign(el.style, FROM[preset]);
}

function reveal(el: El, preset: Preset, delay = 0) {
  if (preset === 'words') {
    const words = splitWords(el);
    words.forEach((w) =>
      Object.assign(w.style, { opacity: '0', transform: 'translateY(0.45em) rotate(3deg)' }),
    );
    inView(
      el,
      () => {
        animate(
          words,
          { opacity: [0, 1], transform: ['translateY(0.45em) rotate(3deg)', 'translateY(0em) rotate(0deg)'] },
          { ...SPRING, delay: stagger(0.045, { startDelay: delay }) },
        ).then(() => words.forEach(clearInline));
        $$('.ak-hl', el).forEach((hl) => hl.classList.add('is-drawn'));
      },
      { amount: 0.4, margin: SEEN },
    );
    return;
  }
  hide(el, preset);
  // A fully clipped element never reports as visible, so wipes watch their parent.
  inView(
    preset === 'wipe' ? (el.parentElement ?? el) : el,
    () => {
      const transition = preset === 'wipe' ? { duration: 0.9, ease: EASE_OUT, delay } : { ...SPRING, delay };
      animate(el, TO[preset], transition).then(() => clearInline(el));
    },
    { amount: 0.15, margin: SEEN },
  );
}

/** Lists/grids: observe the list, then stagger its items in. */
function revealGroup(list: El, preset: Exclude<Preset, 'words'> = 'pop') {
  const items = Array.from(list.children) as El[];
  if (items.length < 2) return;
  items.forEach((i) => hide(i, preset));
  inView(
    list,
    () => {
      animate(items, TO[preset], { ...SPRING, delay: stagger(0.07) }).then(() => items.forEach(clearInline));
    },
    { amount: 0.1, margin: SEEN },
  );
}

function setupReveals() {
  const fold = window.innerHeight * 0.9;
  const below = (el: Element) => el.getBoundingClientRect().top > fold;
  const done = new Set<Element>();
  const take = (el: Element) => {
    if (done.has(el) || !notInHero(el) || !below(el)) return false;
    for (let p = el.parentElement; p; p = p.parentElement) if (done.has(p)) return false;
    done.add(el);
    return true;
  };

  // Headings: words spring up one by one.
  $$('main :is(h2, h3.text-h1, .ak-cta__title), .ak-footer__pitch > p').forEach((h) => {
    if (h.closest('.ak-pcard, .ak-soon, .ak-team, .ak-service, li, figure, dl')) return;
    if (take(h)) reveal(h, 'words');
  });
  // Eyebrows slide in from the left; section bodies rise.
  $$('main .text-eyebrow').forEach((e) => {
    if (!e.closest('li, .ak-pcard, dl, .ak-quote, form') && take(e)) reveal(e, 'slide');
  });
  $$('main .ak-sh .text-body-l, main section > .container-page > p, .ak-sh__action').forEach((p) => {
    if (take(p)) reveal(p, 'rise', 0.15);
  });
  // Card grids and lists: staggered pop.
  $$(
    [
      'main ul.grid',
      'main ol.grid',
      '.ak-team-list',
      '.ak-games',
      '.ak-footer__cols',
      'main section ul.flex.flex-col.gap-5',
      '.ak-ct-next ol',
      '.ak-feature__facts',
      '.ak-faq',
    ].join(','),
  ).forEach((list) => {
    if (take(list))
      revealGroup(
        list,
        list.matches('.ak-footer__cols, .ak-faq, .ak-feature__facts, .ak-ct-next ol') ? 'rise' : 'pop',
      );
  });
  // Big single blocks.
  $$('.ak-feature__media').forEach((m) => take(m) && reveal(m, 'wipe'));
  $$(
    '.ak-feature__details, .ak-form-card, .ak-pr-card, .ak-pr-contact, .ak-ct-next, .ak-quote, .ak-sv-row > *, .ak-pr-rule, .ak-legal-link',
  ).forEach((b) => take(b) && reveal(b, 'pop'));
  $$('main .ak-prose > *').forEach((p, i) => i < 14 && take(p) && reveal(p, 'rise'));
  $$('.ak-footer__bottom').forEach((b) => take(b) && reveal(b, 'line'));
  // Any remaining highlight words draw their squiggle when seen.
  $$('.ak-hl').forEach((hl) => {
    if (!notInHero(hl)) return;
    inView(hl, () => hl.classList.add('is-drawn'), { amount: 1, margin: SEEN });
  });
}

/* ---------------------------------------------------------------- numbers */

function setupCountUps() {
  $$('.ak-stat__value').forEach((el) => {
    const target = Number(el.textContent?.trim());
    if (!Number.isFinite(target) || target <= 0 || !notInHero(el)) return;
    el.textContent = '0';
    inView(
      el,
      () => {
        animate(0, target, {
          duration: Math.min(1.6, 0.6 + target * 0.08),
          ease: EASE_OUT,
          onUpdate: (v) => (el.textContent = String(Math.round(v))),
        });
      },
      { amount: 0.6, margin: SEEN },
    );
  });
}

/* ------------------------------------------------------------ scroll-linked */

function setupScroll() {
  // Reading progress bar.
  const bar = document.createElement('div');
  bar.className = 'ak-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.append(bar);
  scroll((progress: number) => {
    bar.style.transform = `scaleX(${progress})`;
  });

  // Parallax: phones drift against the scroll; alternate directions in rows.
  $$('.ak-games__item .ak-phone, .ak-feature__phones > *, .ak-cs-screen .ak-phone').forEach((phone, i) => {
    const amount = (i % 2 ? -1 : 1) * 26;
    scroll(animate(phone, { y: [amount, -amount] }, { ease: 'linear' }), {
      target: phone,
      offset: ['start end', 'end start'],
    });
  });
  // Hero art floats up slightly as you leave the hero (UX notes: "slight parallax on scroll").
  $$('[data-hero] :is(.ak-hero__art, .ak-collage, .ak-orbit, .ak-pr-stack, .ak-cs-hero__phones)').forEach(
    (art) => {
      scroll(animate(art, { y: [0, -90] }, { ease: 'linear' }), {
        target: art.closest('[data-hero]') as El,
        offset: ['start start', 'end start'],
      });
    },
  );
  // CTA: the two lines slide in from opposite sides while scrolling in.
  $$('.ak-cta__title > span').forEach((line, i) => {
    scroll(animate(line, { x: [i ? 80 : -80, 0] }, { ease: 'linear' }), {
      target: line,
      offset: ['start end', 'center center'],
    });
  });
  // Footer pitch grows a touch as it arrives.
  $$('.ak-footer__pitch').forEach((p) =>
    scroll(animate(p, { scale: [0.92, 1], opacity: [0.4, 1] }, { ease: 'linear' }), {
      target: p,
      offset: ['start end', 'center center'],
    }),
  );
}

/* ------------------------------------------------------------ interactions */

function setupTilt() {
  const cards = $$(
    '.ak-pcard, .ak-service, .ak-team, .ak-why__card, .ak-way, .ak-pr-app, .ak-cs-screen, .ak-pr-logo, .ak-soon',
  );
  cards.forEach((card) => {
    card.classList.add('ak-tilt');
    let frame = 0;
    card.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--ry', `${(x * 10).toFixed(2)}deg`);
        card.style.setProperty('--rx', `${(-y * 8).toFixed(2)}deg`);
      });
    });
    card.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame);
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });
}

function setupMagnetic() {
  $$('.ak-btn:not(.ak-btn--ghost):not(.ak-btn--block), .ak-nav__menu-btn, .ak-carousel__arrow').forEach(
    (btn) => {
      btn.classList.add('ak-magnetic');
      btn.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const r = btn.getBoundingClientRect();
        btn.classList.add('is-pulled');
        btn.style.setProperty('--mx', `${((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1)}px`);
        btn.style.setProperty('--my', `${((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1)}px`);
      });
      btn.addEventListener('pointerleave', () => {
        btn.classList.remove('is-pulled');
        btn.style.setProperty('--mx', '0px');
        btn.style.setProperty('--my', '0px');
      });
    },
  );
}

/** Stickers you can grab and fling; they spring back home. */
function setupDrag() {
  $$('[data-drag]').forEach((el) => {
    let startX = 0;
    let startY = 0;
    let dragging = false;
    el.addEventListener('pointerdown', (e) => {
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      el.setPointerCapture(e.pointerId);
      el.classList.add('is-dragging');
      animate(el, { scale: 1.08 }, SPRING);
    });
    el.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      animate(el, { x: dx, y: dy, rotate: dx * 0.08 }, { duration: 0 });
    });
    const release = () => {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('is-dragging');
      animate(el, { x: 0, y: 0, rotate: 0, scale: 1 }, { type: 'spring', stiffness: 320, damping: 14 });
    };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
  });
}

/* -------------------------------------------------------------------- boot */

function boot() {
  if (reduce.matches) return;
  setupReveals();
  setupCountUps();
  setupScroll();
  setupDrag();
  if (finePointer.matches) {
    setupTilt();
    setupMagnetic();
  }
}

// After first paint, when the browser is idle: never competes with the hero.
const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void })
  .requestIdleCallback;
if (idle) idle(boot, { timeout: 600 });
else window.setTimeout(boot, 120);

// Soft spring for things other scripts animate (exported for reuse).
export { SPRING, SOFT };
