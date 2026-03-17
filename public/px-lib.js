var P$ = P$ || {};

/**
 * ExDate ver1.9
 * Dateオブジェクトを継承して拡張
 * 1.0 as:指定フォーマットに変換
 * 1.1 afterdays:特定の日付後（前）を取得
 * 1.2 nextday:未来の特定曜日を取得
 * 1.3 afterminutes:特定の分後（前）を取得
 * 1.4 setbyWareki:和暦→西暦
 * 1.5 as:曜日フォーマットをsuperしてconstructorに移項
 * 1.6 prevday:以前の特定曜日を取得(nextdayも簡略化)
 * 1.7 compare:2つの日時を比較する
 * 1.8 endofmonth:月末最終日を取得／isValid:適切な日付データかチェック
 * 1.9 resolveYear: NM用に年を復活
 */
class ExDate extends Date {
  constructor(...args) {
    super(...args);
    // prettier-ignore
    this.DATE = {
          aaaa: ['日曜日','月曜日','火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
          aaa: ['日', '月', '火', '水', '木', '金', '土'],
          aa: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          a: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        };
  }
  as(format) {
    if (!this.isValid()) return '';
    /* eslint-disable */
    if (!format) return false;
    const yyyy = this.getFullYear();
    const yy = toString(yyyy).slice(-2);
    const m = this.getMonth() + 1;
    const mm = this.#returnwzero(m, 2);
    const d = this.getDate();
    const dd = this.#returnwzero(d, 2);
    const daynumber = this.getDay();
    const H = this.getHours();
    const HH = this.#returnwzero(H, 2);
    const M = this.getMinutes();
    const MM = this.#returnwzero(M, 2);
    const S = this.getSeconds();
    const SS = this.#returnwzero(S, 2);
    const aaaa = this.DATE['aaaa'][daynumber];
    const aaa = this.DATE['aaa'][daynumber];
    const aa = this.DATE['aa'][daynumber];
    const a = this.DATE['a'][daynumber];
    /* eslint-enable */
    return format
      .replace('yyyy', yyyy)
      .replace('yy', yy)
      .replace('mm', mm)
      .replace('m', m)
      .replace('dd', dd)
      .replace('d', d)
      .replace('HH', HH)
      .replace('H', H)
      .replace('MM', MM)
      .replace('M', M)
      .replace('SS', SS)
      .replace('S', S)
      .replace('aaaa', aaaa)
      .replace('aaa', aaa)
      .replace('aa', aa)
      .replace('a', a);
  }
  /**
   * afteryears 指定年数後（前）を取得
   * @param {string} years [前であれば負値]
   * @return {ExDate} dateobj
   * @memberof ExDate
   */
  afteryears(years) {
    this.setFullYear(this.getFullYear() + parseInt(years));
    return this;
  }
  /**
   * aftermonths 指定月数後（前）を取得
   * @param {string} months [前であれば負値]
   * @return {ExDate} dateobj
   * @memberof ExDate
   */
  aftermonths(months) {
    this.setMonth(this.getMonth() + parseInt(months));
    return this;
  }
  /**
   * afterdays 指定日数後（前）を取得
   * @param {string} days [前であれば負値]
   * @return {ExDate} dateobj
   * @memberof ExDate
   */
  afterdays(days) {
    this.setDate(this.getDate() + parseInt(days));
    return this;
  }
  /**
   * afterminutes 指定分数後（前）を取得
   * @param {string} minutes [前であれば負値]
   * @return {ExDate} dateobj
   * @memberof ExDate
   */
  afterminutes(minutes) {
    this.setMinutes(this.getMinutes() + parseInt(minutes));
    return this;
  }
  /**
   *次の特定曜日の日付を取得
   * @param {string} daystr [日,日曜日,Sun,Sundayいずれも可]
   * @return {object} dateobj
   * @memberof ExDate
   */
  nextday(daystr) {
    const targetnumber = Math.max(
      this.DATE.aaaa.findIndex((elm) => elm == daystr),
      this.DATE.aaa.findIndex((elm) => elm == daystr),
      this.DATE.aa.findIndex((elm) => elm == daystr),
      this.DATE.a.findIndex((elm) => elm == daystr)
    );
    if (targetnumber == -1) {
      console.log('曜日が見つかりませんでした');
      return false;
    }
    const todaynumber = this.getDay();
    let deff = targetnumber - todaynumber;
    if (deff >= 0) {
      return this.afterdays(deff);
    } else {
      return this.afterdays(deff + 7);
    }
  }
  /**
   *前の特定曜日の日付を取得
   * @param {string} daystr [日,日曜日,Sun,Sundayいずれも可]
   * @return {object} dateobj
   * @memberof ExDate
   */
  prevday(daystr) {
    const targetnumber = Math.max(
      this.DATE.aaaa.findIndex((elm) => elm == daystr),
      this.DATE.aaa.findIndex((elm) => elm == daystr),
      this.DATE.aa.findIndex((elm) => elm == daystr),
      this.DATE.a.findIndex((elm) => elm == daystr)
    );
    if (targetnumber == -1) {
      console.log('曜日が見つかりませんでした');
      return false;
    }
    const todaynumber = this.getDay();
    let deff = targetnumber - todaynumber;
    if (deff <= 0) {
      return this.afterdays(deff);
    } else {
      return this.afterdays(deff - 7);
    }
  }
  /**
   * 月末最終日を取得
   * @return {object} dateobj
   */
  endofmonth() {
    this.setMonth(this.getMonth() + 1);
    this.setDate(0);
    return this;
  }
  /**
   * 正しい日付が入力されているかCH
   * @returns bool
   */
  isValid() {
    return !isNaN(this.getTime());
  }
  /**
   *compare マニアック関数　今の日付に対して比較対象が先か前かと差分を計算
   * return.forwarddate [新しい方の日付(object)]
   * return.backwarddate [古い方の日付(object)]
   * return.forward [元が新しかったか(bool)]
   * return.backward [元が古かったか(bool)]
   * return.difference [両日時の差分(int)]
   * @param {string} comparison [比較する日付をstringもしくはobjectで指定]
   * @return {object} []
   * @memberof ExDate
   */
  compare(comparison) {
    var deff = this.getTime() - new Date(comparison).getTime();
    return {
      forwarddate: new ExDate(Math.max(this, new Date(comparison))),
      backwarddate: new ExDate(Math.min(this, new Date(comparison))),
      forward: deff > 0,
      backward: deff < 0,
      difference: deff,
    };
  }
  /**
   * #getWarekiData 各和暦の元年を取得
   * @return
   */
  #getWarekiData() {
    let ret = {};
    for (var i = 1800; i < 3000; i++) {
      let dtstring = new Intl.DateTimeFormat('ja-JP-u-ca-japanese', {
        era: 'long',
      }).format(new Date(i, 11, 31));
      if (dtstring.indexOf('1/') != -1) ret[dtstring.match(/.*(?=1\/)/)] = i;
    }
    return ret;
  }
  /**
   * setbyWareki 和暦から日付をセット 和暦以外は省略すると元の値を使う
   * @param {string} gengou [1800年～2999年までの和暦に対応]
   * @param {string} [year]
   * @param {string} [month]
   * @param {string} [date]
   * @return {object} dateobj
   * @memberof ExDate
   */
  setbyWareki(gengou, year, month, date) {
    const def = this.#getWarekiData();
    this.setDateTry(def[gengou] + parseInt(year) - 1, month, date);
    return this;
  }
  /**
   * setDateTry 日付の代入を試みる、各値を省略した場合、現在の値を使用
   * @param {number} [year]
   * @param {number} [month]
   * @param {number} [date]
   */
  setDateTry(year, month, date) {
    //組込のisNaNでは、true,false,nullはそれぞれ1,0,0に変換されるのでfalseが返ってくる。
    if (this.#isNumber(year)) this.setFullYear(year);
    if (this.#isNumber(month)) this.setMonth(month);
    if (this.#isNumber(date)) this.setDate(date);
    return this;
  }
  /**
   * returnwzero 指定桁数になるように、頭に0埋めをする
   * @param {string} string
   * @param {number} digit
   * @return {string}
   */
  #returnwzero(string, digit) {
    return ('0'.repeat(digit) + string).slice(0 - digit);
  }
  /**
   * isNumber 0以上の整数値かどうかをチェック
   * @param {string} val
   * @returns
   */
  #isNumber(val) {
    var regexp = new RegExp(/^[0-9]+(\.[0-9]+)?$/);
    return regexp.test(val);
  }
  /**
   * resolveYear 月日しかない場合に今年を補完する
   * borderdateより前であれば、翌年とする
   * @param {string|Date} borderdate string,Dateいずれも可能
   * @returns
   */
  resolveYear(borderdate) {
    const todayYear = new ExDate().as('yyyy');
    borderdate = new ExDate(borderdate || '6/1').setDateTry(
      todayYear,
      null,
      null
    );
    this.setDateTry(todayYear, null, null);
    if (this < borderdate) this.afteryears(1);
    return this;
  }
}

/**
 * PX_Toast ver1.1
 * 指定文字列のトースト表示
 * 1.0: 作成
 * 1.1: option整備
 * @param {string} toasttext トースト文字列
 * @param {object} option オプション※以下参照
 * {
 *  [color]: トースト色 ※htmlカラー,
 *  [close]: 除去イベント ※リスナー名を入れる　デフォルトはanimationend
 * }
 */
function PX_Toast(toasttext, option) {
  option = option || {};
  option.close = option.close || 'animationend';
  let toastdiv = document.createElement('div');
  toastdiv.classList.add('px-toast', option.close);
  toastdiv.innerHTML = toasttext;
  if (option.color) toastdiv.style.backgroundColor = color;
  document.getElementsByTagName('body')[0].appendChild(toastdiv);
  toastdiv.addEventListener(option.close, () => {
    toastdiv.remove();
  });
}

function Snackbar(text) {
  let snackdiv = document.createElement('div');
  snackdiv.classList.add('snackbar');
  let msgspan = document.createElement('span');
  msgspan.classList.add('snacktxt');
  msgspan.innerHTML = text;
  let closebtn = document.createElement('span');
  closebtn.classList.add('snackclose');
  snackdiv.appendChild(msgspan);
  snackdiv.appendChild(closebtn);
  document.getElementsByTagName('body')[0].appendChild(snackdiv);
  snackdiv.addEventListener('animationend', () => {
    snackdiv.remove();
  });
  closebtn.addEventListener('click', () => {
    snackdiv.remove();
  });
}

/**
 * 任意の文字列をクリップボードにコピー
 * @param {string} text [クリップボードに入れたいテキスト]
 */
function clipper(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.height = '0px';
  textarea.style.width = '0px';
  textarea.style.opacity = '0';
  textarea.style.position = 'absolute';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}
/**
 * loadScript ver1.1
 * 指定URL(CDN等)を読み込む関数(js,cssのみ対応)
 * v1.0: 作成
 * v1.1: IEを除外し、簡略化
 * @param {string} url [スクリプトのURL]
 * @param {string} scripttype [js,css]
 * @param {function} callback
 */
function loadScript_v1_1(url, scripttype, callback) {
  let script;
  if (scripttype === 'js') {
    script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
  } else if (scripttype === 'css') {
    script = document.createElement('link');
    script.type = 'text/css';
    script.href = url;
    script.rel = 'stylesheet';
  }
  if (!script) return;
  script.onload = callback;
  document.head.appendChild(script);
  console.log('LoadScript', url);
}
/**
 * loadScript ver2.0
 * 指定URL(CDN等)を読み込む関数(js,cssのみ対応)
 * v1.0: 作成
 * v1.1: IEを除外し、簡略化
 * v2.0: Promiseに対応
 * @param {string} url [スクリプトのURL]
 * @param {string} scripttype [js,css]
 * @param {function} callback
 */
function loadScript(url, scripttype, callback) {
  return new Promise((resolve, reject) => {
    let script;
    if (scripttype === 'js') {
      script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = url;
    } else if (scripttype === 'module') {
      script = document.createElement('script');
      script.type = 'module';
      script.src = url;
    } else if (scripttype === 'css') {
      script = document.createElement('link');
      script.type = 'text/css';
      script.href = url;
      script.rel = 'stylesheet';
    }
    if (!script) reject(new Error('Failed to create script tag.'));
    script.onload = () => {
      console.log(`LoadScript ${url}`);
      typeof callback === 'function' && callback();
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load script.'));
    document.head.appendChild(script);
  });
}
function PX_imgResizer(src, option) {
  var file = new Image();
  file.src = src;
  var blob = null;
  const opt = {
    width: option.width || 800,
    height: option.height || 800,
    return: option.return || 'base64',
  };
  var resized = {
    width: '',
    height: '',
  };
  /*
  //dataURLで受け取るなら、filetypeはチェックできないか。。。
  if (file.type != 'image/jpeg' && file.type != 'image/png') {
    file = null;
    blob = null;
    console.log('imgResizer Error', 'file type is neither jpeg nor png');
    return null;
  }
  */
  var ratio = file.height / file.width;
  if (file.width > file.height) {
    //横幅の方が広いなら、横幅を指定幅に
    resized.width = opt.width;
    resized.height = opt.width * ratio;
  } else {
    //縦幅の方が広いなら、縦幅を指定幅に
    resized.width = opt.height / ratio;
    resized.height = opt.height;
  }
  const canvas = document.createElement('canvas');
  canvas.width = resized.width;
  canvas.height = resized.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(file, 0, 0, resized.width, resized.height);
  var base64 = canvas.toDataURL(file.type);
  switch (opt.return) {
    case 'base64':
      return base64;
      break;
    case 'blob':
      var barr, bin, i, len;
      bin = atob(base64.split('base64,')[1]);
      len = bin.length;
      barr = new Uint8Array(len);
      i = 0;
      while (i < len) {
        barr[i] = bin.charCodeAt(i);
        i++;
      }
      var blob = new Blob([barr], { type: 'image/jpeg' });
      return blob;
      break;
  }
}

/**
 * [web_share:share機能]
 * @param {*} title
 * @param {*} text
 * @param {*} url
 * @param {*} files
 */
async function web_share(title, text, url, files) {
  if (window.navigator.share) {
    const share_data = {};
    if (title) share_data.title = title;
    if (text) share_data.text = text;
    if (url) share_data.url = url;
    if (files) share_data.files = files;
    try {
      await window.navigator.share(share_data);
    } catch (e) {
      console.log('share error', e);
    }
  } else {
    window.alert('Web Share API not support');
  }
}
