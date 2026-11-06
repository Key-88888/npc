/* «Не По Сценарию» (НПС; рабочее имя было «Подвох») — кликабельный прототип единого продукта. Файлы: app.js (первая сессия, ход, чат, находка, крупицы, финал),
   more.js (Дело второго дня, кодекс, бестиарий, скрытый уровень, закулисье) и puppet.js (Тимур v4: рисование тела, позы, точки крепления нитей; грузится до app.js). Данные — в объектах DATA и EXT. Без сети, без ПДн;
   состояние на устройстве (localStorage, в try/catch), на сервер не уходит ничего.
   Состояния по хэшу: #s=intro|choice|stamp|reveal|pillar|found|crumbs|end|day2|day3|day4|codex|bestiary|hidden|home|settings|backstage|quest (step=title|step2|step3|catch|final).
   Первая сессия — квест «Суббота» (заход C, 04.11): заставка → шаг 1 «Тимур» → шаг 2 «Чат класса» → шаг 3 «Витрина» → «Без нитей» → итог; нить-тропа сверху, вкладки «Бестиарий» и «Кодекс» появляются действием.
   ФЛАГИ — ТОЛЬКО В ХЭШЕ (после «#», через «&»; адресная строка вида index.html#reset&w0):
     #reset   один раз стирает сохранённое состояние и сразу убирает себя из адреса (history.replaceState): перезагрузка и открытие
              из истории прогресс повторно не стирают. Остальные флаги в хэше остаются.
     #now     (и now=1) второе Дело без ожидания 07:00 — для проверки; участникам ссылку без него.
     #w0      режим недели 0: скрытые приёмы выключены с самого начала; это сохраняется в состоянии и видно в настройках.
     demo=1   насыщенное демо · day=N игровой день · t=H час на устройстве · s=… и step=… состояние для рендера.
   Чистое открытие (без хэша и без сохранённого состояния) ведёт в первую сессию. Штамп сборки — константа BUILD ниже. */
(function () {
  'use strict';
  var EXT = window.EXT;
  /* штамп сборки: наблюдатель записывает его в лист (виден в настройках → «Для взрослых»); при заморозке версии менять код вручную */
  var BUILD = '2026-11-07 · w0-13';

  /* ================= ДАННЫЕ ================= */
  /* Тексты — из материалы/тексты-первой-сессии.md (заход D, 04.11): голос А — рассказчик («что происходит»), голос Б — реплики персонажей строчными.
     Лимиты слов сняты правилом владельца: объяснять и завлекать, а не выдавливать по слову. Приём называется глаголом (Льстит, Давит толпой, Торопит, Тут честно), существо — именем (Подлиза, Толпа, Таймер, Решала). */
  var DATA = {
    open: 'В субботу? Не, у меня дел куча.',
    gaveUp: 'Ладно. Всё. Иду. Только отстань.',
    sceneIntro: 'Коридор, большая перемена. Тимур стоит у окна, наушники на шее, в руке телефон. Позови его в гараж на субботу.',
    lampIntro: 'Внизу четыре фразы. Каждая двигает Тимура по шкале. На семёрке он сдаётся.',
    lampLate: 'Честный вопрос после трёх приёмов звучит уже как издёвка. Но спросить никогда не поздно.',
    stampCap: 'Есть. Три фразы — и человек сдался.',
    feelSay: 'Тимур идёт. Только настроение у него теперь как у человека, которого уговорили.',
    invIntro: ['Готово. Тимур идёт. Три фразы, и человек сдался. Легко, да?', 'А теперь час спустя. Тимур пишет тебе. Читай внимательно.'],
    invCall: ['Ничего не напоминает? Это твои фразы. Слово в слово.', 'Теперь он уговаривает тебя, и ты уже знаешь, как это работает.'],
    okLeft: 'Осталось ещё одно сообщение. Тапни и его: давят тут или нет?',
    realQ: 'ну так что, идёшь в субботу или нет?',
    vsub: 'Теперь ты знаешь все его приёмы. Отвечай как хочешь: правильного ответа тут нет, у каждого своя цена.',
    cards: {
      lest: { name: 'ЛЕСТЬ', title: 'Подлизаться', line: 'Ты же не как все. Тебе там точно зайдёт.', plus: 2, att: 'L', said: 'Ну… да ладно. Хотя, может, и правда.',
              lamp: 'Сработало: Тимур любит, когда его хвалят. Особенно ни за что.',
              explain: 'Льстит. Похвала авансом: после «ты же не как все» отказаться — значит стать как все. Хитро.',
              miss: 'Не то. Посмотри: Тимур тебя хвалит. Зачем — прямо перед просьбой?' },
      vse:  { name: 'ВСЕ УЖЕ', title: 'Все уже идут', line: 'Все наши уже идут, только тебя ждём.', plus: 3, att: 'C', said: 'Все? Прям все? Ну если все, то как-то неудобно не прийти.',
              lamp: 'Сработало сильнее всего: Тимур боится оказаться тем, кто не пришёл.',
              explain: 'Давит толпой. „Все наши“ — это кто? Имён нет. Есть только чувство, что все уже там, а тебя нет. Спроси: кто именно?',
              miss: 'Не то. Тут не про время и не про тебя. Тут про каких-то других людей. Каких?' },
      sro:  { name: 'СРОЧНОСТЬ', title: 'Поторопить', line: 'Запись только до пятницы. Потом всё.', plus: 2, att: 'R', said: 'До пятницы? Блин. А сколько мест осталось?',
              lamp: 'Сработало: Тимур терпеть не может что-то упускать. Даже то, что ему не нужно.',
              explain: 'Торопит. Когда времени мало, думать некогда. А тому, кто торопит, только это и нужно.',
              miss: 'Не то. Тут главное слово — «пятница». Что оно делает со временем на подумать?' },
      ok:   { name: 'ЧИСТО', title: 'Спросить честно', line: 'Ты идёшь в субботу?', plus: 1, said: 'Не знаю. Посмотрим.',
              lamp: 'Честный вопрос — честный ответ. Но чтобы Тимур пошёл, шкала должна дойти до семи. Так не дотянуть.',
              explain: 'Без подвоха. Обычный вопрос: отвечай как хочешь. Видеть, где не давят, — тоже умение.',
              miss: 'Мимо, и ничего страшного. Это просто вопрос: Тимур спрашивает, а не давит. Искать подвох в каждом сообщении — тоже так себе привычка.' }
    },
    hand: ['lest', 'vse', 'sro', 'ok'], /* четвёртая карта «Спросить честно» — честный вопрос: +1, без приёма; без трёх приёмов цель 7 недостижима */
    /* последняя строка чата называется сама: подставляется по оставшемуся приёму */
    lastSelf: {
      lest: 'А последнюю и подсказывать не надо. „Ты же не как все“ — Тимур льстит. Ровно как ты пять минут назад.',
      vse: 'А последнюю и подсказывать не надо. „Все наши уже идут“ — давит толпой. Ровно как ты пять минут назад.',
      sro: 'А последнюю и подсказывать не надо. „Только до пятницы“ — торопит. Ровно как ты пять минут назад.'
    },
    // точки крепления нитей: pin — гвоздик на ваге, tx/ty — узелок на нейтральном Тимуре (viewBox 360x400: голова 192.5,81 · левая кисть 145,188 · правая кисть 218,216);
    // при позах точки считает PUP.attach, эти значения — нейтральная поза. tagT — где на нити висит бирка (доля длины), tagAlign — куда от нити она уходит
    attach: {
      L: { pin: 108, tx: 145, ty: 188, key: 'l',    tagT: .5,  tagAlign: -1 },
      C: { pin: 180, tx: 192.5, ty: 81, key: 'head', tagT: .55, tagAlign: 0 },
      R: { pin: 270, tx: 218, ty: 216, key: 'r',    tagT: .5,  tagAlign: 1 }
    },
    // три ответа как речь; реплика Тимура; «Что это тебе стоило» словами (С Тимуром · Со временем · С обещаниями) — ни один путь не лучше по всем трём; «Так рассуждают …» (mono);
    // «А с другой стороны —» (hotya) возражает ВЫБРАННОМУ пути. Схема как в ТЗ §12: chosen_option — ВЫБРАННЫЙ путь, counter_option — НЕПРИНЯТЫЙ путь, за который довод, view_id — взгляд пути counter_option
    pillars: [
      { id: 'stoic',     view: 'stoic',     move: 'Подумаю и отвечу в пятницу. Раньше не жди.', say: 'ну ок. жду в пятницу',
        cost: [['С Тимуром', 'ровно, просто ждёт ответа.'], ['Со временем', 'суббота пока свободна.'], ['С обещаниями', 'теперь на тебе ответ до пятницы.']],
        text: 'Моё «да» не зависит от того, сколько «да» уже сказали.', from: 'из ответа Тимуру',
        mono: 'Стоики делили мир на две кучи: что от тебя зависит и что нет. Чужой срок, чужой напор, чужое «все уже идут» — не от тебя. Твой ответ и время, когда ты его даёшь, — от тебя. Отсюда спокойствие: никто не может заставить тебя решить прямо сейчас. Слабое место в том, что спокойствие легко принять за холод. Тимуру не нужны рассуждения: ему нужно знать, будет ли у него в субботу компания.',
        hotya: { chosen_option: 'stoic', counter_option: 'socrates', view_id: 'socrates', text: 'Пятница ничего не изменит, если до пятницы ничего не спросить. Кто эти «все», так и останется загадкой, а давление просто подождёт три дня.' },
        other: { id: 'c-socr', text: 'Прежде чем соглашаться, прошу назвать основания.', alts: ['«Почему именно так?» — нормальный вопрос.', 'Согласие без оснований — не моё.', 'Сначала «кто именно?», потом «да» или «нет».'] },
        alts: ['Моё «да» — моё, сколько бы «да» ни было до меня.', 'Чужие «да» — не мой счёт.', 'Сначала спрашиваю себя, потом считаю остальных.'] },
      { id: 'socrates',  view: 'socrates',  move: 'Погоди. Кто эти «все»? Назови хоть троих.', say: 'ну… даня, лёва. макс вроде. ладно, не все',
        cost: [['С Тимуром', 'немного задет — допрос никто не любит.'], ['Со временем', 'суббота пока свободна.'], ['С обещаниями', 'ничего не обещано.']],
        text: 'Когда говорят «все», спрашиваю: кто именно?', from: 'из ответа Тимуру',
        mono: 'Две с половиной тысячи лет назад в Афинах жил человек, который на всё отвечал вопросом. «Все так думают» — «Кто все?» «Это же очевидно» — «Объясни». Его сила в том, что вопрос не давит: он просто заставляет показать, на чём всё держится. Если держится на воздухе, это видно сразу. Обратная сторона тоже понятна: Сократа считали занудой, а в конце просто устали от его вопросов. Спрашивать — хорошо. Спрашивать всё время — утомительно для всех.',
        hotya: { chosen_option: 'socrates', counter_option: 'pragm', view_id: 'pragm', text: 'Допрос портит вечер, даже если гараж и правда хороший. Иногда проще не выяснять, кто там будет, а просто съездить и посмотреть.' },
        other: { id: 'c-pragm', text: 'Иногда проще проверить на деле: съездить и посмотреть.', alts: ['Сначала попробовать, потом решать.', 'Пробую на деле, а не спорю заранее.', 'Лучше увидеть своими глазами, чем гадать.'] },
        alts: ['Если говорят «все» — прошу назвать хотя бы двоих.', 'Когда давят толпой, я задаю вопрос.', 'Сначала «кто именно?», потом «да» или «нет».'] },
      { id: 'pragm',     view: 'pragm',     move: 'Да еду я, еду. Мне правда интересно, что там за гараж.', say: 'огонь. тогда в субботу в два',
        cost: [['С Тимуром', 'рад, и это видно.'], ['Со временем', 'суббота занята.'], ['С обещаниями', 'теперь на тебе прийти к двум.']],
        text: 'Интересно — иду и смотрю на месте, а не гадаю.', from: 'из ответа Тимуру',
        mono: 'Прагматисты не спорят о том, хорош ли гараж. Они идут и смотрят. Идея хороша, если работает на деле, а проверить это можно только на деле. Интересно — значит, едешь, без долгих раздумий. Сила такого подхода в том, что он не даёт застрять в «а вдруг». Обратная сторона: «просто попробовать» можно что угодно, и не всегда видно, где кончается интерес и начинается чужой напор.',
        hotya: { chosen_option: 'pragm', counter_option: 'stoic', view_id: 'stoic', text: 'Согласие сразу — это их срок, а не твой. Своё «когда» не обязано совпадать с чужим календарём. Интересно? Отлично. Но это можно было сказать и в пятницу.' },
        other: { id: 'c-stoic', text: 'Моё «когда» не обязано совпадать с чужим календарём.', alts: ['Решаю в свой срок, не в чужой.', 'Чужой дедлайн — не мой закон.', 'Сначала мой календарь, потом их.'] },
        alts: ['Интерес — достаточная причина проверить.', 'Хочу увидеть своими глазами, а не гадать.', 'Пробую, а не гадаю.'] }
    ],
    /* «А теперь — по-честному»: три приглашения; ответ Тимура зависит от заранее заданного интереса (он любит музыку) */
    intro2: ['Тот же Тимур. Только теперь у тебя нет приёмов: ни лести, ни толпы, ни сроков. Позови его так, чтобы решал он сам.', 'Одно известно точно: Тимур живёт в наушниках. Музыка — это его.'],
    invites: [
      { id: 'clear', text: 'В субботу в гараже собираем колонку и настраиваем звук. Хочешь — приходи, без обязательств.', say: 'Колонку? Так, это уже интересно. Загляну на часок.', act: 'снимает наушник', to: 7,
        cap: 'Вот. Ясно, по делу и с тем, что ему правда интересно. А выбор остался за ним. Это и есть честно уговорить.', end: 'Тимур в гараже. Сам решил.' },
      { id: 'vague', text: 'Ну… приходи, если что.', say: 'Не знаю… посмотрим.', act: '', to: 4,
        cap: 'Дверь открыта, но заходить незачем. Тимур не понял, что там будет и зачем ему туда.', end: 'Тимур пока сомневается. Дверь открыта.' },
      { id: 'guilt', text: 'Без тебя всё развалится. Ты же нас не бросишь?', say: 'Звучит как долг. Не, пас.', act: 'отворачивается', to: 2,
        cap: 'Без лести, без толпы, без сроков — а всё равно давит. Это вина. Тоже давление, только тихое.', end: 'Тимур не пришёл. Это тоже результат — и честный.' }
    ]
  };
  var ALL = ['sro', 'vse', 'lest'];

  /* ================= СОСТОЯНИЕ ================= */
  var S;
  function fresh() {
    return { real: false, moves: [], picked: null, caught: [], misses: {}, open: null, ord: null, lastCaught: null, hint: '',
             basis: null, cands: null, rs: { open: false, saved: false, text: '' }, honest: null, auto: null, scr: 'play',
             /* состояние остальных разделов (его читает и пишет more.js) */
             ext: {} };
  }
  S = fresh();

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var buzz = function (n) { try { if (S && S.ext && S.ext.sound === false) return; if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(n); } catch (e) { /* нет вибрации — не страшно */ } };
  var timers = [];
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; flying = false; tipReset(); }
  function setHashQuiet(name) { try { history.replaceState(null, '', S && S.real ? location.pathname + location.search : '#s=' + name); } catch (e) { /* file:// в некоторых окружениях */ } }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var REDUCED = false;
  try { REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { /* без media — с анимацией */ }

  /* ================= ПОДСКАЗКИ-СТРЕЛКИ (первый запуск, немодально) =================
     Пузырь с pointer-events:none, затемнения и кнопки «Понятно» нет, цель остаётся открытой для тапа. Одна подсказка за раз.
     Флаги — S.ext.tips = {t1:1, …}: каждая показывается один раз на устройстве; в Деле 2 и при повторных проходах подсказок нет (S.ext.day1Done).
     Гаснет на первом верном тапе по цели (fade 150 мс, флаг пишется сразу); цель обводится пульсирующим контуром --lamp.
     Подсказки — управление, а не текст: ≤7 слов, без форм рода. T1 — сцена, T2 — после хода 1, T3 — штамп, T4 — чат, T5 — правило. */
  var TIPS = {
    t1: { text: 'Тапни фразу — Тимур её услышит', dir: 'down', targets: function () { return $$('#cards .card'); }, anchor: function (t) { return t[Math.min(1, t.length - 1)]; } },
    t2: { text: 'Набери 7 — и Тимур идёт', dir: 'up', narrow: 134, align: 'start', targets: function () { return $$('#notches i.goal'); } },
    t3: { text: 'Жми штамп — дело сделано', dir: 'up', targets: function () { return [$('#stamp')]; } },
    t4: { text: 'Тапни сообщение — назови приём', dir: 'down', targets: function () { return $$('#tags .tag').slice(0, 1); } },
    t5: { text: 'Подходит? Забирай в свои выводы', dir: 'up', targets: function () { var b = $('.cr2[data-c="n1"] [data-a="keep"]'); return b ? [b] : []; } }
  };
  var TIP = { cur: null, el: null, hold: {} };
  function tipOn() { return !!(S && S.ext && !S.ext.day1Done && !OPT.notips); }
  function tipSeen(id) { return !!(S && S.ext && S.ext.tips && S.ext.tips[id]); }
  function tipMark(id) { if (!S || !S.ext) return; if (!S.ext.tips) S.ext.tips = {}; S.ext.tips[id] = 1; }
  function tipRingOff() { $$('.tip-target').forEach(function (x) { x.classList.remove('tip-target'); }); }
  function tipPlace() {
    var el = TIP.el, d = TIPS[TIP.cur]; if (!el || !d) return;
    var ts = d.targets().filter(Boolean); if (!ts.length) { tipHide(false); return; }
    tipRingOff(); ts.forEach(function (x) { x.classList.add('tip-target'); });
    var a = d.anchor ? d.anchor(ts) : ts[0], r = a.getBoundingClientRect(), vw = document.documentElement.clientWidth, vh = window.innerHeight;
    if (r.bottom < 0 || r.top > vh || !r.width) { tipHide(false); return; }
    el.style.maxWidth = d.narrow ? d.narrow + 'px' : '';
    var w = el.offsetWidth, h = el.offsetHeight, cx = r.left + r.width / 2;
    var left = d.align === 'start' ? r.left - 2 : cx - w / 2; /* start: пузырь начинается у метки и уходит вправо, лампочка слева остаётся открытой */
    left = Math.max(8, Math.min(vw - 8 - w, left));
    /* пузырь встаёт с той стороны, где он помещается: под целью у нижнего края окна его не было видно (владелец, 06.11, штамп на широком экране) */
    var dir = d.dir, above = r.top - 9 - 8 - h, below = r.bottom + 9 + 8;
    if (dir === 'up' && below + h > vh - 6 && above >= 6) dir = 'down';
    else if (dir === 'down' && above < 6 && below + h <= vh - 6) dir = 'up';
    el.classList.toggle('down', dir === 'down'); el.classList.toggle('up', dir === 'up');
    var top = dir === 'down' ? above : below;
    var ax = Math.max(16, Math.min(w - 16, cx - left));
    el.style.left = Math.round(left) + 'px'; el.style.top = Math.round(top) + 'px';
    el.firstChild.nextSibling.style.left = Math.round(ax - 6) + 'px';
  }
  function tipShow(id) {
    if (!tipOn() || tipSeen(id) || TIP.cur) return;
    var d = TIPS[id]; if (!d.targets().filter(Boolean).length) return;
    var el = document.createElement('div');
    el.className = 'tip ' + d.dir; el.setAttribute('role', 'note'); el.setAttribute('data-tip', id);
    el.innerHTML = '<span>' + esc(d.text) + '</span><i class="ar"></i>';
    document.body.appendChild(el); TIP.el = el; TIP.cur = id;
    tipPlace();
    if (TIP.el === el) requestAnimationFrame(function () { el.classList.add('on'); });
  }
  function tipHide(mark) {
    var id = TIP.cur, el = TIP.el; if (!id) return;
    if (mark) tipMark(id);
    tipRingOff(); TIP.cur = null; TIP.el = null;
    if (el) { el.classList.remove('on'); setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 150); }
  }
  /* показать подсказку через delay мс; life — через сколько сама погаснет (ставит флаг) */
  function tipAfter(id, delay, life) {
    if (!tipOn() || tipSeen(id)) return;
    clearTimeout(TIP.hold[id]);
    TIP.hold[id] = setTimeout(function () {
      tipShow(id);
      if (life && TIP.cur === id) TIP.hold[id + 'x'] = setTimeout(function () { if (TIP.cur === id) tipHide(true); }, life);
    }, delay);
  }
  /* верный тап по цели: таймеры снять, подсказку погасить, флаг записать (даже если она не успела показаться) */
  function tipDone(id) {
    clearTimeout(TIP.hold[id]); clearTimeout(TIP.hold[id + 'x']);
    if (TIP.cur === id) tipHide(true); else tipMark(id);
  }
  function tipReset() { Object.keys(TIP.hold).forEach(function (k) { clearTimeout(TIP.hold[k]); }); TIP.hold = {}; tipHide(false); }

  /* ================= ЗВУК (WebAudio-синтез, без файлов) =================
     Включается первым тапом (AudioContext создаётся в жесте), уважает переключатель «звук и вибрация» (S.ext.sound === false — тихо).
     «щёлк» нити — шум 30 мс + щипок 900→600 Гц; «тик» клетки шкалы — 1,2 кГц, 15 мс; «бум» штампа — 80 Гц, 120 мс; «⟲ свет» — нисходящая минорная терция, 400 мс;
     «хм» на ЧИСТО — два тона вверх. Нет AudioContext (старый браузер, headless) — молча без звука; журнал SND.log нужен проверкам. */
  var SND = { ctx: null, log: [] };
  function sndOn() { return !(S && S.ext && S.ext.sound === false); }
  function audio() {
    if (SND.ctx) return SND.ctx;
    try { var AC = window.AudioContext || window.webkitAudioContext; if (AC) SND.ctx = new AC(); } catch (e) { SND.ctx = null; }
    return SND.ctx;
  }
  function sndUnlock() { if (!sndOn()) return; var a = audio(); try { if (a && a.state === 'suspended') a.resume(); } catch (e) { /* разрешения нет — без звука */ } }
  function tone(a, type, f0, f1, t0, dur, vol) {
    var o = a.createOscillator(), g = a.createGain(), t = a.currentTime + t0;
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(a, t0, dur, vol) {
    var n = Math.max(1, Math.floor(a.sampleRate * dur)), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0), i;
    for (i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var src = a.createBufferSource(), g = a.createGain(), flt = a.createBiquadFilter(), t = a.currentTime + t0;
    flt.type = 'bandpass'; flt.frequency.value = 2400; src.buffer = b; g.gain.setValueAtTime(vol, t);
    src.connect(flt); flt.connect(g); g.connect(a.destination); src.start(t);
  }
  var SOUNDS = {
    /* набор из look/brawl/js/kit.js: щипок нити, звон клетки шкалы (выше с каждой), удар штампа; прежние имена в журнале SND.log сохранены */
    click: function (a) { noise(a, 0, 0.03, 0.25); tone(a, 'triangle', 330, 290, 0, 0.55, 0.34); tone(a, 'sine', 660, 600, 0, 0.3, 0.12); },
    tick:  function (a, i) { var f = 880 * Math.pow(1.0595, (i || 0) * 2); tone(a, 'sine', f, f, 0, 0.5, 0.16); tone(a, 'sine', f * 2.76, f * 2.76, 0, 0.18, 0.04); },
    boom:  function (a) { noise(a, 0, 0.08, 0.5); tone(a, 'sine', 120, 60, 0, 0.16, 0.4); },
    light: function (a) { tone(a, 'sine', 523, 523, 0, 0.18, 0.22); tone(a, 'sine', 440, 440, 0.2, 0.2, 0.22); },
    hm:    function (a) { tone(a, 'sine', 247, 220, 0, 0.45, 0.14); tone(a, 'sine', 370, 330, 0, 0.4, 0.05); },
    whoosh: function (a) { noise(a, 0, 0.26, 0.22); },
    pop:   function (a) { tone(a, 'sine', 260, 820, 0, 0.12, 0.3); },
    fanfare: function (a) { [523, 659, 784, 1046].forEach(function (f, k) { tone(a, 'triangle', f, f, k * 0.09, 0.35, 0.12); }); },
    tap:   function (a) { tone(a, 'sine', 520, 380, 0, 0.06, 0.12); }
  };
  function snd(name, i) {
    if (!sndOn()) return;
    SND.log.push(name);
    try { var a = audio(); if (a && a.state !== 'closed') SOUNDS[name](a, i); } catch (e) { /* звук не обязателен */ }
  }

  /* ================= СЦЕНА (scene.js) =================
     Две сцены из слоёв-картинок: a — шаг 1 (вага и пять нитей), c — финал «Без нитей». Поза — картинка, смена позы — пружинная смена слоя; нити рисует код.
     Соответствие состояний позам: начало — idle; ЛЕСТЬ — flattered (нить rhand); ВСЕ УЖЕ — crowd (head); СРОЧНОСТЬ — hurry (lhand); ЧИСТО — honest (нити провисают); набрано 7 — go. */
  var RIGS = {};
  var RIGCFG = { a: { host: 'stage', strings: true, poses: ['idle', 'flattered', 'crowd', 'hurry', 'honest', 'go'] }, c: { host: 'stage2', strings: false, poses: ['honest', 'idle', 'curious', 'away'] } };
  var POSE_OF = { lest: 'flattered', vse: 'crowd', sro: 'hurry', ok: 'honest' };
  var ATT_OF = { lest: 'rhand', vse: 'head', sro: 'lhand' };
  function rigOf(key) {
    var cfg = RIGCFG[key], R = RIGS[key];
    if (!R) { var host = $('#' + cfg.host); R = RIGS[key] = { key: key, host: host, sc: NPCK.createScene(host, { strings: cfg.strings, id: key, poses: cfg.poses }) }; }
    return R;
  }
  function threads() { return S.moves.filter(function (id) { return id !== 'ok'; }); }
  function stepNow() { return threads().length >= 3 && ready() >= 7; }
  /* поза по ходам: последний сыгранный приём; на семёрке — go */
  function poseNow() { var n = S.moves.length; if (!n) return 'idle'; if (stepNow()) return 'go'; return POSE_OF[S.moves[n - 1]]; }
  function playedAtt() { return threads().map(function (id) { return ATT_OF[id]; }); }
  /* игровая зона сцены шага 1: между шапкой и картами; справа — колонка с репликой и шкалой */
  function layoutPlay() {
    var scr = $('#scr-play'); if (!scr || !scr.classList.contains('on')) return;
    var R = rigOf('a'), hr = R.host.getBoundingClientRect(); if (!hr.width) return;
    var head = $('#scr-play .head').getBoundingClientRect(), hand = $('#hand').getBoundingClientRect(), wide = hr.width >= 900;
    var top = wide ? 96 : head.bottom - hr.top + 2, bot = hand.top - hr.top - (wide ? 26 : 22);
    scr.style.setProperty('--ay', Math.round(top) + 'px'); scr.style.setProperty('--ab', Math.round(hr.bottom - hand.top + (wide ? 26 : 20)) + 'px');
    var sw = wide ? ($('#side').offsetWidth || 340) : 0; /* ширина правой колонки — с неё самой: на окне от 1200 она шире (brawl.css) */
    var x0 = wide ? 440 : 0, x1 = wide ? hr.width - 34 - sw - 10 : hr.width;
    R.sc.layout({ x: x0, y: top, w: Math.max(200, x1 - x0), h: Math.max(120, bot - top) }, wide);
    fitCap();
  }
  /* объяснение хода в узкой колонке телефона: если реплика, объяснение и шкала не помещаются между шапкой и картами (низкое окно, длинный текст),
     кегль объяснения уменьшается ступенями 15 → 14 → 13, чтобы шкала не съезжала на карты. На широком экране места хватает — не трогаем */
  function fitCap() {
    var cap = $('#lampcap'), side = $('#side'); if (!cap || !side) return;
    cap.style.fontSize = '';
    if (document.documentElement.clientWidth >= 900 || !cap.offsetHeight) return;
    var fs = parseFloat(getComputedStyle(cap).fontSize) || 15;
    while (fs > 13 && side.scrollHeight > side.clientHeight + 1) { fs -= 1; cap.style.fontSize = fs + 'px'; }
  }
  /* штамп на экране. Место под подсказку T3 оставляется под кнопкой сразу (а не когда пузырь появится через 2 с): кнопка не прыгает,
     пузырь не уходит за нижний край окна и не закрывает строку «Есть. Три фразы…» (владелец 06.11: «не видно подсказку») */
  function setDone(on) {
    document.body.classList.toggle('done', !!on);
    document.body.classList.toggle('t3room', !!on && tipOn() && !tipSeen('t3'));
  }
  function layoutHonest() {
    var scr = $('#scr-honest'); if (!scr || !scr.classList.contains('on')) return;
    var R = rigOf('c'), hr = R.host.getBoundingClientRect(); if (!hr.width) return;
    R.sc.layout({ x: 0, y: 8, w: hr.width, h: hr.height - 8 }, true);
  }
  function layoutScenes() { layoutPlay(); layoutHonest(); }
  function rigReset() {
    var a = RIGS.a, c = RIGS.c;
    if (a) { a.sc.hide(false); a.sc.setPlayed([]); a.sc.setPose('idle', { instant: true }); }
    if (c) { c.sc.hide(false); c.sc.setPose('honest', { instant: true }); }
  }

  /* ================= ЭКРАННЫЕ ОТКЛИКИ ================= */
  function kickScreen() { if (REDUCED) return; var app = $('#app'); app.classList.remove('jolt'); void app.offsetWidth; app.classList.add('jolt'); }
  function flashClass(el, cls, ms) { if (!el) return; el.classList.remove(cls); void el.getBoundingClientRect(); el.classList.add(cls); if (ms) later(function () { el.classList.remove(cls); }, ms); }
  /* «+N» вылетает из точки, где легла карта, и за 400 мс долетает до числа шкалы */
  function plusFly(txt, from, cb) {
    var to = $('#gnum').getBoundingClientRect();
    if (REDUCED || !from || !to.width) { cb(); return; }
    var el = document.createElement('div'); el.className = 'plusfly'; el.textContent = txt; document.body.appendChild(el);
    var w = el.offsetWidth, h = el.offsetHeight, x0 = from.x - w / 2, y0 = from.y - h / 2, x1 = to.left + to.width / 2 - w / 2, y1 = to.top + to.height / 2 - h / 2;
    el.style.transform = 'translate(' + Math.round(x0) + 'px,' + Math.round(y0) + 'px) scale(1.15)';
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      el.style.transition = 'transform .4s cubic-bezier(.35,.1,.3,1),opacity .12s linear .3s'; el.style.opacity = '0.2';
      el.style.transform = 'translate(' + Math.round(x1) + 'px,' + Math.round(y1) + 'px) scale(.8)';
    }); });
    later(function () { if (el.parentNode) el.parentNode.removeChild(el); cb(); }, 400);
  }
  /* шкала «Готов пойти»: клетки заполняются по одной, через 60 мс, у числа pop и «тик» */
  var GAUGE = { n: 0, t: 0 };
  function gaugeNum(n) { var b = $('#gnum'); b.textContent = n + ' из 10'; flashClass(b, 'pop', 200); }
  function gaugeSet(t) { clearTimeout(GAUGE.t); GAUGE.n = t; $$('#notches i').forEach(function (el, i) { el.classList.toggle('on', i < t); }); $('#gnum').textContent = t + ' из 10'; }
  function gaugeTo(t, cb) {
    clearTimeout(GAUGE.t); var cells = $$('#notches i');
    if (REDUCED) { gaugeSet(t); if (cb) cb(); return; } /* без движения: шкала сразу на месте */
    (function step() {
      if (GAUGE.n === t) { if (cb) cb(); return; }
      if (GAUGE.n < t) { cells[GAUGE.n].classList.add('on'); GAUGE.n++; } else { GAUGE.n--; cells[GAUGE.n].classList.remove('on'); }
      snd('tick'); gaugeNum(GAUGE.n);
      GAUGE.t = later(step, 60);
    })();
  }

  var ICON = {
    lest: '<svg class="cico" viewBox="0 0 90 52" aria-hidden="true"><circle cx="38" cy="22" r="17" fill="none" stroke="#1C1411" stroke-width="3.2"/><path d="M50 34l18 16" stroke="#1C1411" stroke-width="6" stroke-linecap="round"/><path d="M28 18c2-4 6-6 10-6" stroke="#1C1411" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M74 6v14M67 13h14M80 28v8M76 32h8" stroke="#1C1411" stroke-width="2.8" stroke-linecap="round"/></svg>',
    vse: '<svg class="cico" viewBox="0 0 90 52" aria-hidden="true"><g fill="#1C1411"><circle cx="14" cy="16" r="7"/><path d="M3 44c0-10 5-16 11-16s11 6 11 16z"/><circle cx="38" cy="16" r="7"/><path d="M27 44c0-10 5-16 11-16s11 6 11 16z"/><circle cx="62" cy="16" r="7"/><path d="M51 44c0-10 5-16 11-16s11 6 11 16z"/></g><g fill="none" stroke="#1C1411" stroke-width="2.6" stroke-dasharray="3.5 3.5"><circle cx="82" cy="19" r="5.5"/><path d="M74 44c0-8 3-12 8-12s8 4 8 12"/></g></svg>',
    ok: '<svg class="cico" viewBox="0 0 90 52" aria-hidden="true"><path d="M18 5H72Q78 5 78 11V32Q78 38 72 38H48L34 48V38H18Q12 38 12 32V11Q12 5 18 5Z" fill="none" stroke="#1C1411" stroke-width="3.2" stroke-linejoin="round"/><path d="M37 17C37 9 53 9 53 17C53 23 45 22 45 29" fill="none" stroke="#1C1411" stroke-width="3.2" stroke-linecap="round"/><circle cx="45" cy="33.5" r="2.2" fill="#1C1411"/></svg>',
    sro: '<svg class="cico" viewBox="0 0 90 52" aria-hidden="true"><path d="M30 4H60M30 48H60" stroke="#1C1411" stroke-width="4.5" stroke-linecap="round"/><path d="M35 5C35 22 55 24 55 26S35 30 35 47M55 5C55 22 35 24 35 26S55 30 55 47" fill="none" stroke="#1C1411" stroke-width="3.2"/><path d="M39 44h12l-6-9z" fill="#1C1411"/><path d="M40 10h10" stroke="#1C1411" stroke-width="3"/></svg>'
  };
  var BULB = '<svg viewBox="0 0 34 34" aria-hidden="true"><path d="M17 3a9 9 0 0 0-5 16.5V24h10v-4.5A9 9 0 0 0 17 3z" fill="#F6F0DF" stroke="#1C1411" stroke-width="2.2" stroke-linejoin="round"/><path class="glass" d="M17 5a7 7 0 0 0-5 12.4V22h10v-4.6A7 7 0 0 0 17 5z"/><path d="M12 24h10M13 28h8M14 31.5h6" stroke="#1C1411" stroke-width="2.2" stroke-linecap="round"/></svg>';


  /* ================= ЭКРАНЫ ================= */
  var screens = { play: 'scr-play', chat: 'scr-chat', q2: 'scr-q2', q3: 'scr-q3', pillar: 'scr-pillar', verdict: 'scr-verdict', honest: 'scr-honest', end: 'scr-end',
                  home: 'scr-home', settings: 'scr-settings', day2: 'scr-day2', day3: 'scr-day3', day4: 'scr-day4', codex: 'scr-codex', bestiary: 'scr-bestiary', backstage: 'scr-backstage' };
  var DARK = { play: 1, chat: 1, pillar: 1, verdict: 1, q2: 1, q3: 1, honest: 1, end: 1, home: 1, settings: 1, day2: 1, day3: 1, day4: 1, codex: 1, bestiary: 1, backstage: 1 }; /* служебные экраны тоже в тёмном мире (перенос, часть 2: look/BRIEF-PORT-2.md) */
  function showScreen(name) {
    Object.keys(screens).forEach(function (k) { $('#' + screens[k]).classList.toggle('on', k === name); });
    document.body.className = document.body.className.replace(/\bscr-\w+/g, '').trim();
    document.body.classList.add('scr-' + name);
    document.body.classList.toggle('dk', !!DARK[name]);
    if (S) S.scr = name;
    var el = $('#' + screens[name]); if (el && el.scrollTo) el.scrollTo(0, 0);
    qTopSet();
    if (name === 'play' || name === 'honest') { later(layoutScenes, 0); later(layoutScenes, 250); }
  }

  /* ---------- ИГРА: ход ---------- */
  var gaugeBuilt = false;
  function ready() { return S.moves.reduce(function (a, id) { return a + DATA.cards[id].plus; }, 0); }

  /* один тап — ход: карта сразу улетает к точке крепления на Тимуре (ЧИСТО — к лицу, без нити), потом отклик по времени (playMove) */
  function cardHTML(id) {
    var c = DATA.cards[id];
    return '<button class="card shake-hint' + (id === 'ok' ? ' plain' : '') + '" type="button" data-id="' + id + '" aria-label="Карта «' + c.title + '»: ' + c.line + '">' +
      '<span class="cname">' + c.title + '</span>' + ICON[id] +
      '<span class="creply">«' + c.line + '»</span></button>';
  }

  function renderHand() {
    var left = DATA.hand.filter(function (id) { return S.moves.indexOf(id) < 0; });
    var box = $('#cards');
    box.className = 'cards n' + left.length;
    box.innerHTML = DATA.hand.map(function (id) {
      return S.moves.indexOf(id) < 0 ? cardHTML(id) : '<div class="slot" aria-hidden="true"><span class="cname">' + DATA.cards[id].title + '</span><span class="stamp">сказано</span></div>';
    }).join('');
  }

  function setKick(t) { var k = $('#kick'); k.textContent = t; var dot = k.previousElementSibling; if (dot) dot.style.display = t ? '' : 'none'; }

  /* реплика Тимура и строка рассказчика «что сработало» (вместо лампочек и тетради суфлёра) */
  function setReply(animLast) {
    var n = S.moves.length, th = threads(), last = n ? S.moves[n - 1] : null;
    var said = n === 0 ? DATA.open : (th.length >= 3 ? DATA.gaveUp : DATA.cards[last].said);
    $('#said').textContent = '«' + said + '»';
    $('#who').textContent = 'Тимур';
    if (animLast) flashClass($('#say'), 'pop');
    var cap = $('#lampcap');
    cap.textContent = n === 0 ? DATA.lampIntro : (last === 'ok' && ready() >= 7 ? DATA.lampLate : DATA.cards[last].lamp);
    if (animLast) flashClass(cap, 'pop', 500);
    fitCap();
    $('#stampcap').textContent = DATA.stampCap;
  }

  function renderPlay(animLast) {
    var n = S.moves.length, th = threads(), nt = th.length, last = n ? S.moves[n - 1] : null;
    /* цель видна с нулевой секунды: шкала «Готов пойти 0/10» стоит на экране сразу (решения 04.11, A3) */
    document.body.classList.add('has-info');
    document.body.classList.toggle('first', n === 0); /* до первого хода: на узком экране вторая строка рассказчика убирается, её заменяет T1 (заход E, п. 7) */
    if (!document.body.classList.contains('turn')) setSub(DATA.sceneIntro);
    var R = rigOf('a');
    // шкала: метка цели на седьмой клетке подписана «идёт»
    var nt2 = $('#notches');
    if (!gaugeBuilt) { var h = ''; for (var i = 0; i < 10; i++) h += '<i' + (i === 6 ? ' class="goal" data-lab="7 — идёт"' : '') + '></i>'; nt2.innerHTML = h; gaugeBuilt = true; GAUGE.n = 0; }
    if (!animLast) {
      /* без анимации (вход на экран, возврат после перезагрузки, демо): всё сразу в итоговом виде */
      R.sc.setPose(poseNow(), { instant: true }); R.sc.setPlayed(playedAtt()); R.sc.hide(false);
      setReply(false); gaugeSet(ready());
      setDone(nt >= 3);
    } else {
      setDone(false);
      playMove(R, last);
    }
    // рука: пока нитей меньше трёх — оставшиеся карты; потом штамп (ЧИСТО, если её не сыграли, остаётся не у дел)
    if (nt < 3) renderHand(); else $('#cards').innerHTML = '';
    later(layoutPlay, 0);
    /* подсказки по ходу: T2 — через 0,7 с после первого хода (висит до тапа по следующей карте: заход E, п. 3), T3 — через 2 с бездействия после третьей нити */
    if (animLast) { if (n === 1) tipAfter('t2', 700); if (nt >= 3) tipAfter('t3', 2000); }
  }

  /* отклик на ход по времени (мс от момента, когда карта легла): 0 — нить рисуется, Тимур упирается (лицо «против», отклонение от нити);
     ~420 — «щёлк»: экран дёргается на 3 px / 120 мс, звук, реплика и лампочка, поза переходит в новую (позы накапливаются), «+N» летит в шкалу (400 мс),
     клетки заполняются по одной через 60 мс; на седьмом — шаг к правой кулисе и штамп. ЧИСТО: нити нет, «хм», шкала едва двигается */
  function playMove(R, id) {
    var c = DATA.cards[id], isTh = id !== 'ok', th = threads(), nt = th.length, sc = R.sc;
    /* карта долетела: нить краснеет и натягивается («щёлк»), экран дёргается на 120 мс, поза меняется, реплика — через 170 мс, «+N» летит в шкалу, клетки загораются по одной */
    snd(isTh ? 'click' : 'hm'); buzz(isTh ? [8, 20, 14] : 8);
    if (isTh) { sc.pull(ATT_OF[id]); kickScreen(); var at = sc.screen(ATT_OF[id]); NPCK.sparks(at.x, at.y, 10, false); } else sc.release();
    sc.setPose(POSE_OF[id]); sc.kick(isTh ? 1 : 0.3);
    later(function () { setReply(true); if (id === 'lest') sc.squash(2.2); }, REDUCED ? 0 : 170);
    later(function () {
      var from = sc.screen('top'); snd('pop');
      plusFly('+' + c.plus, from, function () {
        gaugeTo(ready(), function () {
          if (nt < 3) return;
          if (stepNow()) { later(function () { sc.setPose('go'); snd('fanfare'); }, REDUCED ? 0 : 200); }
          later(function () { setDone(true); snd('boom'); layoutPlay(); }, 180);
        });
      });
    }, REDUCED ? 0 : 450);
  }

  /* подсказки при входе на экран игры: T1 на 2,5-й секунде, если тапа не было; T3 на штампе (демо-вход и возврат после перезагрузки) */
  function tipsForPlay() {
    var n = S.moves.length;
    if (n === 0) tipAfter('t1', 2500);
    else if (threads().length >= 3) tipAfter('t3', 2000);
  }

  /* один тап по карте — ход: за ~220 мс карта улетает к точке крепления на Тимуре, затем рисуется нить */
  var flying = false;
  function onCardTap(e) {
    var c = e.target.closest('.card'); if (!c || flying || c.classList.contains('fly')) return;
    var id = c.getAttribute('data-id'); S.real = true; if (!S.ext.startTs) S.ext.startTs = Date.now();
    sndUnlock();
    tipDone('t1'); if (S.moves.length) tipDone('t2'); /* T2 живёт между ходом 1 и ходом 2: на самом первом тапе её флаг не пишется */
    buzz([14, 30, 10]); snd('whoosh');
    var R = rigOf('a'), tgt = R.sc.screen(id === 'ok' ? 'head' : ATT_OF[id]), r = c.getBoundingClientRect();
    /* карта-призрак летит к точке крепления; настоящая карта в руке гаснет (класс fly) */
    if (!REDUCED) {
      var gh = c.cloneNode(true); gh.classList.add('ghost'); gh.removeAttribute('data-id'); gh.setAttribute('aria-hidden', 'true'); gh.style.width = r.width + 'px'; gh.style.height = r.height + 'px';
      document.body.appendChild(gh);
      NPCK.arc(gh, { x: r.left + r.width / 2, y: r.top + r.height / 2 }, tgt, innerWidth >= 900 ? 140 : 90, 380, function (t) { return 'rotate(' + (t * 22 - 4).toFixed(1) + 'deg) scale(' + (1 - t * 0.86).toFixed(3) + ')'; }, function () {});
    }
    c.classList.add('fly'); flying = true;
    later(function () { flying = false; S.moves.push(id); renderPlay(true); persist(); }, REDUCED ? 0 : 380);
  }

  /* Р3: перед инверсией — плашка «Настроение Тимура»: 8 → 3 после трёх нитей. Заход E (п. 3): плашка с текстом сама не уходит — ждёт тапа по «Дальше»;
     Тимур опускает голову (поза low), нити по одной перелетают к метке «ТЫ» (B3, 04.11) */
  function feelNotches(v) { var h = ''; for (var i = 0; i < 10; i++) h += '<i class="' + (i < v ? 'on' : '') + '"></i>'; return h; }
  function showFeel(hold) {
    var f = $('#feel'); f.hidden = false; f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
    var drop = function () { $('#feelN').innerHTML = feelNotches(3); $('#feelNum').textContent = '3'; f.classList.add('drop'); };
    $('#feelN').innerHTML = feelNotches(8); $('#feelNum').textContent = '8'; $('#feelsay').textContent = DATA.feelSay;
    if (hold) { drop(); return; }
    later(drop, 420);
  }
  function feelNext() { var f = $('#feel'); f.hidden = true; f.classList.remove('drop'); enterChat(); }
  function setSub(t) { var e = $('#sub'); e.textContent = t; e.style.display = t ? '' : 'none'; }
  function startTurn() {
    if (document.body.classList.contains('turn')) return;
    tipDone('t3'); sndUnlock();
    buzz(12);
    document.body.classList.add('turn');
    setKick('Час спустя');
    $('#h1').textContent = 'Теперь уговаривают тебя';
    setSub('');
    snd('light'); showFeel(false);
    var R = rigOf('a');
    later(function () { R.sc.release(); R.sc.setPose('idle'); R.sc.hide(true); }, 150);
  }
  /* то же состояние без анимации (вход по #s=turn): сцена затемнена, нитей нет, плашка на месте */
  function turnStatic() {
    var R = rigOf('a'); R.sc.setPose('idle', { instant: true }); R.sc.hide(true);
    showFeel(true);
  }


  /* ---------- ПЕРЕВЁРНУТАЯ СЦЕНА: чат игрока. Одна реплика из четырёх честная ---------- */
  /* ТЗ §3: четыре сообщения Тимура — честная строка и три приёма, те же слова, что на картах; приветствия нет. Пятое сообщение («ну так что, идёшь?») приходит, когда названы все четыре */
  function chatMsgs() {
    var arr = [], th = threads(), mv = th.length === 3 ? th : ALL;
    ['ok', mv[0], mv[1], mv[2]].forEach(function (id, i) { arr.push({ id: id, text: DATA.cards[id].line, time: i < 2 ? '18:41' : '18:42', tag: true }); });
    if (S.caught.length >= 4) arr.push({ id: 'real', text: DATA.realQ, time: '18:44', tag: false, real: true });
    return arr;
  }
  /* «твоя фраза»: какие строки чата совпали с ходами игрока — приёмы по порядку №1/№2/№3, сыгранная честная строка — без номера */
  function mineMap() { var m = {}; threads().forEach(function (id, i) { m[id] = i + 1; }); if (S.moves.indexOf('ok') >= 0) m.ok = 0; return m; }
  function mineLab(mn) { return 'твоя фраза' + (mn ? ' №' + mn : ''); }
  function badgeOf(id) { return id === 'ok' ? 'Без подвоха' : EXT.tray(DATA.cards[id].name); }
  var CHAT = { fresh: false, t0: 0 };
  function enterChat() {
    showScreen('chat');
    document.body.classList.add('turn');
    /* первый вход: строки проявляются по очереди (0,5 с), своя вспыхивает жёлтым; возврат после перезагрузки и демо-вход — сразу */
    CHAT.fresh = S.caught.length === 0 && !S.open && !REDUCED; CHAT.t0 = performance.now();
    renderChat();
    /* T4: через 4 с после появления чата (четыре строки успевают прочитаться), пока ни одно сообщение не тронуто */
    if (S.caught.length === 0 && !S.open) tipAfter('t4', 4000);
  }
  function msgHTML(m, i, mine) {
    var caught = m.tag && S.caught.indexOf(m.id) >= 0, mn = mine[m.id], isMine = m.tag && mn !== undefined;
    return '<div class="msg ' + (caught ? 'seen' : '') + (caught && m.id === 'ok' ? ' clean' : '') + (isMine ? ' mine' : '') + (CHAT.fresh && isMine ? ' flash' : '') + (m.tag && !caught ? ' tappable' : '') + (m.real ? ' real' : '') + '" data-id="' + m.id + '" style="--d:' + (CHAT.fresh ? (0.5 * i).toFixed(1) : 0) + 's"' + (m.tag && !caught ? ' role="button" tabindex="0"' : '') + '>' +
      esc(m.text) + (isMine ? '<span class="mine-lab">' + mineLab(mn) + '</span>' : '') +
      (caught ? '<span class="vizhu' + (m.id === 'ok' ? ' clean' : '') + '">' + badgeOf(m.id) + '</span>' : '') + '<time>' + m.time + '</time></div>';
  }
  function renderChat() {
    var msgs = chatMsgs(), mine = mineMap();
    var html = '<div class="day mono">Сегодня</div>';
    msgs.forEach(function (m, i) { html += msgHTML(m, i, mine); });
    if (S.caught.length < 4) html += '<div class="typing" aria-hidden="true"><i></i><i></i><i></i></div>';
    $('#msgs').innerHTML = html;
    $('#invintro').innerHTML = DATA.invIntro.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');
    $('#caught').innerHTML = S.caught.map(function (id) { return '<span class="chip' + (id === 'ok' ? ' clean' : '') + '">' + badgeOf(id) + '</span>'; }).join('');
    renderTray();
    var vb = $('#vagabar');
    if (!vb.firstChild) { var r = ''; for (var i = 0; i < 6; i++) r += '<i style="left:' + (10 + i * 17) + '%"></i>'; vb.innerHTML = r; }
    layoutThreads();
    later(layoutThreads, 120);
    later(layoutThreads, 700);
  }

  /* нить идёт с ваги в правый верхний угол пузыря, метка «что тут?» висит на ней у самого сообщения (B4); гвоздик на ваге — по номеру строки, чтобы нити не пересекались */
  var PIN_OF = [0, 2, 3, 5];
  function layoutThreads() {
    var wrap = $('#phonewrap'); if (!wrap || !wrap.offsetWidth || !$('#scr-chat').classList.contains('on')) return;
    var wr = wrap.getBoundingClientRect(), svg = $('#threads'), tags = $('#tags');
    svg.setAttribute('viewBox', '0 0 ' + wr.width + ' ' + wr.height);
    var vbar = $('#vagabar').getBoundingClientRect();
    var vy = vbar.top - wr.top + 4, vx0 = vbar.left - wr.left, vw = vbar.width, now = performance.now(), mr = $('#msgs').getBoundingClientRect();
    var all = chatMsgs(), th = all.filter(function (m) { return m.tag && S.caught.indexOf(m.id) < 0; });
    var ph = '', tg = '';
    th.forEach(function (m) {
      var el = $('.msg[data-id="' + m.id + '"]'); if (!el) return;
      var idx = all.indexOf(m); /* координаты по раскладке (offset*), а не по getBoundingClientRect: у строк идёт анимация въезда со сдвигом */
      var cx = mr.left - wr.left + el.offsetLeft + el.offsetWidth + 24, top = mr.top - wr.top + el.offsetTop - 2 + 7; /* точка подвеса: у правого верхнего угла пузыря */
      var px = vx0 + vw * (10 + PIN_OF[idx] * 17) / 100, ey = top - 3.5;
      /* метка и нить появляются вместе со своей строкой; при повторной раскладке задержка считается от начала показа, а не заново */
      var d = CHAT.fresh ? 0.5 * idx + 0.3 - (now - CHAT.t0) / 1000 : 0;
      ph += '<path data-t="' + m.id + '" style="--d:' + d.toFixed(2) + 's" d="M' + px + ' ' + vy + ' C' + px + ' ' + (vy + (ey - vy) * 0.5) + ' ' + cx + ' ' + (ey - (ey - vy) * 0.3) + ' ' + cx + ' ' + ey + '"/>';
      tg += '<button class="tag' + (S.open === m.id ? ' open' : '') + '" type="button" data-t="' + m.id + '" style="left:' + cx + 'px;top:' + top + 'px;--d:' + d.toFixed(2) + 's" aria-label="Сообщение «' + esc(m.text) + '». Тапни и скажи, что в нём: приём или честно"><span>что тут?</span></button>';
    });
    svg.innerHTML = ph; tags.innerHTML = tg;
    if (TIP.cur === 't4') tipPlace(); /* метки перерисованы: контур и пузырь переставляются на новую верхнюю метку */
  }

  /* «Осталось найти: N» считает только приёмы (честная строка в счёт не входит) */
  function tagLeft() { return 3 - S.caught.filter(function (id) { return id !== 'ok'; }).length; }
  /* заход E, п. 2: задача одной строкой, а не голая цифра */
  function leftLine() { var n = tagLeft(); return n === 0 ? 'Все три найдены' : 'Тимур использует три твоих приёма. Найди их: тапни сообщение. Осталось: ' + n; }
  function renderTray() {
    var t = $('#tray'), done = S.caught.length, cnt = '<div class="tagleft mono" id="tagleft">' + leftLine() + '</div>';
    if (S.open) {
      if (!S.ord) S.ord = shuffle(ALL.map(function (id) { return DATA.cards[id].name; }).concat(['ЧИСТО']));
      t.innerHTML = cnt + '<div class="qline tray-q">Что Тимур делает этой фразой?</div>' + (S.hint ? '<div class="hint2">' + esc(S.hint) + '</div>' : '') +
        '<div class="opts4">' + S.ord.map(function (n) { return '<button class="opt' + (n === 'ЧИСТО' ? ' clean' : '') + '" type="button" data-n="' + n + '">' + EXT.tray(n) + '</button>'; }).join('') + '</div>';
    } else if (S.lastCaught) {
      var c = DATA.cards[S.lastCaught], rest = 4 - done, ok = S.lastCaught === 'ok', txt = S.auto === S.lastCaught ? DATA.lastSelf[S.lastCaught] : c.explain;
      var left = chatMsgs().filter(function (m) { return m.tag && S.caught.indexOf(m.id) < 0; });
      t.innerHTML = cnt + '<div class="reveal' + (ok ? ' clean' : '') + '"><p>' + EXT.leadHTML(txt) + '</p>' +
        (rest === 1 && left[0] && left[0].id === 'ok' ? '<p class="oknote">' + esc(DATA.okLeft) + '</p>' : '') +
        (rest ? '' : '<div class="more end"><button class="btn seen" type="button" id="toPillar">Ответить Тимуру</button></div>') +
        /* последняя строка с приёмом называется сама, но не по таймеру: объяснение третьей ждёт тапа по «Дальше» (заход E, п. 3) */
        (rest === 1 && left[0] && left[0].id !== 'ok' ? '<div class="more end"><button class="btn seen" type="button" id="autoNext">Дальше</button></div>' : '') + '</div>';
    } else {
      /* до первого тапа в лотке — рассказчик объясняет задачу; управление подсказывает T4 */
      t.innerHTML = cnt + '<div class="idle" id="invcall">' + DATA.invCall.map(function (x) { return '<p class="narr">' + esc(x) + '</p>'; }).join('') + '</div>';
    }
  }

  function openTag(id) {
    tipDone('t4'); sndUnlock();
    S.real = true; buzz(8);
    S.open = id; S.hint = ''; S.ord = shuffle(ALL.map(function (x) { return DATA.cards[x].name; }).concat(['ЧИСТО']));
    $$('.tag').forEach(function (x) { x.classList.toggle('open', x.getAttribute('data-t') === id); });
    $$('.msg').forEach(function (x) { x.classList.toggle('open', x.getAttribute('data-id') === id); });
    renderTray();
    var tr = $('#tray'); if (tr && tr.scrollIntoView) tr.scrollIntoView({ block: 'nearest', behavior: REDUCED ? 'auto' : 'smooth' });
  }
  function onTagTap(e) {
    var tg = e.target.closest('.tag'); if (!tg) return;
    openTag(tg.getAttribute('data-t'));
  }
  function onMsgTap(e) {
    var m = e.target.closest('.msg.tappable'); if (!m) return;
    openTag(m.getAttribute('data-id'));
  }
  /* приём назван: игроком или автоматически (Р3: последняя строка с приёмом называется сама; честная реплика остаётся на суд игрока) */
  function catchThread(id, auto) {
    var c = DATA.cards[id];
    buzz([10, 20, 10]); snd(id === 'ok' ? 'hm' : 'click');
    S.misses[id] = S.misses[id] || 0;
    S.caught.push(id); S.lastCaught = id; S.open = null; S.hint = ''; if (auto) S.auto = id;
    var tag = $('.tag[data-t="' + id + '"]'); if (tag) tag.classList.add('fall');
    var pth = $('#threads path[data-t="' + id + '"]'); if (pth) { pth.setAttribute('stroke-dasharray', '500'); pth.setAttribute('class', 'cut' + (id === 'ok' ? ' clean' : '')); }
    var msg = $('.msg[data-id="' + id + '"]');
    if (msg && !msg.classList.contains('seen')) { msg.classList.add('seen'); msg.classList.remove('tappable', 'open'); msg.removeAttribute('role'); if (id === 'ok') msg.classList.add('clean'); var s = document.createElement('span'); s.className = 'vizhu' + (id === 'ok' ? ' clean' : ''); s.textContent = badgeOf(id); msg.appendChild(s); }
    var ch = document.createElement('span'); ch.className = 'chip' + (id === 'ok' ? ' clean' : ''); ch.textContent = badgeOf(id); $('#caught').appendChild(ch);
    if (S.caught.length >= 4) {
      var ty = $('.typing'); if (ty) ty.remove();
      if (!$('.msg.real')) { var nm = document.createElement('div'); nm.innerHTML = msgHTML({ id: 'real', text: DATA.realQ, time: '18:44', tag: false, real: true }, 4, mineMap()); $('#msgs').appendChild(nm.firstChild); }
    }
    renderTray();
    later(function () { $$('.tag.fall').forEach(function (x) { x.remove(); }); layoutThreads(); }, 650);
  }
  /* «Дальше» после третьего названия: последняя строка с приёмом называется сама */
  function autoNameLast() {
    if (S.caught.length !== 3 || S.open) return;
    var left = chatMsgs().filter(function (m) { return m.tag && S.caught.indexOf(m.id) < 0; });
    if (left.length === 1 && left[0].id !== 'ok' && S.caught.indexOf(left[0].id) < 0) catchThread(left[0].id, true);
  }
  function onOptTap(e) {
    var o = e.target.closest('.opt'); if (!o) return;
    var id = S.open, c = DATA.cards[id], pick = o.getAttribute('data-n');
    if (pick === c.name) catchThread(id, false);
    else {
      S.misses[id] = (S.misses[id] || 0) + 1; buzz(30);
      S.hint = c.miss;
      S.wrong = S.wrong || {}; (S.wrong[id] = S.wrong[id] || []).push(pick);
      renderTray();
      $$('.opt').forEach(function (x) { if (S.wrong[id].indexOf(x.getAttribute('data-n')) >= 0) x.classList.add('no'); });
      var tg2 = $('.tag.open'); if (tg2) { tg2.classList.remove('err'); void tg2.offsetWidth; tg2.classList.add('err'); }
    }
  }


  /* ---------- «ЧТО ОТВЕТИШЬ ТИМУРУ?»: сверху настоящая реплика Тимура, три ответа как речь, потом реакция, что это стоило, «Так рассуждают …» и «А с другой стороны —» ---------- */
  function pillarById(id) { return DATA.pillars.filter(function (x) { return x.id === id; })[0]; }
  function enterPillar() { showScreen('pillar'); renderPillar(); }
  function cap1(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function renderPillar() {
    var sl = $('#slips');
    sl.className = 'slips' + (S.basis ? ' done' : '');
    $('#ctxhost').innerHTML = '<div class="ctx big"><b class="mono">Тимур</b><q>' + esc(DATA.realQ) + '</q></div>';
    var vs = $('#vsub'); vs.textContent = DATA.vsub; vs.style.display = S.basis ? 'none' : '';
    sl.innerHTML = DATA.pillars.map(function (p) {
      return '<button class="slip' + (S.basis === p.id ? ' chosen' : '') + '" type="button" data-p="' + p.id + '">«' + esc(p.move) + '»</button>';
    }).join('');
    var vh = $('#viewhost');
    if (S.basis) {
      var p = pillarById(S.basis);
      /* один экран: ответ → реакция Тимура → «Что это тебе стоило» → «Так рассуждают …» → «А с другой стороны —» */
      vh.innerHTML = '<div class="react"><div class="rl"><b class="mono">Тимур</b>' + esc(p.say) + '</div></div>' + EXT.costHTML(p.cost) +
        EXT.monoHTML(p.view, p.mono) + EXT.hotyaHTML(p.hotya.text);
      $('#pillnext').hidden = false;
    } else { vh.innerHTML = ''; $('#pillnext').hidden = true; }
  }
  function onSlip(e) {
    var b = e.target.closest('.slip'); if (!b || S.basis) return;
    S.real = true; buzz([10, 20]); S.basis = b.getAttribute('data-p'); renderPillar();
    later(function () { var v = $('.react'); if (v && v.scrollIntoView) v.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 120);
  }

  /* ---------- ПРАВИЛА КОДЕКСА: из двух разных взглядов; забираю / не моё (со второго дня ещё «подправлю» и «пока не знаю») ---------- */
  function cands() {
    if (!S.cands) {
      var p = pillarById(S.basis || 'socrates');
      S.cands = [
        { id: 'n1', view: p.view, text: p.text, from: p.from, alts: p.alts, sph: 'friends', status: 'new', fit: false, contra: 'n2' },
        { id: 'n2', view: p.hotya.view_id, text: p.other.text, from: 'с другой стороны того же ответа', alts: p.other.alts, sph: 'friends', status: 'new', fit: false, contra: 'n1' }
      ];
    }
    return S.cands;
  }
  function crById(id) { return cands().filter(function (c) { return c.id === id; })[0]; }
  var CR_INTRO = {
    1: ['Теперь про Кодекс. Это твоя копилка выводов: по одному из каждой истории. Из них складывается то, во что ты веришь сам, а не то, что тебе сказали.', 'После истории игра предлагает вывод, который из неё получился. Подходит — забираешь. Не твоё — выбрасываешь, это тоже нормальный ответ.'],
    3: ['Это вывод — с другой стороны твоего ответа Тимуру. Он может спорить с первым. Так бывает.']
  };
  var CR_TITLE = { 1: 'Вывод из этой истории', 3: 'Ещё один вывод — на выбор' };
  function renderCrumbs() {
    var cs = cands(), q = qState();
    if (q && q.on && q.step <= 3) cs = cs.filter(function (c) { return c.id === (q.step === 3 ? 'n2' : 'n1'); }); /* квест: по одному выводу — первый в шаге 1, второй в шаге 3 */
    var step = q && q.on && q.step <= 3 ? q.step : 0;
    $('#vh1').textContent = step ? CR_TITLE[step === 3 ? 3 : 1] : 'Выводы из этой истории';
    $('#crintro').innerHTML = step ? CR_INTRO[step === 3 ? 3 : 1].map(function (t) { return '<p class="narr">' + esc(t) + '</p>'; }).join('') : '';
    /* первая сессия: у вывода две большие кнопки «Забираю» / «Не моё» (пятый аргумент crCard); «Подправлю» и «Пока не знаю» — со второго дня */
    $('#crhost').innerHTML = cs.map(function (c, i) { return EXT.crCard(c, i, cs.length, cands().filter(function (x) { return x.id === c.contra; })[0], true); }).join('');
    /* заход E, п. 3: после решения карточка и отклик «Записано…» ждут тапа: «В Кодекс» (карточка летит во вкладку) или «Дальше» (для «Не моё») */
    if (step && q.crumbDone && q.crumbDone[step] && cs[0] && cs[0].status !== 'new') {
      var kept0 = cs[0].status === 'keep' || cs[0].status === 'fit';
      $('#crhost').insertAdjacentHTML('beforeend', '<div class="cr-go"><button class="btn seen" type="button" id="crgo">' + (kept0 ? 'В Кодекс' : 'Дальше') + '</button></div>');
    }
    var k = EXT.counts(U);
    $('#pslots').innerHTML = EXT.slotsHTML(k);
    $('#pocketlab').textContent = 'В Кодексе: ' + k.sheet + ' из 12';
    if (TIP.cur === 't5') tipPlace();
  }
  function enterVerdict() {
    showScreen('verdict'); renderCrumbs(); tipAfter('t5', 5000);
    var qk = qState(); $('#vkick').textContent = qk && qk.on && qk.step <= 3 ? 'Вывод' : 'Выводы';
    $('#qcapline').hidden = true; $('#qcapgo').hidden = true;
    /* возврат после перезагрузки после решения: карточка и кнопка «В Кодекс» / «Дальше» на месте (renderCrumbs), переход ждёт тапа */
  }
  function onCrumbTap(e) {
    var b = e.target.closest('[data-a]'); if (!b) return;
    var art = b.closest('.cr2'), c = crById(art.getAttribute('data-c'));
    S.real = true; buzz(10);
    if (b.getAttribute('data-a') !== 'undo') tipDone('t5');
    EXT.crAct(c, b.getAttribute('data-a'), b, art);
    if (c.status === 'keep' || c.status === 'fit') { var nk = qCodexN(); c.doneMsg = 'Записано. ' + (nk <= 1 ? 'Первый вывод твоего Кодекса.' : 'В Кодексе уже ' + nk + '.'); }
    else if (c.status === 'out') c.doneMsg = 'Ок, не твоё. Кодекс собирается из того, что подходит тебе.';
    renderCrumbs();
    var q = qState();
    if (q && q.on && q.step <= 3) { qCrumbDecided(c.id); return; } /* квест: решение окончательное, вывод улетает в «Кодекс» после тапа «В Кодекс» */
    /* вне квеста переход — по кнопке «Дальше» (заход E: никаких автопереходов с текстом) */
  }

  /* ---------- «А ТЕПЕРЬ — ПО-ЧЕСТНОМУ» (Р3): сцена театра без приёмов, три приглашения; успех — ясное приглашение и сохранённый выбор Тимура, а не его «да». Нового правила ход не даёт ---------- */
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function inviteById(id) { return DATA.invites.filter(function (x) { return x.id === id; })[0]; }
  function enterHonest() { showScreen('honest'); renderHonest(); }
  /* поза финала по шкале: 7/10 — заинтересован (приподнял наушник), 2/10 — отвернулся, посередине — как был */
  function honestPose(to) { return to >= 7 ? 'curious' : (to <= 2 ? 'away' : 'idle'); }
  function renderHonest() {
    var h = S.honest || (S.honest = { pick: null, tries: 0, ok: false, order: shuffle(DATA.invites.map(function (x) { return x.id; })) });
    var R3 = rigOf('c');
    /* шкала стартует с того места, где игрок оставил Тимура после давления (3), — это и есть цена победы; ход нельзя провалить, любой ответ ведёт дальше (ТЗ §3) */
    var inv = h.pick ? inviteById(h.pick) : null, val = inv ? inv.to : 3;
    $('#feelN2').innerHTML = feelNotches(val); $('#feelNum2').textContent = val;
    $('#hnintro').innerHTML = DATA.intro2.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');
    /* лицо и поза по шкале: 7/10 — улыбка, наушник снят; 2/10 — отворачивается; 4/10 — смотрит в сторону */
    R3.sc.setPose(inv ? honestPose(inv.to) : 'honest', { instant: !inv }); later(layoutHonest, 0);
    $('#said2').textContent = inv ? '«' + inv.say + '»' : ''; $('#said2').style.display = inv ? '' : 'none';
    $('#act2').textContent = inv && inv.act ? '(' + inv.act + ')' : '';
    $('#who2').textContent = 'Тимур, 15 · в наушниках';
    var st = $('#stray'); st.hidden = !(inv && inv.id === 'guilt');
    $('#honestinv').innerHTML = h.order.map(function (id) { var x = inviteById(id); return '<button class="inv' + (h.pick === id ? ' chosen' : '') + '" type="button" data-inv="' + id + '"' + (h.pick ? ' disabled' : '') + '>«' + esc(x.text) + '»</button>'; }).join('');
    var res = '';
    /* реакция рассказчика после ответа: ясное — «это и есть честно уговорить»; расплывчатое — «дверь открыта, но заходить незачем»; с виной — «тоже давит» */
    if (inv) res = '<div class="hres' + (inv.id === 'clear' ? ' ok' : '') + '"><p>' + esc(inv.cap) + '</p></div><div class="hbtns"><button class="btn seen" type="button" id="honestnext">Дальше</button></div>';
    $('#honestres').innerHTML = res;
    document.body.classList.toggle('honest-done', !!inv);
  }
  function onInvite(e) {
    var b = e.target.closest('.inv'); if (!b || (S.honest && S.honest.pick)) return;
    S.real = true; buzz([10, 20]); var h = S.honest; h.pick = b.getAttribute('data-inv'); h.tries++; if (h.pick === 'clear') h.ok = true; renderHonest();
  }

  /* ---------- ФИНАЛ И КОНЕЦ ДНЯ: итог словами, без сетки значков ---------- */
  function listAnd(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' и ' + a[a.length - 1]; }
  var NUMW = { 1: 'один', 2: 'двое', 3: 'трое' };
  function beastNames(ids) { return ids.map(function (id) { return EXT.BEASTS[id].name; }); }
  function keptRules() {
    var all = cands().concat(S.ext.d2 && S.ext.d2.cr ? S.ext.d2.cr : []).concat(S.ext.d3 && S.ext.d3.cr ? S.ext.d3.cr : []).concat(S.ext.d4 && S.ext.d4.cr ? S.ext.d4.cr : []).concat((S.ext && S.ext.drafts) || []);
    return all.filter(function (c) { return c.status === 'keep' || c.status === 'fit'; });
  }
  function enterEnd() {
    showScreen('end');
    var d2 = S.ext && S.ext.d2 && S.ext.d2.fin ? S.ext.d2 : null, kept = 0, sum, cl, nl = EXT.nextLabel(Date.now());
    var rules = keptRules().map(function (c) { return c.text; }); kept = rules.length;
    var allBeasts = S.ext.beasts || [];
    var d3 = S.ext && S.ext.d3 && S.ext.d3.fin ? S.ext.d3 : null, d4 = S.ext && S.ext.d4 && S.ext.d4.fin ? S.ext.d4 : null;
    if (d4) {
      var t4 = ['auth'].filter(function (id) { return allBeasts.indexOf(id) >= 0; });
      $('#endh').textContent = 'На сегодня всё'; $('#endh').className = ''; $('#endcap').textContent = '';
      kept = EXT.counts(U).sheet; /* тот же счётчик, что на плитке главного экрана */
      sum = '<p class="narr">Поймано сегодня: ' + esc(listAnd(beastNames(t4))) + '. В Кодексе теперь: ' + kept + '.</p>';
      var em4 = $('.tomorrow em'); em4.textContent = 'Дело 5 ещё пишется. Как будет готово — появится прямо здесь.'; em4.className = '';
      cl = EXT.cliff5(U);
    } else if (d3) {
      var t3 = ['guilt'].filter(function (id) { return allBeasts.indexOf(id) >= 0; });
      $('#endh').textContent = 'На сегодня всё'; $('#endh').className = ''; $('#endcap').textContent = '';
      kept = EXT.counts(U).sheet;
      sum = '<p class="narr">Поймано сегодня: ' + esc(listAnd(beastNames(t3))) + '. В Кодексе теперь: ' + kept + '.</p>';
      var em3 = $('.tomorrow em'); em3.textContent = cap1(nl) + ' — что будет дальше.'; em3.className = '';
      cl = EXT.cliff4(U);
    } else if (d2) {
      var t2 = ['recip', 'fakec'].filter(function (id) { return allBeasts.indexOf(id) >= 0; });
      $('#endh').textContent = 'На сегодня всё'; $('#endh').className = ''; $('#endcap').textContent = '';
      kept = EXT.counts(U).sheet;
      sum = '<p class="narr">Поймано сегодня: ' + esc(listAnd(beastNames(t2))) + '. В Кодексе теперь: ' + kept + '.</p>';
      var em2 = $('.tomorrow em'); em2.textContent = cap1(nl) + ' — что будет дальше.'; em2.className = '';
      cl = EXT.cliff3(U);
    } else {
      var pk = S.honest && S.honest.pick, inv = pk && inviteById(pk), first = ['sro', 'fact', 'vse'].filter(function (id) { return allBeasts.indexOf(id) >= 0; });
      $('#endh').textContent = 'СУББОТА СОСТОЯЛАСЬ'; $('#endh').className = 'qstamp';
      $('#endcap').textContent = inv ? inv.end : 'Тимур в гараже. Сам решил.';
      if (S.real && !S.ext.day1Done) S.ext.day1Done = Date.now(); /* игровой день = номер завершённого шага квеста + 1; дата визита считается отдельно */
      var q = qState(); if (q) { q.on = false; q.step = 5; }
      sum = '<p class="narr">Сегодня поймано ' + (NUMW[first.length] || first.length) + ': ' + esc(listAnd(beastNames(first))) + '. Они теперь в Бестиарии — с досье и способом отшить.</p>' +
        '<p class="narr">В Кодексе — твоих выводов: ' + kept + '.</p>' +
        (kept ? '<ul class="rulelist">' + rules.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' : '<p class="narr">Кодекс пока пуст — ни один вывод не подошёл. Бывает. Завтра будут новые.</p>');
      var em = $('.tomorrow em'); em.textContent = cap1(nl) + ' — продолжение.'; em.className = 'qstep4';
      cl = EXT.CLIFF[2];
    }
    $('#qsum').innerHTML = sum;
    $('#cliff').innerHTML = '<div class="bub"><b>' + esc(cl[0]) + '</b>' + esc(cl[1]) + '</div>';
    var pocket = ((S.ext && S.ext.drafts) || []).length; /* отложенное считается отдельно */
    var b = $('#newbadge'); b.textContent = kept; b.hidden = kept === 0;
    $('#copylab').textContent = 'Скинуть другу'; $('#copynote').textContent = shareNote(); $('#copydone').textContent = '';
    setHashQuiet('end');
  }
  /* что реально уходит другу: ссылка на игру и счёт — сколько приёмов поймано и сколько выводов в Кодексе; ни ответов, ни текстов выводов в ссылке нет */
  function shareNote() { return 'Другу улетит ссылка на игру и твой счёт: сколько приёмов поймано и сколько выводов в Кодексе. Твоих ответов в ссылке нет: каждый проходит субботу по-своему.'; }
  function shareText() {
    var url = ''; try { if (/^https?:$/.test(location.protocol)) url = location.origin + location.pathname; } catch (e) { /* без адреса */ }
    return 'Не По Сценарию. Суббота: поймано приёмов — ' + (S.ext.beasts || []).length + ', выводов в Кодексе — ' + keptRules().length + '. Попробуй поймать быстрее' + (url ? ': ' + url : '.');
  }

  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('on');
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('on'); }, 2200);
  }


  /* ================= КВЕСТ «СУББОТА» (заход C, 04.11) =================
     Первая сессия — три шага подряд с одной целью: ① Тимур → ② Чат класса → ③ Витрина → гараж («Без нитей» и итог). Слова «Дело» в сессии нет, только «шаг N из 3».
     Сверху нить-тропа (пройденная часть краснеет, текущая остановка пульсирует), справа в ней вкладки «Кодекс» и «Бестиарий»: их до первого действия на экране нет.
     Бестиарий открывается, когда карточка «Пойман кто-то по имени …» улетает во вкладку; Кодекс — когда во вкладку улетает крупица. Между шагами — занавес 0,6 с.
     Состояние: S.ext.q = { on, step 1..4 (4 — финал), titled, tabs:{c,b}, caps:{c,b}, crumbDone:{шаг:1} }, пойманные существа — S.ext.beasts. */
  var QSCR = { play: 1, chat: 1, pillar: 1, verdict: 1, honest: 1, q2: 1, q3: 1 };
  var QCAP = { c: 'Кодекс — твои выводы', b: 'Бестиарий — пойманные приёмы' };
  var QN = ['', 'Тимур', 'Чат класса', 'Витрина'];
  function qState() { return S && S.ext && S.ext.q ? S.ext.q : null; }
  function qInit() { if (!S.ext.q) S.ext.q = { on: true, step: 1, titled: false, tabs: { c: 0, b: 0 }, caps: {}, crumbDone: {} }; return S.ext.q; }
  function qCodexN() { return S.cands ? S.cands.filter(function (c) { return c.status === 'keep' || c.status === 'fit'; }).length : 0; }
  /* нить-тропа и вкладки по состоянию: вызывается из showScreen */
  function qTopSet() {
    var q = qState(), top = $('#qtop'); if (!top) return;
    var on = !!(q && q.on && QSCR[S.scr]);
    top.hidden = !on; document.body.classList.toggle('quest', on);
    if (!on) return;
    var st = q.step;
    $$('.qn', top).forEach(function (n) { var i = +n.getAttribute('data-n'); n.classList.toggle('done', i < st); n.classList.toggle('cur', i === st); });
    $$('.qseg', top).forEach(function (s) { s.classList.toggle('done', +s.getAttribute('data-s') < st); });
    $('#qstep').textContent = st <= 3 ? 'Шаг ' + st + ' из 3 · ' + QN[st] : 'Финал · Гараж';
    ['c', 'b'].forEach(function (k) {
      var t = $('#qtab-' + k), n = k === 'c' ? qCodexN() : (S.ext.beasts || []).length, b = $('#qbadge-' + k);
      t.classList.toggle('on', !!q.tabs[k]); b.hidden = !n; b.textContent = n;
    });
  }
  /* подпись вкладки не гаснет по таймеру (заход E, п. 3): она висит, пока игрок не тапнет в любое место экрана */
  var qCapTs = 0;
  function qCaption(kind) {
    var q = qState(), c = $('#qcap'); if (!q || !c) return;
    q.caps[kind] = 1; c.textContent = QCAP[kind]; c.classList.add('on'); qCapTs = Date.now();
  }
  function qCapHide() { var c = $('#qcap'); if (c) c.classList.remove('on'); }
  /* карточка или крупица прилетела во вкладку: вкладка (если новая) выскакивает, бейдж подпрыгивает, подпись видна 2 с */
  function qTabArrive(kind) {
    var q = qState(); if (!q || !q.on) return;
    var first = !q.tabs[kind]; q.tabs[kind] = 1; qTopSet();
    var b = $('#qbadge-' + kind); if (b && !b.hidden) flashClass(b, 'pop', 650);
    if (first || !q.caps[kind]) qCaption(kind);
    persist();
  }
  /* копия элемента летит к вкладке за 0,65 с; без движения (prefers-reduced-motion) — сразу на месте */
  function flyClone(el, tab, cb) {
    if (REDUCED || !el || !tab) { cb(); return; }
    var r0 = el.getBoundingClientRect(), r1 = tab.getBoundingClientRect(), w1 = tab.offsetWidth || r1.width;
    var cl = el.cloneNode(true); cl.removeAttribute('id'); cl.className += ' qflyer';
    cl.style.cssText = 'position:fixed;left:' + r0.left + 'px;top:' + r0.top + 'px;width:' + r0.width + 'px;height:' + r0.height + 'px;margin:0;z-index:185;pointer-events:none;animation:none;transform-origin:50% 50%;transform:none;opacity:1;transition:transform .65s cubic-bezier(.55,0,.85,.35),opacity .25s linear .45s';
    el.style.visibility = 'hidden';
    document.body.appendChild(cl);
    var dx = (r1.left + r1.width / 2) - (r0.left + r0.width / 2), dy = (r1.top + r1.height / 2) - (r0.top + r0.height / 2), sc = Math.max(.04, w1 / r0.width);
    requestAnimationFrame(function () { requestAnimationFrame(function () { cl.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + sc + ')'; cl.style.opacity = '.2'; }); });
    later(function () { if (cl.parentNode) cl.parentNode.removeChild(cl); cb(); }, 680);
  }

  /* ----- карточка поимки: «Пойман кто-то по имени Таймер» — имя, подпись, досье из трёх строк; тап — карточка летит во вкладку «Бестиарий» ----- */
  var CATCH = { busy: false };
  var BEST_INTRO = 'Это Бестиарий — твоя коллекция пойманных приёмов. Кого разглядишь, тот попадает сюда с досье: чем берёт, где водится, как отшить. Всего их двенадцать. Один уже есть.';
  var CODEX_INTRO = 'Это Кодекс — твоя копилка выводов. Сюда попадает только то, что ты забираешь. Хранится на этом телефоне и больше нигде.';
  var STAND = '<svg viewBox="0 0 300 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="sb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8b6cff"/><stop offset="1" stop-color="#4a2fc0"/></linearGradient><linearGradient id="st" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe98a"/><stop offset="1" stop-color="#ffb21a"/></linearGradient></defs>' +
    '<ellipse cx="150" cy="70" rx="140" ry="9" fill="#0b1633" opacity=".35"/><path d="M30 40H270V62Q270 72 150 72T30 62Z" fill="url(#sb)" stroke="#0b1633" stroke-width="6" stroke-linejoin="round"/><ellipse cx="150" cy="38" rx="124" ry="17" fill="url(#st)" stroke="#0b1633" stroke-width="6"/><ellipse cx="150" cy="35" rx="96" ry="9" fill="#fff" opacity=".35"/></svg>';
  function catchCardHTML(id, first) {
    var b = EXT.BEASTS[id], tag = EXT.beastTag(id);
    return '<div class="qc-wrap">' + (id === 'sro' ? '<p class="qc-lead narr" id="catchlead">Пока ты отвечаешь Тимуру — смотри, кто попался.</p>' : '') +
      '<div class="qc-card" role="status"><div class="qc-art"><div class="qc-stand">' + STAND + '</div>' + EXT.creature(id) + '<div class="qc-stamp" aria-hidden="true">Пойман</div></div>' +
      '<h2 class="qc-h"><span>Пойман кто-то по имени</span> <b>' + esc(tag) + '</b></h2><p class="qc-epi">' + esc(b.epi) + '</p><dl class="qc-dos">' +
      '<div><dt>Чем берёт</dt><dd>' + b.s[0] + '</dd></div><div><dt>Где водится</dt><dd>' + b.s[1] + '</dd></div><div><dt>Как отшить</dt><dd>' + b.s[2] + '</dd></div></dl>' +
      '<div class="qc-go"><button class="btn seen qc-btn" type="button">Забрать в Бестиарий</button></div></div>' +
      (first ? '<p class="qc-note narr" id="qcnote">' + BEST_INTRO + '</p>' : '') + '</div>';
  }
  function catchTarget() {
    var q = qState(), t = $('#qtab-b');
    if (q && q.on && QSCR[S.scr] && t) return t;
    return $('.screen.on .tabs a[href="#s=bestiary"]');
  }
  /* o.hold — только показать (для рендера); o.force — показать, даже если существо уже в Бестиарии. Карточка ждёт тапа («Забрать в Бестиарий») и сама не улетает (заход E, п. 3) */
  function catchBeast(id, cb, o) {
    o = o || {};
    S.ext.beasts = S.ext.beasts || [];
    var isNew = S.ext.beasts.indexOf(id) < 0;
    if (!isNew && !o.force && !o.hold) { if (cb) cb(); return; }
    var q0 = qState(), first = !!(q0 && q0.on && QSCR[S.scr] && !q0.tabs.b);
    if (isNew && !o.hold) S.ext.beasts.push(id);
    var ov = $('#qcatch'), done = false;
    CATCH.busy = true;
    ov.className = 'qcatch'; ov.innerHTML = catchCardHTML(id, first); ov.hidden = false;
    snd('boom'); buzz([20, 40, 14]);
    persist();
    var card = $('.qc-card', ov);
    var finish = function () {
      ov.hidden = true; ov.innerHTML = ''; ov.className = 'qcatch'; CATCH.busy = false;
      var q = qState(); if (q && q.on && QSCR[S.scr]) qTabArrive('b'); else qTopSet();
      if (cb) cb();
    };
    var fly = function () {
      if (done) return; done = true;
      var tab = catchTarget();
      ov.classList.add('fly');
      if (!tab) { finish(); return; }
      flyClone(card, tab, finish);
    };
    ov.onclick = fly;
  }

  /* ----- заставка и занавес ----- */
  var SPL = { t: 0 };
  function qSplash(done) {
    var el = $('#qtitle'); if (!el) { done(); return; }
    var finished = false;
    var end = function () {
      if (finished) return; finished = true; clearTimeout(SPL.t);
      el.classList.add('out');
      setTimeout(function () { el.hidden = true; el.classList.remove('out'); done(); }, REDUCED ? 0 : 300);
    };
    el.classList.remove('out'); el.hidden = false;
    el.onclick = end; /* заставка ждёт тапа: вводную читают, а не пролистывают; страховочного таймера нет */
  }
  /* занавес 0,6 с: створки сходятся за 0,3 с, на середине меняется экран, ещё 0,3 с они расходятся */
  var curtainT = [];
  function qCurtain(mid) {
    var c = $('#qcurtain');
    if (REDUCED) { mid(); return; }
    c.className = 'qcurtain close';
    curtainT.push(setTimeout(function () { mid(); c.className = 'qcurtain open'; }, 300));
    curtainT.push(setTimeout(function () { c.className = 'qcurtain'; }, 600));
  }
  function qReset() {
    var c = $('#qcurtain'), ov = $('#qcatch'), tt = $('#qtitle'), cp = $('#qcap'), nk = $('#qnick');
    if (nk) { nk.hidden = true; nk.classList.remove('out'); }
    curtainT.forEach(clearTimeout); curtainT = []; clearTimeout(SPL.t); CATCH.busy = false;
    if (c) c.className = 'qcurtain';
    if (ov) { ov.hidden = true; ov.innerHTML = ''; ov.className = 'qcatch'; }
    if (tt) { tt.hidden = true; tt.classList.remove('out'); }
    if (cp) cp.classList.remove('on');
    $$('.qflyer').forEach(function (x) { if (x.parentNode) x.parentNode.removeChild(x); });
    var top = $('#qtop'); if (top) top.hidden = true;
    ['c', 'b'].forEach(function (k) { var t = $('#qtab-' + k); if (t) t.classList.remove('on'); });
    $$('.qseg').forEach(function (s) { s.classList.remove('done'); });
  }

  /* ----- переходы по шагам ----- */
  function qGoStep(n) {
    qCurtain(function () {
      var q = qInit(); q.step = n;
      if (n === 2) enterQ2(); else if (n === 3) enterQ3(); else enterHonest();
      persist();
    });
  }
  function enterQ2() { var q = qInit(); q.step = 2; showScreen('q2'); EXT.questScene(U, $('#scr-q2')); setHashQuiet('q2'); }
  function enterQ3() { var q = qInit(); q.step = 3; showScreen('q3'); EXT.qlupaMount(U, $('#scr-q3')); setHashQuiet('q3'); }
  /* существо шага 3: ВСЕ УЖЕ; если уже поймано — СРОЧНОСТЬ, затем ЛЕСТЬ */
  function qBeast3() { var have = S.ext.beasts || []; return ['vse', 'sro', 'lest'].filter(function (id) { return have.indexOf(id) < 0; })[0] || 'vse'; }
  function questNext() {
    var q = qState(); if (!q || !q.on || CATCH.busy) return;
    if (q.step === 2) qGoStep(3);
    else if (q.step === 3) catchBeast(qBeast3(), function () { enterVerdict(); setHashQuiet('crumbs'); persist(); });
  }
  /* вывод решён: фиксируем и показываем кнопку «В Кодекс» («Забираю») или «Дальше» («Не моё»); дальше всё по тапу (qCrumbGo) */
  function qCrumbDecided(id) {
    var c = crById(id), q = qState(); if (!c || c.status === 'new') return;
    q.crumbDone = q.crumbDone || {};
    if (q.crumbDone[q.step]) return;
    q.crumbDone[q.step] = 1; persist(); renderCrumbs();
  }
  var crGoing = false;
  function qCrumbGo() {
    var q = qState(); if (!q || crGoing) return;
    var step = q.step, id = step === 3 ? 'n2' : 'n1', c = crById(id); if (!c || c.status === 'new') return;
    crGoing = true;
    var el = $('.cr2[data-c="' + id + '"]'), kept = c.status === 'keep' || c.status === 'fit', firstTab = !q.tabs.c, go = $('#crgo');
    if (go && go.parentNode) go.parentNode.removeChild(go);
    var after = function () {
      crGoing = false;
      qTabArrive('c');
      /* первое появление вкладки «Кодекс»: рассказчик объясняет, что это, и ждёт тапа «Дальше» */
      if (firstTab) { var ln = $('#qcapline'); ln.textContent = CODEX_INTRO; ln.hidden = false; $('#qcapgo').hidden = false; }
      else qAfterCrumbs(step);
    };
    if (kept) flyClone(el, $('#qtab-c'), after);
    else { if (el && !REDUCED) el.classList.add('toss'); later(after, REDUCED ? 0 : 450); }
  }
  function qAfterCrumbs(step) { var ln = $('#qcapline'); if (ln) ln.hidden = true; var cg = $('#qcapgo'); if (cg) cg.hidden = true; qCapHide(); if (step === 1) qGoStep(2); else if (step === 3) qGoStep(4); }
  /* начало квеста: заставка, затем шаг 1 с подсказкой T1 */
  function qStart() {
    var q = qInit(); q.step = 1;
    showScreen('play'); renderPlay(false);
    if (OPT.nostart || q.titled) tipsForPlay();
    else qSplash(function () { q.titled = true; qNick(tipsForPlay); });
  }
  /* ----- ник: «Как тебя подписать в чате?» (заход E, п. 5) — после заставки; хранится только в S.ext.nick на устройстве, никуда не уходит; пропуск → в чатах «ты» без @ ----- */
  function nickClean(v) { return String(v || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').replace(/^[@\s]+/, '').trim().slice(0, 16); }
  function qNick(done) {
    var el = $('#qnick'); if (!el || S.ext.nick !== undefined) { done(); return; }
    var inp = $('#nickin'), fin = false;
    var end = function (v) {
      if (fin) return; fin = true;
      S.ext.nick = nickClean(v); S.real = true; if (!S.ext.startTs) S.ext.startTs = Date.now(); persist();
      el.classList.add('out');
      setTimeout(function () { el.hidden = true; el.classList.remove('out'); done(); }, REDUCED ? 0 : 250);
    };
    inp.value = ''; el.classList.remove('out'); el.hidden = false;
    $('#nickok').onclick = function () { end(inp.value); };
    $('#nicksk').onclick = function () { end(''); };
    inp.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); end(inp.value); } };
    setTimeout(function () { try { inp.focus({ preventScroll: true }); } catch (e) { /* без фокуса — не страшно */ } }, 60);
  }
  /* сидирование для хэш-состояний и рендера: что уже собрано к началу шага */
  function qSeed(step) {
    var q = qInit(); q.on = true; q.step = step; q.titled = true; q.crumbDone = {}; q.caps = { c: step >= 2 ? 1 : 0, b: step >= 2 ? 1 : 0 };
    q.tabs = { c: step >= 2 ? 1 : 0, b: step >= 2 ? 1 : 0 };
    S.ext.beasts = ['sro', 'fact', 'vse'].slice(0, Math.max(0, Math.min(3, step - 1)));
    if (step >= 2) { S.basis = S.basis || 'socrates'; var c = cands(); c[0].status = 'keep'; if (step >= 4) c[1].status = 'keep'; }
    return q;
  }
  /* состояния рендера: ?s=quest&step=title|step2|step3|catch|final */
  function questDemo(step) {
    S.moves = ALL.slice(); S.caught = ['sro', 'ok', 'vse', 'lest']; S.basis = 'socrates';
    if (step === 'title') { qSeed(1); S.ext.q.titled = false; OPT.nostart = false; qStart(); return; }
    if (step === 'nick') { qSeed(1); S.ext.q.titled = true; OPT.nostart = false; S.ext.nick = undefined; showScreen('play'); renderPlay(false); qNick(function () { /* только показать */ }); return; }
    if (step === 'step2') { qSeed(2); var d = EXT.d2state(U, EXT.SCENES.q2); d.move = 'b'; d.stage = 'thread'; d.open = 2; enterQ2(); return; }
    if (step === 'step3') { qSeed(3); enterQ3(); return; }
    if (step === 'catch') { qSeed(1); enterPillar(); setTimeout(function () { catchBeast('sro', null, { hold: true }); }, 60); return; }
    if (step === 'final') { qSeed(4); S.honest = { pick: 'clear', tries: 1, ok: true, order: ['clear', 'vague', 'guilt'] }; S.cands[1].status = 'keep'; enterEnd(); return; }
    qSeed(1); qStart();
  }

  /* ================= РОУТЕР ================= */
  function resetAll() {
    clearTimers(); S = fresh(); gaugeBuilt = false; GAUGE.n = 0;
    rigReset();
    document.body.classList.remove('turn', 'has-info', 'done', 'lupa-on', 'quest', 'first'); document.body.classList.remove('demo');
    qReset();
    setKick(''); $('#h1').textContent = 'Уговори Тимура'; setSub('');
    $('#cards').innerHTML = '';
    var fl = $('#feel'); if (fl) fl.hidden = true;
    document.body.classList.remove('honest-done');
  }
  /* без прохождения: «чистый игрок» — итоги первой сессии минимальны (одна крупица на листе, одна в Кармане);
     с флагом demo=1 — насыщенное демо для проверки плотных экранов */
  function seedDemo() {
    if (S.real) return;
    S.moves = ALL.slice(); S.caught = ['sro', 'ok', 'vse', 'lest']; S.misses = OPT.demo ? { vse: 1 } : {}; S.basis = S.basis || 'socrates';
    S.ext.beasts = S.ext.beasts || (OPT.demo ? ['sro', 'fact', 'vse', 'recip', 'fakec'] : ['sro', 'fact', 'vse']);
    var c = cands();
    if (c[0].status === 'new') {
      c[0].status = 'keep';
      if (OPT.demo) { c[1].status = 'fit'; c[1].fit = true; c[1].text = c[1].alts[0]; } else c[1].status = 'pocket';
    }
  }
  var OPT = { demo: false, day: 2, t: -1, dayFlag: false, now: false, w0: false, notips: false, nostart: false };
  /* игровой день = номер завершённого Дела + 1 (Р8). Явный флаг day=N и демо важнее; без завершённых Дел в состоянии — день из OPT */
  function gameDay() {
    var e = S && S.ext;
    if (!OPT.dayFlag && e && e.day1Done) return 2 + (e.d2 && e.d2.fin ? 1 : 0) + (e.d3 && e.d3.fin ? 1 : 0) + (e.d4 && e.d4.fin ? 1 : 0);
    return OPT.day;
  }
  var U = {
    S: function () { return S; }, $: $, $$: $$, esc: esc, buzz: buzz, later: later, showScreen: showScreen, toast: toast,
    go: function (n) { location.hash = '#s=' + n; }, quiet: setHashQuiet, seed: seedDemo, cands: cands, DATA: DATA, cap1: cap1, opt: function () { return OPT; }, day: gameDay, build: BUILD,
    nick: function () { return (S && S.ext && S.ext.nick) || ''; }, catchBeast: catchBeast, questNext: questNext, forget: function () { lsDel(); try { history.replaceState(null, '', location.pathname + location.search + '#s=intro'); } catch (e) { /* file:// */ } route(); toast('Всё стёрто с этого устройства'); }
  };
  EXT.U = U;
  var EXTS = { whatwas: 1, home: 1, hidden: 1, day2: 1, day3: 1, day4: 1, codex: 1, bestiary: 1, backstage: 1, settings: 1, lupa: 1 };

  function enter(name, step) {
    clearTimers();
    ['trapsheet', 'praise', 'helpsheet'].forEach(function (id) { var e = document.getElementById(id); if (e) e.classList.remove('on'); });
    var isExt = !!EXTS[name];
    var keep = S.real && (isExt || name === 'end');
    if (!keep) resetAll();
    applyW0();
    switch (name) {
      case 'choice':
        qSeed(1); S.moves = ['sro']; showScreen('play'); renderPlay(false); break;
      case 'stamp':
        qSeed(1); S.moves = ALL.slice(); showScreen('play'); renderPlay(false); tipsForPlay(); break;
      case 'turn':
        qSeed(1); S.moves = ALL.slice(); showScreen('play'); renderPlay(false); document.body.classList.add('turn');
        setKick('Час спустя'); $('#h1').textContent = 'Теперь уговаривают тебя'; setSub(''); turnStatic(); break;
      case 'reveal':
        qSeed(1); S.moves = ALL.slice(); S.caught = ['sro']; S.lastCaught = 'sro'; enterChat(); break;
      case 'chat':
        qSeed(1); S.moves = ALL.slice(); enterChat(); break;
      case 'chat2':
        qSeed(1); S.moves = ALL.slice(); S.open = 'vse'; enterChat(); break;
      case 'pillar':
        qSeed(1); S.moves = ALL.slice(); S.caught = ['sro', 'ok', 'vse', 'lest']; enterPillar(); break;
      case 'found':
        qSeed(1); S.moves = ALL.slice(); S.caught = ['sro', 'ok', 'vse', 'lest']; S.basis = 'socrates'; enterPillar(); break;
      case 'crumbs': case 'verdict':
        qSeed(1); S.moves = ALL.slice(); S.caught = ['sro', 'ok', 'vse', 'lest']; S.basis = 'socrates'; S.ext.beasts = ['sro']; qState().tabs.b = 1; enterVerdict(); break;
      case 'honest':
        qSeed(4); S.moves = ALL.slice(); S.caught = ['sro', 'ok', 'vse', 'lest']; S.basis = 'socrates'; enterHonest(); break;
      case 'end':
        if (!keep) { qSeed(4); S.moves = ALL.slice(); S.misses = OPT.demo ? { vse: 1 } : {}; S.basis = 'socrates'; var c = cands(); c[0].status = 'keep'; c[1].status = 'keep'; S.honest = { pick: 'clear', tries: 1, ok: true, order: ['clear', 'vague', 'guilt'] }; }
        enterEnd(); break;
      case 'q2': qSeed(2); S.moves = ALL.slice(); S.caught = ['sro', 'ok', 'vse', 'lest']; enterQ2(); break;
      case 'q3': qSeed(3); S.moves = ALL.slice(); S.caught = ['sro', 'ok', 'vse', 'lest']; enterQ3(); break;
      case 'quest': questDemo(step || 'title'); break;
      default:
        if (isExt) {
          if (!keep) seedDemo();
          var fn = EXT.screens[name === 'hidden' ? 'home' : name];
          document.body.classList.toggle('demo', OPT.demo);
          fn(U, { step: step || '', trap: name === 'hidden' });
          break;
        }
        qStart();
    }
  }
  /* ---------- Р8: сохранение и продолжение после прерывания ----------
     Состояние (текущий экран и все подтверждённые выборы) лежит в localStorage; каждое обращение — в try/catch, без хранилища прототип работает как раньше.
     Хэш-состояния и демо важнее сохранённого. Флаги — только в хэше (см. начало файла): #reset — чистый старт один раз, #now — не ждать 07:00, #w0 — неделя 0.
     Возврат — на тот же экран, без повторной статистики. */
  var KEY = 'podvoh.proto.v1';
  function lsGet() { try { return window.localStorage.getItem(KEY); } catch (e) { return null; } }
  function lsSet(v) { try { window.localStorage.setItem(KEY, v); } catch (e) { /* хранилища нет: играем без сохранения */ } }
  function lsDel() { try { window.localStorage.removeItem(KEY); } catch (e) { /* нечего стирать */ } }
  function persist() {
    if (!S || !S.real) return;
    try { lsSet(JSON.stringify({ v: 1, S: S })); } catch (e) { /* не сериализуется: пропускаем */ }
  }
  function loadSaved() {
    var raw = lsGet(); if (!raw) return null;
    try { var o = JSON.parse(raw); return o && o.v === 1 && o.S && typeof o.S === 'object' ? o.S : null; } catch (e) { return null; }
  }
  function navType() { try { var n = performance.getEntriesByType('navigation')[0]; return n ? n.type : ''; } catch (e) { return ''; } }
  /* флаги живут только в хэше: «#reset&w0&t=17»; строка запроса (?…) ничего не значит */
  function hashTokens() { return String(location.hash || '').replace(/^#/, '').split('&').filter(Boolean); }
  function flagsStr() { return '#' + hashTokens().join('&'); }
  function hasFlag(name) { return hashTokens().some(function (t) { return t === name || t === name + '=1'; }); }
  function parseFlags() {
    var h = flagsStr(), fd = /demo=(\d)/.exec(h), fday = /day=(\d+)/.exec(h), ft = /[&#]t=(\d+)/.exec(h);
    if (fd) OPT.demo = fd[1] === '1';
    if (fday) { OPT.day = +fday[1]; OPT.dayFlag = true; } else if (fd) { OPT.day = OPT.demo ? 7 : 2; OPT.dayFlag = true; }
    if (ft) OPT.t = +ft[1];
    /* now и w0 держатся до конца сеанса: переход по ссылке внутри игры (#s=…) их из адреса убирает */
    if (hasFlag('now')) OPT.now = true;
    if (hasFlag('w0')) OPT.w0 = true;
    if (hasFlag('notips')) OPT.notips = true; /* #notips — без подсказок-стрелок (для проверок, где они мешают) */
    if (hasFlag('nostart')) OPT.nostart = true; /* #nostart — без заставки квеста (для проверок шага 1; сама заставка и её пропуск проверяются отдельно) */
  }
  /* #w0: скрытые приёмы выключены с самого начала; значение лежит в состоянии (ext.w0, ext.traps) и видно в настройках */
  function applyW0() { if (OPT.w0 && S && S.ext) { S.ext.w0 = true; S.ext.traps = false; } }
  /* #reset: стереть сохранённое один раз и убрать флаг из адреса (replaceState), чтобы перезагрузка и открытие из истории не стирали снова */
  function consumeReset() {
    if (!hasFlag('reset')) return false;
    lsDel();
    var rest = hashTokens().filter(function (t) { return t !== 'reset' && t !== 'reset=1'; });
    try { history.replaceState(null, '', location.pathname + location.search + (rest.length ? '#' + rest.join('&') : '')); } catch (e) { /* file:// */ }
    return true;
  }
  function route() {
    var h = flagsStr(), m = /[&#]s=([a-z0-9]+)/.exec(h), st = /step=([a-z0-9]+)/.exec(h);
    parseFlags();
    if (!m && S && S.real && S.scr && !hasFlag('reset')) { resume(S.scr); return; } /* «назад» на запись без s=: прогресс не сбрасываем */
    enter(m ? m[1] : 'intro', st ? st[1] : '');
  }
  function resume(scr) {
    clearTimers();
    switch (scr) {
      case 'play': showScreen('play'); renderPlay(false); tipsForPlay(); break;
      case 'chat': enterChat(); break;
      case 'pillar': enterPillar(); break;
      case 'q2': enterQ2(); break;
      case 'q3': enterQ3(); break;
      case 'verdict': enterVerdict(); break;
      case 'honest': enterHonest(); break;
      case 'end': enterEnd(); break;
      default:
        if (EXT.screens[scr]) { document.body.classList.toggle('demo', OPT.demo); EXT.screens[scr](U, { step: '', trap: false }); }
        else { showScreen('play'); renderPlay(false); tipsForPlay(); }
    }
    var fs = S.scr || scr; /* после увода на другой экран (например, Дело ещё закрыто) адрес — по фактическому экрану */
    try { history.replaceState(null, '', EXT.screens[fs] ? '#s=' + fs : location.pathname + location.search); } catch (e) { /* file:// */ }
  }
  function boot() {
    consumeReset();
    var f = flagsStr(), hasS = /[&#]s=[a-z0-9]+/.test(f), reload = navType() === 'reload';
    var saved = loadSaved();
    /* без адреса-состояния или после перезагрузки страницы — продолжаем с сохранённого; адрес-состояние при новом открытии важнее */
    if (saved && (!hasS || reload)) {
      S = saved; S.real = true; if (!S.ext) S.ext = {};
      parseFlags(); applyW0();
      var scr = S.scr || 'play';
      if (!reload && scr === 'end') scr = 'home';  /* новый визит после конца дня — на главную: там виден срок следующего Дела */
      resume(scr); return;
    }
    /* новая навигация на адрес #s=<экран> (из истории, восстановленной вкладки) при сохранённом прогрессе: сначала поднимаем сохранённое, иначе route() → enter() уронит его демо-состоянием */
    if (saved && hasS && !/(?:^|[&#])(?:demo|day|step)=/.test(f)) {
      S = saved; S.real = true; if (!S.ext) S.ext = {};
      parseFlags(); applyW0();
    }
    route();
  }

  /* ================= ПРОВОДКА ================= */
  function wire() {
    $('#cards').addEventListener('click', onCardTap);
    $('#stamp').addEventListener('click', startTurn);
    $('#tray').addEventListener('click', function (e) {
      onOptTap(e);
      if (e.target.closest('#toPillar')) { S.real = true; enterPillar(); setHashQuiet('pillar'); }
      if (e.target.closest('#autoNext')) { S.real = true; autoNameLast(); }
    });
    $('#tags').addEventListener('click', onTagTap);
    $('#msgs').addEventListener('click', onMsgTap);
    $('#msgs').addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.msg.tappable')) { e.preventDefault(); onMsgTap(e); } });
    $('#slips').addEventListener('click', onSlip);
    $('#tonote').addEventListener('click', function () {
      var q = qState();
      if (q && q.on) { if (CATCH.busy) return; S.real = true; catchBeast('sro', function () { enterVerdict(); setHashQuiet('crumbs'); persist(); }); return; } /* квест: конец шага 1 — «Пойман кто-то по имени СРОЧНОСТЬ», затем крупица */
      enterVerdict(); setHashQuiet('crumbs');
    });
    $('#qtop').addEventListener('click', function (e) { if (e.target.closest('.qtab')) toast('Откроется, когда дойдёшь до гаража'); });
    $('#crhost').addEventListener('click', function (e) { if (e.target.closest('#crgo')) { S.real = true; buzz(10); qCrumbGo(); return; } onCrumbTap(e); });
    $('#qcapnext').addEventListener('click', function () { var q = qState(); if (q) { S.real = true; qAfterCrumbs(q.step); } });
    /* подпись вкладки уходит по тапу в любом месте (но не в тот же момент, когда появилась) */
    document.addEventListener('click', function () { if (Date.now() - qCapTs > 350) qCapHide(); }, true);
    $('#feelnext').addEventListener('click', function () { S.real = true; buzz(10); feelNext(); });
    $('#toend').addEventListener('click', function () { enterHonest(); });
    $('#honestinv').addEventListener('click', onInvite);
    $('#honestres').addEventListener('click', function (e) {
      if (e.target.closest('#honestnext')) enterEnd();
    });
    $('#copygrid').addEventListener('click', function () {
      var good = function () { $('#copydone').textContent = 'Ссылка скопирована. Вставь в любой чат.'; }, bad = function () { $('#copydone').textContent = 'Скопировать не получилось: перешли ссылку на игру вручную.'; };
      try { var pr = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(shareText()) : null; if (pr && pr.then) pr.then(good, bad); else if (pr === null) bad(); else good(); } catch (e) { bad(); }
      buzz(10);
    });
    var rz; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { layoutThreads(); layoutScenes(); if (TIP.cur) tipPlace(); }, 80); });
    document.addEventListener('scroll', function () { if (TIP.cur) tipPlace(); }, true);
    document.addEventListener('click', function (e) { if (e.target.closest('[data-help]')) tipHide(false); }, true);
    document.addEventListener('pointerdown', sndUnlock, true);
    window.addEventListener('hashchange', route);
    document.addEventListener('click', function () { setTimeout(persist, 0); }, true);
    window.addEventListener('pagehide', persist);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') persist(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { layoutThreads(); layoutScenes(); });
    window.addEventListener('error', function (e) { window.__errs = (window.__errs || []).concat(String(e.message)); });
  }

  /* экран загрузки из index.html снимается здесь: первый экран уже нарисован (или запуск упал — тогда тем более не прячем страницу) */
  try { wire(); boot(); } finally { if (window.__npcBooted) window.__npcBooted(); }
  window.__nit ={ intro: { c: CODEX_INTRO, b: BEST_INTRO }, qBeast3: qBeast3, SND: SND, RIGS: function () { return RIGS; }, S: function () { return S; }, enter: enter, U: U, TIPS: TIPS, armTip: function (id, ms) { tipAfter(id, ms); }, tip: function () { return { cur: TIP.cur, text: TIP.el ? TIP.el.textContent : '', on: !!(TIP.el && TIP.el.classList.contains('on')), flags: (S.ext && S.ext.tips) || {} }; } };
})();
