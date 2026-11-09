import { timingSafeEqual } from 'node:crypto';
import { getStore } from '@netlify/blobs';

const STORE = getStore('training-signage-settings');
const KEY = 'countdowns';
const ADMIN_PASSWORD = 'netz';

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

function isValidDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    year >= 2000 &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
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
      typeof event.date !== 'string'
    ) {
      return { error: 'テスト名と日程を確認してください。' };
    }

    const name = event.name.trim();
    if (!name || name.length > 80 || !isValidDate(event.date)) {
      return { error: 'テスト名または日程が正しくありません。' };
    }
    events.push({ name, date: event.date });
  }

  return { events };
}

function validateProfiles(value, activeProfileId) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 20) {
    return { error: 'プロファイルは1〜20件で設定してください。' };
  }

  const profiles = [];
  const ids = new Set();
  for (const profile of value) {
    if (
      !profile ||
      typeof profile.id !== 'string' ||
      !/^[a-zA-Z0-9_-]{1,64}$/.test(profile.id) ||
      ids.has(profile.id) ||
      typeof profile.name !== 'string'
    ) {
      return { error: 'プロファイルの内容を確認してください。' };
    }

    const id = profile.id;
    const name = profile.name.trim();
    if (!name || name.length > 80) {
      return { error: 'プロファイル名は1〜80文字で入力してください。' };
    }

    const validation = validateEvents(profile.events);
    if (validation.error) {
      return { error: `「${name}」の${validation.error}` };
    }
    ids.add(id);
    profiles.push({ id, name, events: validation.events });
  }

  if (typeof activeProfileId !== 'string' || !ids.has(activeProfileId)) {
    return { error: '選択中のプロファイルを確認してください。' };
  }
  return { profiles, activeProfileId };
}

function defaultSettings(events = []) {
  return {
    profiles: [{ id: 'default', name: '標準', events }],
    activeProfileId: 'default',
  };
}

function migrateStoredEvents(events) {
  if (!Array.isArray(events)) return events;

  return events.map((event) => {
    if (!event || typeof event !== 'object' || Array.isArray(event)) {
      return event;
    }

    if (typeof event.date === 'string') return event;
    if (typeof event.dateTime !== 'string') return event;
    return { ...event, date: event.dateTime.slice(0, 10) };
  });
}

export default async (request) => {
  if (request.method === 'GET') {
    const stored = await STORE.get(KEY, { type: 'json' });
    if (stored === null || stored === undefined) {
      return jsonResponse(defaultSettings());
    }

    if (Array.isArray(stored)) {
      const validation = validateEvents(migrateStoredEvents(stored));
      if (validation.error) {
        return jsonResponse(
          { error: '保存されている設定が正しくありません。' },
          500,
        );
      }
      return jsonResponse(defaultSettings(validation.events));
    }

    const storedProfiles = Array.isArray(stored?.profiles)
      ? stored.profiles.map((profile) =>
          profile && typeof profile === 'object'
            ? { ...profile, events: migrateStoredEvents(profile.events) }
            : profile,
        )
      : stored?.profiles;
    const validation = validateProfiles(
      storedProfiles,
      stored?.activeProfileId,
    );
    if (validation.error) {
      return jsonResponse(
        { error: '保存されている設定が正しくありません。' },
        500,
      );
    }
    return jsonResponse(validation);
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
  if (Buffer.byteLength(body) > 65536) {
    return jsonResponse({ error: '設定データが大きすぎます。' }, 413);
  }

  let data;
  try {
    data = JSON.parse(body);
  } catch {
    return jsonResponse({ error: '設定データの形式が正しくありません。' }, 400);
  }

  const validation = validateProfiles(data?.profiles, data?.activeProfileId);
  if (validation.error) {
    return jsonResponse({ error: validation.error }, 400);
  }

  await STORE.setJSON(KEY, validation);
  return jsonResponse(validation);
};

export const config = {
  path: '/api/settings',
};
