import { timingSafeEqual } from 'node:crypto';
import { getStore } from '@netlify/blobs';

const STORE = getStore('training-signage-settings');
const KEY = 'countdowns';
const ADMIN_PASSWORD = '1TO1netz';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

function isAuthorized(request) {
  const authorization = request.headers.get('authorization') ?? '';
  if (!authorization.startsWith('Bearer ')) return false;

  const providedBuffer = Buffer.from(authorization.slice(7));
  const expectedBuffer = Buffer.from(ADMIN_PASSWORD);
  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

function isValidDateTime(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return false;

  const [, year, month, day, hour, minute] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute));
  return (
    year >= 2000 &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getUTCHours() === hour &&
    date.getUTCMinutes() === minute
  );
}

function validateEvents(value) {
  if (!Array.isArray(value) || value.length > 3) {
    return { error: 'テストは3件まで設定できます。' };
  }

  const events = [];
  for (const event of value) {
    if (
      !event ||
      typeof event.name !== 'string' ||
      typeof event.dateTime !== 'string'
    ) {
      return { error: 'テスト名と日程を確認してください。' };
    }

    const name = event.name.trim();
    if (!name || name.length > 80 || !isValidDateTime(event.dateTime)) {
      return { error: 'テスト名または日程が正しくありません。' };
    }
    events.push({ name, dateTime: event.dateTime });
  }

  return { events };
}

export default async (request) => {
  if (request.method === 'GET') {
    const events = (await STORE.get(KEY, { type: 'json' })) ?? [];
    return jsonResponse({ events });
  }

  if (request.method === 'POST') {
    if (!isAuthorized(request)) {
      return jsonResponse({ error: 'Unauthorized.' }, 401);
    }

    return new Response(null, {
      status: 204,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  if (request.method !== 'PUT') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  if (!isAuthorized(request)) {
    return jsonResponse({ error: 'Unauthorized.' }, 401);
  }

  const body = await request.text();
  if (Buffer.byteLength(body) > 8192) {
    return jsonResponse({ error: '設定データが大きすぎます。' }, 413);
  }

  let data;
  try {
    data = JSON.parse(body);
  } catch {
    return jsonResponse({ error: '設定データの形式が正しくありません。' }, 400);
  }

  const validation = validateEvents(data?.events);
  if (validation.error) {
    return jsonResponse({ error: validation.error }, 400);
  }

  await STORE.setJSON(KEY, validation.events);
  return jsonResponse({ events: validation.events });
};

export const config = {
  path: '/api/settings',
};
