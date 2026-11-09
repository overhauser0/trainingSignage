const TIMELIST = [
  { fig: '①', start: '11:05', end: '11:50' },
  { fig: '②', start: '11:55', end: '12:40' },
  { fig: '③', start: '12:45', end: '13:30' },
  { fig: '④', start: '13:35', end: '14:20' },
  { fig: '⑤', start: '14:25', end: '15:10' },
  { fig: '⑥', start: '15:15', end: '16:00' },
  { fig: '⑦', start: '16:05', end: '16:50' },
  { fig: '⑧', start: '16:55', end: '17:40' },
  { fig: '⑨', start: '17:45', end: '18:30' },
  { fig: '⑩', start: '18:35', end: '19:20' },
  { fig: '⑪', start: '19:25', end: '20:10' },
  { fig: '⑫', start: '20:15', end: '21:00' },
  { fig: '⑬', start: '21:05', end: '21:50' },
];

const SETTINGS_URL = '/api/settings';
let countdownEvents = [];
let wakeLock = null;
let signageActive = false;
let mascotPressTimer = null;
let settingsPassword = '';

function init() {
  document
    .getElementById('startSignage')
    .addEventListener('click', startSignage);
  document
    .getElementById('startCountdownSignage')
    .addEventListener('click', () => startSignage('countdown'));
  const mascot = document.querySelector('.netzyouicon');
  mascot.addEventListener('pointerdown', startMascotPressTimer);
  mascot.addEventListener('pointerup', clearMascotPressTimer);
  mascot.addEventListener('pointercancel', clearMascotPressTimer);
  mascot.addEventListener('pointerleave', clearMascotPressTimer);
  mascot.addEventListener('dblclick', (event) => {
    event.preventDefault();
    returnToHome();
  });
  mascot.addEventListener('contextmenu', (event) => event.preventDefault());
  document.getElementById('openSettings').addEventListener('click', openSettings);
  document
    .getElementById('settingsAuthForm')
    .addEventListener('submit', authorizeSettings);
  document
    .getElementById('cancelSettingsAuth')
    .addEventListener('click', closeSettingsAuth);
  document
    .getElementById('closeSettings')
    .addEventListener('click', closeSettings);
  document
    .getElementById('settingsForm')
    .addEventListener('submit', saveSettings);
  renderList();
  updateThemeColors();
  refreshTime();
  loadSettings();

  setInterval(refreshTime, 1000);
  setInterval(updateThemeColors, 60000);

  registSW();
}

function refreshTime() {
  const now = new Date();

  // 時刻フォーマット (HH:mm)
  const currentTime =
    now.getHours().toString().padStart(2, '0') +
    ':' +
    now.getMinutes().toString().padStart(2, '0');

  updateDateTime(now, currentTime);

  // 時間割のハイライトと残り時間計算
  let currentRestTime = 0;
  document.querySelectorAll('.timetable_item').forEach((el, index) => {
    el.classList.remove('colorpencil');
    const item = TIMELIST[index];

    if (
      timeDiff(currentTime, item.start) >= 0 &&
      timeDiff(currentTime, item.end) < 0
    ) {
      el.classList.add('colorpencil');
      currentRestTime = timeDiff(item.end, currentTime) / (1000 * 60);
    }
  });

  updateCountdowns();
  updateBalloonComment(currentRestTime);
}

function renderCountdowns() {
  const container = document.querySelector('.body_note');
  container.replaceChildren();
  document
    .getElementById('signageScreen')
    .style.setProperty('--countdown-count', Math.max(countdownEvents.length, 1));

  if (countdownEvents.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'countdown-empty';
    emptyMessage.innerText = '設定画面からカウントダウンを登録してください。';
    container.appendChild(emptyMessage);
    return;
  }

  countdownEvents.forEach(({ name, dateTime }, index) => {
    const targetDate = new Date(dateTime);
    const item = document.createElement('div');
    item.className = 'countdown_item';
    item.id = `countdown-item-${index}`;

    const labelEl = document.createElement('span');
    labelEl.className = 'countdown_label';
    labelEl.innerText = name;

    const valueEl = document.createElement('span');
    valueEl.className = 'countdown_value';

    const numberEl = document.createElement('span');
    numberEl.className = 'countdown_number';
    numberEl.id = `countdown-${index}`;

    const unitEl = document.createElement('span');
    unitEl.className = 'countdown_unit';
    unitEl.innerText = '日';

    valueEl.append(numberEl, unitEl);
    item.append(labelEl, valueEl);
    container.appendChild(item);
  });

  updateCountdowns();
}

async function loadSettings() {
  const status = document.getElementById('homeStatus');

  try {
    const response = await fetch(SETTINGS_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`設定の読み込みに失敗しました (${response.status})`);
    const data = await response.json();
    countdownEvents = normalizeEvents(data.events);
    renderCountdowns();
    populateSettingsForm();
    setStatus(status, '設定を読み込みました。', false);
  } catch (error) {
    console.error('Settings load failed:', error);
    setStatus(status, '設定を読み込めません。Netlifyへの接続を確認してください。', true);
  }
}

function normalizeEvents(events) {
  if (!Array.isArray(events)) return [];

  return events
    .slice(0, 3)
    .filter(
      (event) =>
        event &&
        typeof event.name === 'string' &&
        typeof event.dateTime === 'string' &&
        event.name.trim() &&
        !Number.isNaN(new Date(event.dateTime).getTime()),
    )
    .map((event) => ({ name: event.name.trim(), dateTime: event.dateTime }));
}

function populateSettingsForm() {
  for (let index = 0; index < 3; index += 1) {
    const event = countdownEvents[index];
    document.getElementById(`eventName${index + 1}`).value = event?.name ?? '';
    document.getElementById(`eventDate${index + 1}`).value =
      event?.dateTime ?? '';
  }
}

async function openSettings() {
  closeSettingsAuth();
  document.getElementById('settingsAuthPanel').classList.remove('hidden');
  document.getElementById('settingsAuthPassword').focus();
}

async function authorizeSettings(event) {
  event.preventDefault();
  const passwordInput = document.getElementById('settingsAuthPassword');
  const status = document.getElementById('settingsAuthStatus');
  const submitButton = document.querySelector(
    '#settingsAuthForm button[type="submit"]',
  );
  const password = passwordInput.value;
  submitButton.disabled = true;
  setStatus(status, 'パスワードを確認しています…', false);

  try {
    const response = await fetch(SETTINGS_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${password}` },
    });

    if (response.status === 401) {
      setStatus(status, 'パスワードが正しくありません。', true);
      return;
    }
    if (!response.ok) {
      throw new Error(`パスワードの確認に失敗しました (${response.status})`);
    }

    settingsPassword = password;
    passwordInput.value = '';
    document.getElementById('settingsAuthPanel').classList.add('hidden');
    populateSettingsForm();
    document.getElementById('settingsStatus').innerText = '';
    document.getElementById('settingsPanel').classList.remove('hidden');
    document.getElementById('eventName1').focus();
  } catch (error) {
    console.error('Settings authorization failed:', error);
    setStatus(
      status,
      error.message || 'パスワードを確認できませんでした。',
      true,
    );
  } finally {
    submitButton.disabled = false;
  }
}

function closeSettingsAuth() {
  document.getElementById('settingsAuthPanel').classList.add('hidden');
  document.getElementById('settingsAuthPassword').value = '';
  document.getElementById('settingsAuthStatus').innerText = '';
}

function closeSettings() {
  document.getElementById('settingsPanel').classList.add('hidden');
  settingsPassword = '';
}

async function saveSettings(event) {
  event.preventDefault();
  const status = document.getElementById('settingsStatus');
  const events = [];

  for (let index = 1; index <= 3; index += 1) {
    const name = document.getElementById(`eventName${index}`).value.trim();
    const dateTime = document.getElementById(`eventDate${index}`).value;

    if (!name && !dateTime) continue;
    if (!name || !dateTime) {
      setStatus(status, `テスト${index}の名前と日程を両方入力してください。`, true);
      return;
    }
    events.push({ name, dateTime });
  }

  const password = settingsPassword;
  const saveButton = document.querySelector('#settingsForm button[type="submit"]');
  saveButton.disabled = true;
  setStatus(status, '保存しています…', false);

  try {
    const response = await fetch(SETTINGS_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${password}`,
      },
      body: JSON.stringify({ events }),
    });

    if (response.status === 401) {
      throw new Error('管理用パスワードが正しくありません。');
    }
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || `保存に失敗しました (${response.status})`);
    }

    const result = await response.json();
    countdownEvents = normalizeEvents(result.events);
    renderCountdowns();
    closeSettings();
    setStatus(document.getElementById('homeStatus'), '設定を保存しました。', false);
  } catch (error) {
    console.error('Settings save failed:', error);
    setStatus(status, error.message || '設定を保存できませんでした。', true);
  } finally {
    saveButton.disabled = false;
  }
}

function setStatus(element, message, isError) {
  element.innerText = message;
  element.classList.toggle('error', isError);
}

function renderList() {
  const container = document.querySelector('.timeline_wrap');
  const tlTable = document.createElement('div');
  tlTable.className = 'timetable';

  TIMELIST.forEach((item, index) => {
    const itemEl = document.createElement('div');
    itemEl.className = 'timetable_item';
    itemEl.setAttribute('num', index);
    itemEl.innerHTML = `<span>${item.fig}</span><span class="fg-10 textcenter">${item.start}～${item.end}</span>`;
    tlTable.appendChild(itemEl);
  });
  container.appendChild(tlTable);
}

function updateDateTime(now, currentTime) {
  // 日付・曜日取得
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const dayEn = now.toLocaleDateString('en-US', { weekday: 'short' }); // Sun, Mon...

  // DOM更新
  document.querySelector('.today_month').innerText = month;
  document.querySelector('.today_date').innerText = date;
  const dayEl = document.querySelector('.today_day');
  dayEl.innerText = dayEn;

  // 曜日スタイル変更
  dayEl.classList.remove('lazred', 'lazuli');
  if (dayEn === 'Sun') dayEl.classList.add('lazred');
  if (dayEn === 'Sat') dayEl.classList.add('lazuli');

  document.querySelector('.time_inner').innerText = currentTime;
}

function updateCountdowns() {
  const now = new Date();
  const countdownLayout = document
    .getElementById('signageScreen')
    .classList.contains('countdown-layout');

  countdownEvents.forEach(({ dateTime }, index) => {
    const targetDate = new Date(dateTime);
    const diffDays = Math.floor((targetDate - now) / (1000 * 60 * 60 * 24));
    const item = document.getElementById(`countdown-item-${index}`);
    const number = document.getElementById(`countdown-${index}`);
    if (!item || !number) return;

    item.classList.toggle('unshown', diffDays <= 0 && !countdownLayout);
    number.innerText = Math.max(diffDays, 0);
  });
}

function updateBalloonComment(resttime) {
  let comment = 'お疲れ様！次も頑張ろう';
  if (resttime > 25) comment = 'さあ頑張ろう！';
  else if (resttime > 5) comment = 'あと半分！';
  else if (resttime > 0) comment = '残り５分 あと少し！';

  document.querySelector('.baloon').innerText = comment;
}

function timeDiff(time1, time2) {
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  const d1 = new Date().setHours(h1, m1, 0, 0);
  const d2 = new Date().setHours(h2, m2, 0, 0);
  return d1 - d2;
}

function updateThemeColors() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const hour = now.getHours();
  const body = document.body;

  // クラスの一括リセット
  body.classList.remove(
    'season-spring',
    'season-summer',
    'season-autumn',
    'season-winter',
    'time-morning',
    'time-day',
    'time-night',
  );

  // 季節
  if (month >= 3 && month <= 5) body.classList.add('season-spring');
  else if (month >= 6 && month <= 8) body.classList.add('season-summer');
  else if (month >= 9 && month <= 11) body.classList.add('season-autumn');
  else body.classList.add('season-winter');

  // 時間帯
  if (hour >= 6 && hour <= 11) body.classList.add('time-morning');
  else if (hour >= 12 && hour <= 17) body.classList.add('time-day');
  else body.classList.add('time-night');
}

function registSW() {
  if (
    'serviceWorker' in navigator &&
    (location.protocol === 'https:' || location.hostname === 'localhost')
  ) {
    navigator.serviceWorker
      .register('./sw.js')
      .then((reg) => {
        console.log('SW registered');
        reg.onupdatefound = () => reg.update();
      })
      .catch((err) => console.log('SW failed', err));
  }
}

async function startSignage(layout = 'timetable') {
  const startButton = document.getElementById(
    layout === 'countdown' ? 'startCountdownSignage' : 'startSignage',
  );
  const status = document.getElementById('homeStatus');
  startButton.disabled = true;

  try {
    if (!('wakeLock' in navigator)) {
      throw new Error('このブラウザーは画面スリープ防止に対応していません。');
    }

    const lock = await navigator.wakeLock.request('screen');
    wakeLock = lock;
    signageActive = true;
    lock.addEventListener('release', handleWakeLockRelease, { once: true });
    document.getElementById('homeScreen').classList.add('hidden');
    const signageScreen = document.getElementById('signageScreen');
    signageScreen.classList.toggle('countdown-layout', layout === 'countdown');
    signageScreen.classList.remove('hidden');
    updateCountdowns();

    if (lock.released) handleWakeLockRelease();
  } catch (error) {
    console.error('Wake Lock request failed:', error);
    setStatus(
      status,
      '画面スリープ防止を開始できませんでした。画面を表示した状態で再度お試しください。',
      true,
    );
  } finally {
    startButton.disabled = false;
  }
}

function handleWakeLockRelease() {
  wakeLock = null;

  if (!signageActive) return;

  signageActive = false;
  const signageScreen = document.getElementById('signageScreen');
  signageScreen.classList.add('hidden');
  signageScreen.classList.remove('countdown-layout');
  document.getElementById('homeScreen').classList.remove('hidden');
  setStatus(
    document.getElementById('homeStatus'),
    '画面スリープ防止が解除されたため、トップ画面に戻りました。',
    true,
  );
}

async function returnToHome() {
  signageActive = false;
  const signageScreen = document.getElementById('signageScreen');
  signageScreen.classList.add('hidden');
  signageScreen.classList.remove('countdown-layout');
  document.getElementById('homeScreen').classList.remove('hidden');

  const lock = wakeLock;
  wakeLock = null;
  if (lock && !lock.released) {
    try {
      await lock.release();
    } catch (error) {
      console.error('Wake Lock release failed:', error);
      setStatus(
        document.getElementById('homeStatus'),
        'トップ画面に戻りましたが、画面スリープ防止を解除できませんでした。',
        true,
      );
    }
  }
}

function startMascotPressTimer() {
  clearMascotPressTimer();
  mascotPressTimer = setTimeout(() => {
    mascotPressTimer = null;
    returnToHome();
  }, 700);
}

function clearMascotPressTimer() {
  if (mascotPressTimer === null) return;

  clearTimeout(mascotPressTimer);
  mascotPressTimer = null;
}

window.addEventListener('DOMContentLoaded', init);
