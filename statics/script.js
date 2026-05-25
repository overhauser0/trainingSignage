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

const CT_DATE = new Date('2027/01/16 09:30:00');
const HT_DATE = new Date('2027/02/24 09:00:00');

function init() {
  document.querySelector('.netzyouicon').addEventListener('click', () => {
    window.location.reload();
  });

  renderList();
  updateThemeColors();
  refreshTime();

  setInterval(refreshTime, 1000);
  setInterval(updateThemeColors, 60000);

  // 画面タッチ時や起動時にスリープ防止をリクエスト
  requestWakeLock();

  // タブが切り替わって戻ってきた時などに再取得
  document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible') {
      await requestWakeLock();
    }
  });

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

  updateCountdown('#rest_CT', CT_DATE);
  updateCountdown('#rest_HT', HT_DATE);
  updateBalloonComment(currentRestTime);
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

function updateCountdown(selector, targetDate) {
  const el = document.querySelector(selector);
  const diffTime = targetDate - new Date();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    el.classList.add('unshown');
  } else {
    el.innerText = `${diffDays}日`;
  }
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

// 画面スリープを防止する関数
let wakeLock = null;

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('Wake Lock is active!');

      // 切断された場合に再取得する設定
      wakeLock.addEventListener('release', () => {
        console.log('Wake Lock was released');
      });
    }
  } catch (err) {
    console.error(`${err.name}, ${err.message}`);
  }
}

window.addEventListener('DOMContentLoaded', init);
