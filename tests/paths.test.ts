import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getLocaleFromPath, localizePath, stripLocale } from '../src/i18n/paths.ts';

// Astro builds the locale home pages as /uz.html and /ru.html (build.format: 'file').
test('stripLocale handles built locale home pages', () => {
  assert.equal(stripLocale('/ru.html'), '/');
  assert.equal(stripLocale('/uz.html'), '/');
  assert.equal(stripLocale('/ru'), '/');
  assert.equal(stripLocale('/uz/'), '/');
});

test('stripLocale handles nested and default-locale pages', () => {
  assert.equal(stripLocale('/'), '/');
  assert.equal(stripLocale('/index.html'), '/');
  assert.equal(stripLocale('/work.html'), '/work');
  assert.equal(stripLocale('/ru/work/uybek.html'), '/work/uybek');
  assert.equal(stripLocale('/uz/work'), '/work');
  assert.equal(stripLocale('/russian-roulette'), '/russian-roulette');
});

test('getLocaleFromPath', () => {
  assert.equal(getLocaleFromPath('/ru.html'), 'ru');
  assert.equal(getLocaleFromPath('/uz/work'), 'uz');
  assert.equal(getLocaleFromPath('/work'), 'en');
});

test('localizePath round-trips every page through every locale', () => {
  for (const page of ['/', '/work', '/work/uybek']) {
    assert.equal(localizePath(stripLocale(localizePath(page, 'ru')), 'uz'), localizePath(page, 'uz'));
  }
  assert.equal(localizePath('/', 'ru'), '/ru');
  assert.equal(localizePath('/contact#form', 'uz'), '/uz/contact#form');
  assert.equal(localizePath('/', 'en'), '/');
});
