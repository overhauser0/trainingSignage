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

// 一度にスクリプトを読み込むための関数
function loadScripts(scripts) {
  scripts.forEach((script) => {
    loadScript(script.src, script.type, script.callback);
  });
}

function init() {
  $('.netzyouicon').on('click', function () {
    window.location.reload();
  });
  renderList();
  updateThemeColors(); // 初回実行

  // タイマーの更新
  setInterval(refleshTime, 1000);
  setInterval(updateThemeColors, 60000);
}

function refleshTime() {
  const now = new ExDate();
  const currentTime = now.as('HH:MM');
  const currentDay = now.as('a');
  let resttime = 0;

  // 日時を変更
  $('.today_month').text(now.as('m'));
  $('.today_date').text(now.as('d'));
  $('.today_day').text(currentDay);

  // 曜日スタイル変更
  updateDayStyle(currentDay);
  $('.time_inner').text(currentTime);

  // 時間割に線を引く
  $('.timetable_item').removeClass('colorpencil');
  TIMELIST.forEach((item, num) => {
    if (
      timeDeff(currentTime, item.start) >= 0 &&
      timeDeff(currentTime, item.end) < 0
    ) {
      $(`.timetable_item[num=${num}]`).addClass('colorpencil');
      resttime = timeDeff(item.end, currentTime) / (1000 * 60);
    }
  });

  // 各種カウントダウンを更新
  const CTDate = new ExDate('2027/1/16 9:30');
  const HTDate = new ExDate('2026/2/25 9:00');

  updateCountdown('#rest_CT', CTDate);
  updateCountdown('#rest_HT', HTDate);

  // バルーンコメント変更
  updateBalloonComment(resttime);
}

function renderList() {
  const TLTable = $('<div>', { class: 'timetable' }).appendTo('.timeline_wrap');
  TIMELIST.forEach((item, num) => {
    TLTable.append(
      `<div class="timetable_item" num="${num}"><span>${item.fig}</span><span class="fg-10 textcenter">${item.start}～${item.end}</span></div>`,
    );
  });
}

function updateDayStyle(day) {
  $('.today_day').removeClass('lazred lazuli');
  if (day === 'Sun') {
    $('.today_day').addClass('lazred');
  } else if (day === 'Sat') {
    $('.today_day').addClass('lazuli');
  }
}

function updateCountdown(selector, targetDate) {
  const rest = Math.floor((targetDate - new ExDate()) / (1000 * 3600 * 24));
  if (rest <= 0) {
    $(selector).addClass('unshown');
  } else {
    $(selector).text(`${rest}日`);
  }
}

function updateBalloonComment(resttime) {
  let comment = 'お疲れ様！次も頑張ろう';
  if (resttime > 25) {
    comment = 'さあ頑張ろう！';
  } else if (resttime > 5) {
    comment = 'あと半分！';
  } else if (resttime > 0) {
    comment = '残り５分　あと少し！';
  }
  $('.baloon').text(comment);
}

function timeDeff(time1, time2) {
  const [hour1, minute1] = time1.split(':').map(Number);
  const [hour2, minute2] = time2.split(':').map(Number);
  const date1 = new Date().setHours(hour1, minute1);
  const date2 = new Date().setHours(hour2, minute2);
  return date1 - date2;
}

function updateThemeColors() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const hour = now.getHours();
  const body = document.body;

  // 既存のクラスを削除
  body.classList.remove(
    'season-spring',
    'season-summer',
    'season-autumn',
    'season-winter',
  );
  body.classList.remove('time-morning', 'time-day', 'time-night');

  // 季節判定
  if (month >= 3 && month <= 5) {
    body.classList.add('season-spring');
  } else if (month >= 6 && month <= 8) {
    body.classList.add('season-summer');
  } else if (month >= 9 && month <= 11) {
    body.classList.add('season-autumn');
  } else {
    body.classList.add('season-winter');
  }

  // 時間帯判定
  if (hour >= 6 && hour <= 11) {
    body.classList.add('time-morning');
  } else if (hour >= 12 && hour <= 17) {
    body.classList.add('time-day');
  } else {
    body.classList.add('time-night');
  }
}

function registSW() {
  if (
    'serviceWorker' in navigator &&
    (location.protocol === 'https:' ||
      location.hostname === 'localhost' ||
      location.hostname === '127.0.0.1')
  ) {
    window.addEventListener('load', function () {
      navigator.serviceWorker
        .register('./sw.js')
        .then(function (registration) {
          console.log(
            `ServiceWorker registration successful with scope: ${registration.scope}`,
          );
          registration.onupdatefound = () => registration.update();
        })
        .catch(function (err) {
          console.log(`ServiceWorker registration failed: ${err}`);
        });
    });
  }
}

// 初期スクリプトの読み込み
loadScripts([
  {
    src: './statics/jquery-3.5.1.min.js',
    type: 'js',
    callback: function () {
      loadScripts([
        { src: './style.css', type: 'css' },
        {
          src: 'https://fonts.googleapis.com/css2?family=Fira+Sans:ital,wght@1,500&family=Noto+Sans+JP&display=swa>',
          type: 'css',
        },
      ]);
      registSW();
    },
  },
]);
