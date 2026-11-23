/**
 * Work filters — Figma 10:241. Chips with counts; the grid re-flows with a short fade/slide
 * (FLIP on the server-rendered cards). The filter lives in the URL (?type=games) and, with no
 * URL filter, follows the Home mood (Play → Games, Work → Apps).
 */
import { useEffect, useRef, useState } from 'react';

export type FilterKey = 'all' | 'apps' | 'games' | 'arcade' | 'puzzle' | 'party' | 'soon';

type Props = {
  filters: { key: FilterKey; label: string; count: number }[];
  gridId: string;
  label: string;
  resultsTemplate: string;
};

const MOOD_TO_FILTER: Record<string, FilterKey> = { play: 'games', work: 'apps' };

export default function WorkFilters({ filters, gridId, label, resultsTemplate }: Props) {
  const keys = filters.map((f) => f.key);
  const [active, setActive] = useState<FilterKey>('all');
  const first = useRef(true);
  const [announce, setAnnounce] = useState('');

  // Initial filter: ?type=… or the saved Home mood.
  useEffect(() => {
    const param = new URLSearchParams(location.search).get('type') as FilterKey | null;
    const mood = localStorage.getItem('ak-mood');
    const initial = param && keys.includes(param) ? param : mood ? MOOD_TO_FILTER[mood] : undefined;
    if (initial && initial !== 'all') setActive(initial);
  }, []);

  useEffect(() => {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    const items = Array.from(grid.querySelectorAll<HTMLElement>('[data-kinds]'));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animate = !first.current && !reduce;
    first.current = false;

    // FLIP: First
    const before = new Map(items.map((el) => [el, el.getBoundingClientRect()]));
    const wasHidden = new Map(items.map((el) => [el, el.hidden]));

    let shown = 0;
    for (const el of items) {
      const match = el.dataset.kinds!.split(' ').includes(active);
      el.hidden = !match;
      if (match) shown++;
    }

    if (animate) {
      for (const el of items) {
        if (el.hidden) continue;
        if (wasHidden.get(el)) {
          el.animate(
            [
              { opacity: 0, transform: 'translateY(16px) scale(0.98)' },
              { opacity: 1, transform: 'none' },
            ],
            { duration: 260, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
          );
        } else {
          // FLIP: Last, Invert, Play
          const a = before.get(el)!;
          const b = el.getBoundingClientRect();
          const dx = a.left - b.left;
          const dy = a.top - b.top;
          if (dx || dy) {
            el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
              duration: 260,
              easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            });
          }
        }
      }
    }

    // Keep the URL shareable without adding history entries.
    const url = new URL(location.href);
    if (active === 'all') url.searchParams.delete('type');
    else url.searchParams.set('type', active);
    history.replaceState(history.state, '', url);
    setAnnounce(resultsTemplate.replace('{n}', String(shown)));
  }, [active, gridId, resultsTemplate]);

  return (
    <div className="ak-filters">
      <div className="ak-filters__chips" role="group" aria-label={label}>
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            className="ak-chip"
            aria-pressed={active === f.key}
            aria-controls={gridId}
            onClick={() => setActive(f.key)}
          >
            <span className="ak-chip__label">{f.label}</span>
            <span className="ak-chip__count">{f.count}</span>
          </button>
        ))}
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
