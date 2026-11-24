import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  TELEGRAM_LIMIT,
  formatMessage,
  isJson,
  isSameOrigin,
  parsePayload,
  validate,
} from '../src/lib/server/contact.ts';

const base = { name: 'Ada', contact: 'ada@example.com', message: 'We need an Android app for our shop.' };

test('isJson accepts only application/json', () => {
  assert.equal(isJson('application/json'), true);
  assert.equal(isJson('application/json; charset=utf-8'), true);
  assert.equal(isJson('text/plain;application/json'), false);
  assert.equal(isJson('application/jsonp'), false);
  assert.equal(isJson(null), false);
});

test('isSameOrigin rejects cross-site posts', () => {
  assert.equal(isSameOrigin('https://angrykitten.uz', 'https://angrykitten.uz/api/contact'), true);
  assert.equal(isSameOrigin(null, 'https://angrykitten.uz/api/contact'), true);
  assert.equal(isSameOrigin('https://evil.example', 'https://angrykitten.uz/api/contact'), false);
  assert.equal(isSameOrigin('null', 'https://angrykitten.uz/api/contact'), false);
});

test('single-line fields lose control characters', () => {
  const p = parsePayload({ ...base, name: 'Ada\r\nBcc: x@y.z' });
  assert.equal(p.name, 'Ada Bcc: x@y.z');
});

test('validate accepts email or Telegram, rejects list-like addresses', () => {
  assert.deepEqual(validate(parsePayload(base)), []);
  assert.deepEqual(validate(parsePayload({ ...base, contact: '@angry_kitten' })), []);
  assert.deepEqual(validate(parsePayload({ ...base, contact: 'a,b@x.com' })), ['contact']);
  assert.deepEqual(validate(parsePayload({ ...base, message: 'short' })), ['message']);
});

test('Telegram message stays under the limit and is escaped', () => {
  const long = parsePayload({ ...base, message: '<b>&'.repeat(1000) });
  const { html } = formatMessage(long);
  assert.ok(html.length <= TELEGRAM_LIMIT + 20, `length ${html.length}`);
  assert.ok(html.endsWith('… [truncated]'));
  assert.ok(!html.includes('<b>&'), 'user HTML must be escaped');
  assert.ok(!/&(?!amp;|lt;|gt;)/.test(html.replace(/<\/?b>/g, '')), 'no half-cut entities');
});
