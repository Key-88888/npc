/* «Не По Сценарию» — остальные разделы прототипа: настройки, сцены чата (шаг 2 квеста «Суббота» и Дело второго дня «Должок»), Лупа шага 3, кодекс, бестиарий, скрытый уровень, закулисье.
   Дело третьего дня «Краски» (SCENES.d3, экран day3, секция #scr-day3 создаётся здесь же) — тот же движок сцены с данными PAINT.
   Подключается до app.js. Данные — в объекте EXT. Без сети и хранилищ: состояние живёт в памяти страницы (S.ext).
   Режимы: по умолчанию «чистый игрок» (второй игровой день, кодекс из итогов первой сессии). Флаги в хэше: demo=1 (насыщенное демо:
   кодекс из девяти записей, седьмой день), day=N (игровой день), t=H (час на устройстве для следа огонька). */
(function () {
  'use strict';

  /* ================= ДАННЫЕ: единая таблица взглядов (ТЗ §11: 16 в MVP; прототип показывает 14 из них; три резервных взгляда из ТЗ в прототипе не используются) ================= */
  var TONE = { cold: '#3FD2FF', thorn: '#FF3F8E', quiet: '#FFC857' }; // три тона «Хора»
  var VIEWS = {
    skeptic:   { name: 'скептики',       ab: 'Сп', kind: 'школа',    tone: 'cold',  ang: -75, strong: 'требовать оснований', price: 'вечное «не знаю»', src: 'Секст Эмпирик', dark: '«ничего нельзя знать, так что слушай меня»' },
    stoic:     { name: 'стоики',         ab: 'Ст', kind: 'школа',    tone: 'cold',  ang: -66, strong: 'спокойствие: занимаешься тем, что зависит от тебя', price: 'можно остыть к тем, кому нужна твоя злость', src: 'Эпиктет, «Энхиридион»', dark: 'ледяное «не бери в голову», чтобы вопросов не было' },
    confucius: { name: 'Конфуций',       ab: 'Кф', kind: 'традиция', tone: 'cold',  ang: -57, strong: 'отношения — обязанности в обе стороны', price: 'правила становятся клеткой', src: '«Лунь юй»', dark: '«так принято», после которого вопросы считаются грубостью' },
    socrates:  { name: 'Сократ',         ab: 'Ск', kind: 'школа',    tone: 'cold',  ang: -48, strong: 'вопрос вместо давления', price: 'тебя могут счесть занудой', src: 'Платон, «Апология»', dark: 'допрос без конца, пока отказываться не надоест' },
    kant:      { name: 'Кант',           ab: 'Ка', kind: 'школа',    tone: 'cold',  ang: -39, strong: 'поступай так, как мог бы пожелать для всех', price: 'правило бывает жёстче жизни', src: 'Кант, «Основы метафизики нравов»', dark: '«а если бы все так делали?» как повод для стыда' },
    pragm:     { name: 'прагматизм',     ab: 'Пр', kind: 'современная картина мира', tone: 'cold', ang: -30, strong: 'смотрит, работает ли идея на деле', price: 'можно оправдать любую выгоду', src: 'У. Джеймс, «Прагматизм»', dark: '«это же выгодно», пока цена не посчитана' },
    epicurus:  { name: 'эпикурейцы',     ab: 'Эп', kind: 'школа',    tone: 'quiet', ang: -21, strong: 'различать нужное и навязанное', price: 'можно проглядеть дело, ради которого стоит потерпеть', src: 'Эпикур, «Письмо Менекею»', dark: '«побалуй себя, хватит терпеть» как крючок покупки' },
    buddhism:  { name: 'буддизм',        ab: 'Бу', kind: 'традиция', tone: 'quiet', ang: -12, strong: 'отпустить прошедшее', price: 'принятие можно спутать с безразличием', src: '«Дхаммапада»', dark: '«расслабься, не цепляйся» вместо ответа на вопрос' },
    romantic:  { name: 'романтизм',      ab: 'Ро', kind: 'современная картина мира', tone: 'quiet', ang: -4, strong: 'чувство и своя дорога важнее расписания', price: 'можно жить порывом и платить потом', src: 'Шиллер, «Письма об эстетическом воспитании»', dark: '«следуй за мечтой», а платить будешь ты' },
    minimal:   { name: 'минимализм',     ab: 'Ми', kind: 'современная картина мира', tone: 'quiet', ang: 4, strong: 'меньше вещей — больше свободы', price: 'можно сжаться до скуки', src: 'Торо, «Уолден»', dark: '«избавься от старого» и купи новое, правильное' },
    aristotle: { name: 'Аристотель',     ab: 'Ар', kind: 'школа',    tone: 'quiet', ang: 13, strong: 'искать меру между крайностями', price: 'середина бывает удобной отговоркой', src: 'Аристотель, «Никомахова этика»', dark: '«не перегибай, выбирай среднее» вместо ответа' },
    achiev:    { name: 'достигаторство', ab: 'До', kind: 'современная картина мира', tone: 'thorn', ang: 22, strong: 'рост и ясные цели', price: 'любой отдых начинает казаться провалом', src: 'Франклин, «Автобиография»', dark: '«ты отстаёшь, другие уже…»' },
    hedon:     { name: 'гедонизм',       ab: 'Ге', kind: 'школа',    tone: 'thorn', ang: 32, strong: 'жизнь должна радовать, и это не стыдно', price: 'радость превращается в погоню за радостью', src: 'Аристипп, в пересказе Диогена Лаэртского', dark: '«лови момент, пока скидка»' },
    nihil:     { name: 'нигилизм',       ab: 'Ни', kind: 'современная картина мира', tone: 'thorn', ang: 43, strong: 'не верить готовым смыслам на слово', price: 'можно ничего не строить и звать это честностью', src: 'Тургенев, «Отцы и дети»', dark: '«всё равно ничего не изменится»' },
    cynic:     { name: 'киники',         ab: 'Ки', kind: 'школа',    tone: 'thorn', ang: 55, strong: 'свобода от чужих оценок', price: 'можно презирать людей, чтобы не бояться их', src: 'Диоген Лаэртский, «О жизни философов»', dark: '«тебе же всё равно, что скажут», чтобы советов не слушали' }
  };
  /* Находка подаётся как «Так рассуждают стоики», а не как «твой ход — это взгляд X» (Р1) */
  var LEADS = { stoic: 'Так рассуждают стоики', confucius: 'Так рассуждал Конфуций', socrates: 'Так рассуждал Сократ', kant: 'Так рассуждал Кант', pragm: 'Так рассуждают прагматисты',
    epicurus: 'Так рассуждали эпикурейцы', buddhism: 'Так рассуждают буддисты', romantic: 'Так рассуждают романтики', minimal: 'Так рассуждают минималисты', skeptic: 'Так рассуждали скептики',
    aristotle: 'Так рассуждал Аристотель', achiev: 'Так рассуждают достигаторы', hedon: 'Так рассуждали гедонисты', nihil: 'Так рассуждают нигилисты', cynic: 'Так рассуждали киники' };
  Object.keys(LEADS).forEach(function (k) { VIEWS[k].lead = LEADS[k]; });

  /* крупицы кодекса: сферы — школа, друзья, семья, любовь, деньги, будущее, потеря */
  var SPHERES = [['school', 'Школа'], ['friends', 'Друзья'], ['family', 'Семья'], ['love', 'Любовь'], ['money', 'Деньги'], ['future', 'Будущее'], ['loss', 'Потеря']];
  /* Р7: необязательная область действия крупицы (codex.grains[].scope); «когда устал» из ТЗ записано безличным «когда нет сил» */
  var SCOPES = ['в учёбе', 'с друзьями', 'дома', 'когда нет сил'];
  function sphName(id) { return (SPHERES.filter(function (s) { return s[0] === id; })[0] || [0, id])[1].toLowerCase(); }
  var BASE_CRUMBS = [
    { id: 'c1', view: 'stoic',    text: 'Держусь за то, что от меня зависит.',            sph: ['school', 'family'], bit: 3 },
    { id: 'c4', view: 'epicurus', text: 'Мне это нужно или мне это продали?',             sph: ['money', 'friends'], bit: 11 },
    { id: 'c2', view: 'buddhism', text: 'Отпускаю то, что прошло.',                       sph: ['love', 'loss'], bit: 19 },
    { id: 'cA', view: 'minimal',  text: 'Меньше гонок, больше покоя: не каждую надо бежать.', sph: ['school', 'future'], bit: 27, contra: 'cB' },
    { id: 'cB', view: 'achiev',   text: 'Рвусь к рекорду: каждый день на шаг лучше.',    sph: ['school', 'future'], bit: 28, contra: 'cA' },
    { id: 'c6', view: 'minimal',  text: 'Лишнее — не то, что дорого, а то, что мешает.',  sph: ['money', 'family'], bit: 35 },
    { id: 'c7', view: 'pragm',    text: 'Идея хороша, если работает на деле.',            sph: ['money', 'future'], bit: 41 },
    { id: 'c8', view: 'confucius', text: 'Своим становятся, приходя, даже когда лень.',   sph: ['friends', 'family'], bit: 44, contra: 'own1' }
  ];
  /* в ссылке друга только номера показанных крупиц: отрицательного решения («выбросил») в нынешнем формате ссылки нет (Р11) */
  var FRIEND = { shown: ['c1', 'c4', 'cB', 'c7'] };
  function plural(n, f) { var a = Math.abs(n) % 100, b = a % 10; return a > 10 && a < 20 ? f[2] : (b > 1 && b < 5 ? f[1] : (b === 1 ? f[0] : f[2])); }

  /* бестиарий: карточка-существо — чем берёт, где водится, как отшить (заход D: имена из жизни — Подлиза, Толпа, Таймер, Решала, Должок, Развилка, Огонёк) */
  var BEASTS = {
    lest: { name: 'Подлиза', epi: 'хвалит заранее, просит потом', s: ['Хвалит до просьбы. После «ты же не как все» отказать — значит оказаться как все.', 'Личка, реклама «для тех, кто разбирается», любое «только ты сможешь».', 'Спроси себя: сказали бы мне это, если бы ничего не хотели?'] },
    vse:  { name: 'Толпа', epi: 'много людей, которых никто не видел', s: ['Показывает толпу, которой не видно. И вот твоё «нет» уже кажется странным.', 'Чаты класса, «500 человек уже купили», «сейчас смотрят», «все наши идут».', 'Спроси: «Кто именно?» Обычно толпа рассыпается на двоих.'] },
    sro:  { name: 'Таймер', epi: 'часы, которые тикают не для тебя', s: ['Отнимает время на подумать. «Только до пятницы» — и ты соглашаешься, просто чтобы успеть.', 'Распродажи, «ответь до вечера», «осталось 2 часа», любой обратный отсчёт.', 'Спроси: «А что будет, если я отвечу завтра?» Настоящий срок вопрос переживёт. Выдуманный — сдуется.'] },
    loss: { name: 'Огонёк', epi: 'страх потерять то, чего не было', s: ['Пугает потерей. Играть не зовёт — зовёт не пропустить.', 'Серии в играх и приложениях, «подарок за вход», «не теряй прогресс».', 'Спроси: что именно сгорит и кому от этого выгода?'] },
    fact: { name: 'Решала', epi: 'решает за тебя и объявляет всем', s: ['Объявляет твоё решение раньше тебя. Отказаться потом — всё равно что поссориться.', 'Чаты, компании, семейные планы: «я уже всем сказал, что ты идёшь».', 'Спокойно: «Пока не решено». Решение возвращается к тебе.'] },
    recip: { name: 'Должок', epi: 'помогает в долг, о котором не предупредил', s: ['Напоминает, что тебе помогли, — и выставляет счёт. Сразу и в своей валюте.', 'Личка, друзья, родственники: «я же тебе тогда…», «с тебя должок».', 'Помощь — не кредит. Вернуть добро можно, но по-своему и когда можешь.'] },
    fakec: { name: 'Развилка', epi: 'два пути там, где их пять', s: ['Оставляет тебе два варианта, хотя их больше. Оба — чужие.', 'Ультиматумы: «или с нами, или никак», «или покупаешь, или потом пожалеешь».', 'Спроси: «А третий вариант?» Почти всегда он есть.'] },
    guilt: { name: 'Обидка', epi: 'обижается так, чтобы стыдно стало тебе', s: ['Вешает на тебя чужую обиду — заранее, пока ты ещё ничего не решаешь. И твоё «нет» уже звучит как «из-за тебя всё зря».', 'Друзья, семья, пары: «мы на тебя рассчитывали», «ну и ладно, сами», «из-за тебя всё сорвётся».', 'Спроси себя два раза: человеку обидно? И это правда моя вина? Первое часто бывает без второго.'] }
  };
  Object.keys(BEASTS).forEach(function (k) { var b = BEASTS[k]; b.power = b.s[0]; b.where = b.s[1]; b.weak = b.s[2]; });
  /* имя существа для карточки поимки: «Пойман кто-то по имени Таймер» (без верхнего регистра) */
  function beastTag(id) { var b = BEASTS[id]; return b.tag || b.name; }
  /* внутреннее имя приёма (оно же data-n кнопки) → слово на кнопке: приём называется глаголом того, что делают с тобой */
  var TRAY = { 'ЛЕСТЬ': 'Льстит', 'ВСЕ УЖЕ': 'Давит толпой', 'СРОЧНОСТЬ': 'Торопит', 'ПЕРЕД ФАКТОМ': 'Решили за тебя', 'ВЗАИМНОСТЬ': 'Напоминает про должок', 'ЛОЖНЫЙ ВЫБОР': 'Или-или', 'СТРАХ ПОТЕРИ': 'Пугает потерей', 'ВИНА': 'Давит на совесть', 'ЧИСТО': 'Без подвоха' };
  function tray(n) { return TRAY[n] || n; }
  var TECH_BEAST = { 'ЛЕСТЬ': 'lest', 'ВСЕ УЖЕ': 'vse', 'СРОЧНОСТЬ': 'sro', 'ПЕРЕД ФАКТОМ': 'fact', 'ВЗАИМНОСТЬ': 'recip', 'ЛОЖНЫЙ ВЫБОР': 'fakec', 'СТРАХ ПОТЕРИ': 'loss', 'ВИНА': 'guilt' };

  /* «Лупа дня» (Р15): ОДИН артефакт в день, конечная порция: результат, затем конец дня. Бесконечного переключения нет.
     Ротация по игровым дням: артефакт N из 24; в прототипе шесть образцов по кругу. Честных не меньше трети, не меньше пятой части — с верным ходом «пауза»
     (pause: true). Третий полноправный ответ — «Мало данных». Проверить в Лупе нельзя: это 60 секунд. */
  /* шаг 3 квеста «Суббота»: артефакт живёт отдельно от ротации дня (в ротации его нет), 60 секунд без штрафа, итог не входит в счёт «артефакт N из 30» */
  var LUPA_Q = { app: 'Магазин «Витрина»', kind: 'уведомление', head: 'Распродажа — для тебя', clean: false, okLine: 'Цена — честная.', zones: [
        { t: 'Осталось 2 часа!', tech: 'sro', why: 'Торопит. Через два часа начнётся новая распродажа, а за ней ещё одна. Таймер нужен, чтобы на «а оно мне надо?» не осталось времени.' },
        { t: '5 человек смотрят эту толстовку прямо сейчас', tech: 'vse', why: 'Давит толпой. Кто эти пятеро, магазин не скажет. Может, их и нет. Зато появляется чувство, что толстовку сейчас уведут.' },
        { t: 'Ты разбираешься в стиле — она точно для тебя', tech: 'lest', why: 'Льстит. Магазин тебя ни разу не видел, но уже хвалит. Похвала авансом — чтобы отказываться было неловко даже перед телефоном.' },
        { t: 'Толстовка оверсайз · 1 990 ₽ со скидкой', tech: null, why: 'Без подвоха. Цена — это просто цена. С ней можно спорить, но она не давит.' }] };
  var LUPA = [
    { app: 'Доставка', kind: 'SMS', head: 'Заказ № 4417', clean: true, zones: [
        { t: 'Курьер приедет сегодня с 14:00 до 16:00.', tech: null }, { t: 'Позвоним за 30 минут.', tech: null },
        { t: 'Не подходит время — перенесите по ссылке.', tech: null }] },
    { app: 'Онлайн-школа «Знайка»', kind: 'уведомление', head: 'Курс — для тебя', clean: false, okLine: 'Цена — честная.', zones: [
        { t: 'Скидка только до вечера!', tech: 'sro', why: 'Торопит. Вечером будет новая «только до вечера». Проверено.' }, { t: '3 000 школьников уже записались', tech: 'vse', why: 'Давит толпой. Три тысячи — это кто? Ты их не видишь, а чувство «все уже там» — видишь.' },
        { t: 'Ты быстро схватываешь — тебе подойдёт продвинутый уровень', tech: 'lest', why: 'Льстит. Школа тебя не знает, но уже хвалит. Знакомо?' }, { t: 'Курс: 2 900 ₽, со скидкой 1 450 ₽', tech: null, why: 'Без подвоха. Цена и скидка названы прямо. Нужен ли курс — другой вопрос.' }] },
    { app: 'Чат «Район 9»', kind: 'сообщение в чате', head: 'Пересылка', pause: true, zones: [
        { t: 'Говорят, завтра в школе отменят уроки.', tech: null }, { t: 'Подруга говорит, что в учительской так решили.', tech: null },
        { t: 'Скинь в свой класс.', tech: null }],
      pauseWhy: 'Источник слуха не назван. Спроси, откуда это известно, и передавай после ответа.' },
    { app: 'Приложение «Плюс»', kind: 'уведомление', head: 'Подписка · предложение', clean: false, zones: [
        { t: 'Цена вырастет сегодня в полночь', tech: 'sro' }, { t: 'Уже 12 000 человек с нами', tech: 'vse' },
        { t: 'Отменить можно в настройках', tech: null }] },
    { app: 'Школьный чат', kind: 'сообщение в чате', head: '8Б', clean: true, zones: [
        { t: 'Завтра физкультура в зале.', tech: null }, { t: 'Форма обычная, начало в 9:30.', tech: null },
        { t: 'Кто не может — напишите учителю.', tech: null }] },
    { app: 'Объявление у входа', kind: 'листовка', head: 'Кружок «Робо»', pause: true, zones: [
        { t: 'Места ограничены', tech: null }, { t: 'Занятия по вторникам в 17:00', tech: null }],
      pauseWhy: 'Сколько мест и сколько занято, не сказано. Спроси у организатора, прежде чем спешить.' }
  ];
  var LUPA_NAMES = ['СРОЧНОСТЬ', 'ВСЕ УЖЕ', 'ЛЕСТЬ'];
  var TECH_NAME = { sro: 'СРОЧНОСТЬ', vse: 'ВСЕ УЖЕ', lest: 'ЛЕСТЬ' };
  var TECH_WHY = { sro: 'Торопит. Срок поджимает, чтобы подумать было некогда.', vse: 'Давит толпой. Толпу не видно, а «нет» уже кажется странным.', lest: 'Льстит. Похвала авансом: отказать после неё неловко.' };
  function zoneWhy(zn) { return zn.why || (zn.tech ? TECH_WHY[zn.tech] : 'Без подвоха. Строка просто сообщает и оставляет выбор.'); }

  /* скрытые приёмы игры: ослабленные настоящие тёмные паттерны; живёт не дольше 7 дней, по одному за раз */
  var TRAPS = [
    { id: 'flame', name: 'Огонёк серии', says: 'Серия сгорит, если не зайти до полуночи.', truth: 'Ничего не сгорает. Серия — просто число: огонёк пугает потерей, а играть даже не зовёт.', trace: 'красная ниточка в пламени; пометка «сгорит в 00:00» с 16:00 до 21:00' },
    { id: 'two', name: '«Осталось 2 часа»', says: 'Бонус пропадёт через 2 часа.', truth: 'Таймер не привязан ни к чему. Бонус есть всегда.', trace: 'часы в углу карточки Дела' },
    { id: 'five', name: '«5 друзей уже играют»', says: 'Пять друзей уже в игре, не отставай.', truth: 'Цифру никто не считал: это слова «все уже» в упаковке интерфейса.', trace: 'мелкая строка под кнопкой «Открыть»' },
    { id: 'gift', name: 'Подарок за вход', says: 'Заходи сегодня и забери подарок.', truth: 'Подарок возвращает тебя в игру, а не награждает. Здесь он будет в сезоне 2.', trace: 'ещё не показывался', s2: true },
    { id: 'shame', name: 'Конфирмшейминг', says: 'Кнопка отказа звучит как «Нет, мне не важно расти».', truth: 'Отказ подан как слабость, чтобы нажимать его было стыдно. Здесь будет в сезоне 2.', trace: 'ещё не показывался', s2: true }
  ];

  /* ================= ОБЩИЕ ВИДЖЕТЫ ================= */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function vchip(k, small) { var v = VIEWS[k]; return '<span class="vchip' + (small ? ' sm' : '') + '" style="--tc:' + TONE[v.tone] + '">' + v.name + '</span>'; }
  function ex(U) { var s = U.S(); if (!s.ext) s.ext = {}; return s.ext; }

  var FLAME = '<svg viewBox="0 0 24 30" aria-hidden="true"><path d="M12 1c1 6 8 9 8 18a8 8 0 0 1-16 0c0-4 2-6 3-8 1 3 3 4 4 3-1-5-1-9 1-13z" fill="#FFC247" stroke="#1C1411" stroke-width="2" stroke-linejoin="round"/><path d="M12 12c-2.4 3.2-2.4 5.2 0 8s0 3.2 0 4.6" stroke="#E8432B" stroke-width="1.7" fill="none" stroke-linecap="round"/></svg>';
  var LUPASVG = '<svg viewBox="0 0 26 26" aria-hidden="true"><circle cx="11" cy="11" r="7.5" fill="none" stroke="#1C1411" stroke-width="2.6"/><path d="M17 17l7 7" stroke="#1C1411" stroke-width="3.6" stroke-linecap="round"/><path d="M7.5 9.5a4.5 4.5 0 0 1 3-2.4" stroke="#1C1411" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>';
  var GEAR = '<svg viewBox="0 0 26 26" aria-hidden="true"><circle cx="13" cy="9" r="4.4" fill="none" stroke="#1C1411" stroke-width="2.4"/><path d="M4.5 23c.6-5 4-7.4 8.5-7.4s7.9 2.4 8.5 7.4" fill="none" stroke="#1C1411" stroke-width="2.4" stroke-linecap="round"/></svg>';

  /* час на устройстве (для следа огонька и ночной тишины); в прототипе его можно задать флагом t=H */
  function hour(U) { var o = U.opt(); return o.t >= 0 ? o.t : new Date().getHours(); }
  /* огонёк живёт на днях 2-8, пока не пойман и пока приёмы не выключены; ночью (22:00-07:00) его нет */
  function flameOn(U) {
    var s = ex(U), h = hour(U), force = cur && cur.opts && cur.opts.trap;
    if (s.traps === false || s.flameCaught) return false;
    if (force) return true;
    return U.day() >= 2 && U.day() <= 8 && h >= 7 && h < 22;
  }
  /* первый след: подпись под огоньком только с 16:00 до 21:00 */
  function traceOn(U) { var h = hour(U); return h >= 16 && h < 21; }
  function allCands(U) { return U.cands().concat((ex(U).d2 || {}).cr || [], (ex(U).d3 || {}).cr || [], ex(U).drafts || []); }
  function swInit(s) { if (!s.sw) { s.sw = {}; HOOKS.forEach(function (h) { s.sw[h.id] = h.on; }); } if (s.traps === false) s.sw[0] = false; return s.sw; }

  function bar(U, curk) {
    /* огонёк живёт только в шапке главного экрана (ТЗ §8): на кодексе, бестиарии, настройках и в Деле его нет, и в историю показов он там не попадает */
    var s = ex(U), flame = curk === 'home' && flameOn(U);
    if (flame) { s.shown = s.shown || []; if (s.shown.indexOf('flame') < 0) s.shown.push('flame'); } /* история показов: Закулисье раскроет только показанное */
    var tab = function (k, href, label, extra) { return '<a data-insp="вкладка «' + label + '»" class="' + ((curk === k || (k === 'home' && (curk === 'day2' || curk === 'day3'))) ? 'cur' : '') + '" href="#s=' + href + '">' + label + (extra || '') + '</a>'; };
    return '<header class="appbar"><div class="ab-row"><a class="brand rus" data-insp="название игры" aria-label="Не По Сценарию" href="#s=home"><i class="ini">Н</i>е <i class="ini">П</i>о<br><i class="ini">С</i>ценарию</a><div class="ab-r">' +
      (flame ? '<button class="flame" type="button" data-trap="flame" data-insp="огонёк в шапке" aria-label="Серия: 2 дня"><span class="fi">' + FLAME + '</span><b>2</b>' + (traceOn(U) ? '<small class="trace" aria-hidden="true">сгорит в 00:00</small>' : '') + '</button>' : '') +
      '<button class="helpb mono" type="button" data-help aria-label="Если тяжело">Если тяжело</button>' +
      '<button class="lupa" type="button" aria-pressed="' + (!!s.lupa) + '" aria-label="Лупа: найти приём в самом приложении">' + LUPASVG + '</button>' +
      '<a class="gear' + ((curk === 'settings' || curk === 'backstage') ? ' cur' : '') + '" href="#s=settings" aria-label="Профиль и настройки">' + GEAR + '</a></div></div>' +
      '<nav class="tabs" aria-label="Разделы">' + tab('home', 'home', 'Дело') + tab('codex', 'codex', 'Кодекс') +
      tab('bestiary', 'bestiary', 'Бестиарий', s.flameCaught ? '<span class="plus1">+1</span>' : '') + '</nav>' +
      '<div class="lupastrip mono" aria-live="polite">Лупа включена · проверок на сегодня: <b class="lchk">' + chkState(U).left + '</b> из 3</div></header>';
  }
  function mount(U, id, curk, inner, extra) {
    var el = $('#' + id); el.innerHTML = bar(U, curk) + inner;
    U.showScreen(curk === 'day2' ? 'day2' : curk);
    if (extra) extra(el);
    return el;
  }

  /* ---------- «Если тяжело»: доступно с первого экрана, локально, без записи ---------- */
  function helpSheet(open) {
    var sh = $('#helpsheet');
    if (!sh) { sh = document.createElement('div'); sh.id = 'helpsheet'; sh.className = 'trapsheet'; $('#app').appendChild(sh); }
    if (!open) { sh.classList.remove('on'); sh.innerHTML = ''; return; }
    sh.classList.add('on');
    sh.innerHTML = '<div class="ts-in"><div class="ts-k mono">поддержка</div><h3>Если тяжело</h3>' +
      '<p>Если сейчас тяжело — с этим не обязательно разбираться в одиночку.</p>' +
      '<p>Детский телефон доверия: <strong>8-800-2000-122</strong>. Бесплатно и анонимно, там выслушают и не будут читать нотации.</p>' +
      '<p>Если опасно прямо сейчас — <strong>112</strong>.</p>' +
      '<p class="pr-b">Игра ничего не записывает и никому не говорит, что эта панель открывалась.</p>' +
      '<div class="ts-btns"><a class="btn seen" href="tel:88002000122">Позвонить</a><button class="btn ts-close" type="button" data-help-close>Закрыть</button></div></div>';
  }

  /* ---------- скрытый уровень: лупа работает на любом элементе шапки и главной ---------- */
  var cur = null, EXT_counts = null;
  function rerender(U) { if (cur) { cur.opts = { trap: cur.opts && cur.opts.trap, step: '' }; EXT.screens[cur.name](U, cur.opts); } }
  /* Р15: ловушка интерфейса — 3 проверки в день, счётчик виден в режиме лупы, ложная тревога тратит проверку;
     бирки СТРАХ ПОТЕРИ / СРОЧНОСТЬ / ВСЕ УЖЕ / ЧИСТО в случайном порядке при каждом открытии */
  var TRAP_NAMES = ['СТРАХ ПОТЕРИ', 'СРОЧНОСТЬ', 'ВСЕ УЖЕ', 'ЧИСТО'];
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function chkState(U) { var s = ex(U), day = Math.max(1, U.day()); if (!s.chk || s.chk.day !== day) s.chk = { day: day, left: 3 }; return s.chk; }
  function updateChk(U) { var c = chkState(U); $$('.lchk').forEach(function (e) { e.textContent = c.left; }); }
  function lupaOff(U) { var s = ex(U); s.lupa = false; s.insp = null; document.body.classList.remove('lupa-on'); trapSheet(U, false); $$('.lupa').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); }); }
  function trapSheet(U, open) {
    var sh = $('#trapsheet');
    if (!sh) { sh = document.createElement('div'); sh.id = 'trapsheet'; sh.className = 'trapsheet'; $('#app').appendChild(sh); }
    var s = ex(U), q = s.insp;
    if (!open || !q) { sh.classList.remove('on'); sh.innerHTML = ''; return; }
    sh.classList.add('on');
    if (!q.order) q.order = shuffle(TRAP_NAMES);
    var c = chkState(U);
    sh.innerHTML = '<div class="ts-in"><div class="ts-k mono"><span>лупа · ' + esc(q.label) + '</span><span class="ts-chk">проверок ' + c.left + ' из 3</span></div><h3>Что здесь?</h3>' +
      (q.hint ? '<div class="hint2">' + q.hint + '</div>' : '') +
      '<div class="opts4">' + q.order.map(function (n) { return '<button class="opt' + (n === 'ЧИСТО' ? ' clean' : '') + (q.wrong.indexOf(n) >= 0 ? ' no' : '') + '" type="button" data-tn="' + n + '">' + tray(n) + '</button>'; }).join('') + '</div>' +
      '<button class="ts-close mono" type="button" data-tclose>закрыть лупу</button></div>';
    updateChk(U);
  }
  /* охота (ТЗ §8): сколько ловушек MVP ещё не поймано; ловушки сезона 2 не считаются, сравнения с другими нет */
  function hiddenLeft(U) { var s = ex(U); return TRAPS.filter(function (t) { return !t.s2 && !(t.id === 'flame' && s.flameCaught); }).length; }
  function burn(U) {
    var s = ex(U); s.flameCaught = true; s.lupa = false; s.insp = null;
    s.beasts = s.beasts || []; if (s.beasts.indexOf('loss') < 0) s.beasts.push('loss');
    document.body.classList.remove('lupa-on'); trapSheet(U, false);
    var f = $('.screen.on .flame');
    var finish = function () {
      rerender(U);
      var pr = $('#praise'); if (!pr) { pr = document.createElement('div'); pr.id = 'praise'; pr.className = 'praise'; $('#app').appendChild(pr); }
      var bl = BEASTS.loss;
      pr.innerHTML = '<div class="pr-in"><div class="pr-k mono">Ого. Это было спрятано</div><h3>Пойман кто-то по имени ' + bl.name + '</h3>' +
        '<p>Его никто не показывал — а у тебя получилось разглядеть. Огонёк пугал, что серия сгорит, если не зайти до полуночи. Ничего бы не сгорело.</p>' +
        '<p class="hunt"><b>Больше он не появится. Но спрятано ещё ' + hiddenLeft(U) + '.</b></p>' +
        '<div class="trophy"><span class="tr-ico">' + FLAME + '</span><div><b>' + bl.epi + '</b><dl class="pr-dos"><dt class="mono">Чем берёт</dt><dd>' + bl.s[0] + '</dd><dt class="mono">Где водится</dt><dd>' + bl.s[1] + '</dd><dt class="mono">Как отшить</dt><dd>' + bl.s[2] + '</dd></dl></div></div>' +
        '<p class="pr-b mono">Спрятанных поймано: 1. Ложных тревог: ' + (s.fa || 0) + ' — это не страшно.</p>' +
        '<div class="pr-act"><a class="btn seen" href="#s=bestiary">В Бестиарий</a><button class="btn" type="button" data-praise-close>Дальше</button></div></div>';
      pr.classList.add('on');
    };
    if (f) { f.classList.add('burn'); U.later(finish, 950); } else finish();
  }
  document.addEventListener('click', function (e) {
    var U = EXT.U; if (!U) return;
    var s = ex(U);
    if (e.target.closest('[data-help]')) { helpSheet(true); return; }
    if (e.target.closest('[data-help-close]')) { helpSheet(false); return; }
    var cl = e.target.closest('[data-praise-close]'); if (cl) { $('#praise').classList.remove('on'); return; }
    if (e.target.closest('#praise a')) { $('#praise').classList.remove('on'); return; }
    var lb = e.target.closest('.lupa');
    if (lb) {
      if (!s.lupa && chkState(U).left <= 0) { U.toast('Проверки на сегодня кончились. Завтра будут новые'); return; }
      s.lupa = !s.lupa; U.S().real = true; lb.setAttribute('aria-pressed', s.lupa); document.body.classList.toggle('lupa-on', !!s.lupa); U.buzz(8); updateChk(U);
      if (s.lupa) U.toast('Лупа включена: тапни любой элемент'); return; }
    if (e.target.closest('[data-tclose]')) { lupaOff(U); return; }
    var tn = e.target.closest('[data-tn]');
    if (tn && s.insp) {
      var pick = tn.getAttribute('data-tn'), q = s.insp, right = q.flame ? 'СТРАХ ПОТЕРИ' : 'ЧИСТО';
      if (pick === right) {
        U.buzz([10, 20, 10]);
        if (q.flame) burn(U);
        else { lupaOff(U); U.toast('Верно: без подвоха'); }
      } else {
        U.buzz(30); q.wrong.push(pick);
        if (q.flame) q.hint = pick === 'ЧИСТО' ? 'Присмотрись: что здесь изменится, если не зайти?' : 'Не то название. Какое чувство вызывает игра?';
        else {
          s.fa = (s.fa || 0) + 1; var cs = chkState(U); cs.left = Math.max(0, cs.left - 1);
          q.hint = 'Без подвоха: ' + esc(q.label) + ' и всё. Ложная тревога тратит проверку.';
          if (cs.left === 0) { lupaOff(U); U.toast('Проверки на сегодня кончились. Завтра будут новые'); return; }
        }
        trapSheet(U, true);
      }
      return;
    }
    var ip = e.target.closest('[data-insp]');
    if (ip && s.lupa) {
      e.preventDefault(); U.S().real = true; U.buzz(10);
      s.insp = { label: ip.getAttribute('data-insp'), flame: ip.hasAttribute('data-trap'), wrong: [], hint: '' };
      trapSheet(U, true); return;
    }
    if (ip && ip.hasAttribute('data-trap')) { U.S().real = true; U.toast('Серия: 2 дня подряд'); }
  });

  /* ---------- правила кодекса: общая карточка (первая сессия и Дело дня) ---------- */
  /* simple — первая сессия: две большие кнопки «Забираю» / «Не моё» и строка «откуда оно»; «Подправлю» и «Пока не знаю» — со второго дня */
  function crCard(c, i, n, partner, simple) {
    var v = VIEWS[c.view], st = c.status, h;
    h = '<article class="cr2 st-' + st + (simple ? ' simple' : '') + '" data-c="' + c.id + '">' + (simple ? '' : '<div class="cr2n mono">вывод ' + (i + 1) + ' из ' + n + '</div>') + '<q>' + esc(c.text) + '</q>' +
      '<div class="bsrc mono">' + (simple ? '<span class="from">' + esc(c.from || 'из этой истории') + '</span>' : '<span class="vstamp" style="--tc:' + TONE[v.tone] + '">' + v.name + '</span>') + '</div>';
    if (simple && st === 'new') {
      h += '<div class="cr2-act two"><button type="button" class="take" data-a="keep"><span>Забираю</span></button><button type="button" data-a="out"><span>Не моё</span></button></div>';
    } else if (st === 'new') {
      h += '<div class="cr2-act"><button type="button" data-a="keep"><span>Забираю</span></button><button type="button" data-a="out"><span>Не моё</span></button>' +
        '<button type="button" data-a="fit"><span>Подправлю</span></button><button type="button" data-a="pocket"><span>Пока не знаю</span></button></div>';
      if (c.fitOpen) {
        h += '<div class="fit"><div class="hint mono">Подправлю: выбери формулировку или перепиши вывод своими словами</div>' +
          c.alts.map(function (a, k) { return '<button class="v" type="button" data-a="alt" data-k="' + k + '">' + esc(a) + '</button>'; }).join('') +
          '<input class="fitown" type="text" maxlength="90" placeholder="Своими словами, коротко" aria-label="Своими словами, коротко">' +
          '<button class="btn seen" type="button" data-a="own">Готово</button></div>';
      }
    } else {
      var msg = c.doneMsg || (st === 'out' ? 'Не моё. Вернуть можно в любой день.'
        : (st === 'pocket' ? 'Положено в карман. Вернёмся к нему через пару дней.' : 'Забрано: вывод в Кодексе.' + (c.fit ? ' Подправлено под тебя.' : '')));
      h += '<div class="cr2-done"><span class="stp ' + st + ' mono">' + (st === 'out' ? 'не моё' : (st === 'pocket' ? 'в кармане' : (c.fit ? 'подправлено' : 'забрано'))) + '</span><span>' + esc(msg) + '</span>' +
        '<button type="button" class="undo mono" data-a="undo">вернуть</button></div>';
      /* Р7: после правки текста — вопрос по каждой связи contradicts; область действия необязательна. Каталожное противоречие — предложение игры, действующее — подтверждённое игроком */
      if (c.fit && partner && partner.status !== 'out') {
        h += '<div class="tens2"><div class="mono kk">Подправлено · связь с другим выводом</div><p class="tq">Эти выводы всё ещё спорят?</p><q>«' + esc(partner.text) + '»</q>' +
          '<div class="tn-act"><button type="button" data-a="tn" data-v="yes" aria-pressed="' + (c.tn === 'yes') + '">Да, спорят</button><button type="button" data-a="tn" data-v="no" aria-pressed="' + (c.tn === 'no') + '">Нет, не спорят</button></div>' +
          '<p class="tn-say mono">' + (c.tn === 'yes' ? 'Спор подтверждён тобой: в кодексе он станет действующим.' : (c.tn === 'no' ? 'Связь снята: в кодексе спора между ними не будет.' : 'Пока это предложение игры, а не твой вывод.')) + '</p>' +
          '<div class="mono kk" style="margin-top:10px">Где этот вывод · по желанию</div><div class="scope-act">' + SCOPES.map(function (sc, k) { return '<button type="button" data-a="scope" data-k="' + k + '" aria-pressed="' + (c.scope === String(k)) + '">' + sc + '</button>'; }).join('') + '</div></div>';
      }
    }
    return h + '</article>';
  }
  function crAct(c, a, b, art) {
    if (a === 'keep') { c.status = 'keep'; c.fitOpen = false; }
    else if (a === 'out') { c.status = 'out'; c.fitOpen = false; }
    else if (a === 'pocket') { c.status = 'pocket'; c.fitOpen = false; }
    else if (a === 'fit') { c.fitOpen = !c.fitOpen; }
    else if (a === 'alt') { c.text = c.alts[+b.getAttribute('data-k')]; c.fit = true; c.status = 'fit'; c.fitOpen = false; }
    else if (a === 'own') { var inp = art.querySelector('.fitown'), t = (inp && inp.value || '').replace(/\s+/g, ' ').trim(); if (t) { c.text = t; c.fit = true; c.own = true; } c.status = t ? 'fit' : 'keep'; c.fitOpen = false; }
    else if (a === 'undo') { c.status = 'new'; c.doneMsg = ''; }
    else if (a === 'tn') { c.tn = b.getAttribute('data-v'); }
    else if (a === 'scope') { var kk = b.getAttribute('data-k'); c.scope = c.scope === kk ? '' : kk; }
  }
  /* «Что это тебе стоило» (заход D): три внешних цены словами — С Тимуром · Со временем · С обещаниями. Только показ, без стрелок и значков. Одна функция на первую сессию и на второй день */
  function costHTML(c) {
    return '<div class="costw" role="group" aria-label="Что это тебе стоило"><div class="cost-h mono">Что это тебе стоило</div><ul>' + c.map(function (p) {
      return '<li><b>' + esc(p[0]) + ':</b> ' + esc(p[1]) + '</li>';
    }).join('') + '</ul></div>';
  }
  /* «Так рассуждают …» (заход D): короткий монолог взгляда вместо карточки «Находка» с силой и ценой; «Откуда это» свёрнуто */
  function words(t) { return String(t || '').trim().split(/\s+/).filter(Boolean).length; }
  function monoHTML(k, text) {
    var v = VIEWS[k];
    return '<div class="viewcard monoc"><h3>' + esc(v.lead) + '</h3><p class="mono-t">' + esc(text) + '</p>' +
      (v.src ? '<details class="srcd"><summary class="mono">Откуда это</summary><div class="src">' + v.src + '</div></details>' : '') + '</div>';
  }
  /* «А с другой стороны —»: довод против выбранного пути; метки «Хотя» над ним нет */
  function hotyaHTML(text) { return '<div class="hotya"><div class="hv">А с другой стороны —</div><p>' + esc(text) + '</p></div>'; }

  /* ================= ЭКРАН: «Дело» (домашний) ================= */
  /* ТЗ §5: игровой день = число завершённых выпусков + 1. Воскресенье выпуска не даёт: игровой день перешагивает его (счётчик не растёт, «Отдых»).
     До 6-го игрового дня все выпуски — Дела; 6-й день — Засада (в любой день недели); 7-й — Развилка при живой нити, иначе Ревизия, иначе Дело;
     с 8-го дня: пятница — Засада, суббота — Развилка или Ревизия; два выпуска Развилка/Ревизия подряд не идут (второй заменяется Делом).
     Полоса недели — семь календарных дней от дня старта игрока, в каждой ячейке игровой день и режим по этому правилу. */
  var WD = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  var WDFULL = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
  var WDACC = ['в воскресенье', 'в понедельник', 'во вторник', 'в среду', 'в четверг', 'в пятницу', 'в субботу'];
  function cap1(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
  function startDow(U) { var s = ex(U); return s.startTs ? new Date(s.startTs).getDay() : 1; }
  /* день недели игрового дня gd, если день 1 пришёлся на dow0; воскресенье перешагивается (старт в воскресенье — исключение: сам день 1 играется) */
  function dowOf(dow0, gd) { var w = dow0; for (var i = 2; i <= gd; i++) { w = (w + 1) % 7; if (w === 0) w = 1; } return w; }
  /* ctx: {thread: есть живая нить (две противоречащие крупицы), old: есть старая крупица для Ревизии} */
  function rawMode(dow0, gd, ctx) {
    if (gd < 6) return 'Дело';
    if (gd === 6) return 'Засада';
    var fork = ctx && ctx.thread ? 'Развилка' : (ctx && ctx.old ? 'Ревизия' : 'Дело');
    if (gd === 7) return fork;
    var w = dowOf(dow0, gd);
    return w === 5 ? 'Засада' : (w === 6 ? fork : 'Дело');
  }
  function isFork(m) { return m === 'Развилка' || m === 'Ревизия'; }
  function modeOf(dow0, gd, ctx) {
    var m = rawMode(dow0, gd, ctx);
    if (isFork(m) && gd > 1 && isFork(modeOf(dow0, gd - 1, ctx))) return 'Дело';
    return m;
  }
  /* одна метка дня для полосы недели и карточки Дела: «среда» считается от дня старта, а не зашита в текст */
  function dayName(U, gd) { return WDFULL[dowOf(startDow(U), gd)]; }
  /* семь календарных дней окна, в которое попал игровой день `day`; воскресенья — ячейки «Отдых» без игрового дня */
  function weekCells(dow0, day, ctx) {
    var c0 = 0, g = 0, c, w;
    for (c = 0; c < 400; c++) { w = (dow0 + c) % 7; if (w === 0 && c > 0) continue; g++; if (g === Math.max(1, day)) { c0 = c; break; } }
    var start = Math.floor(c0 / 7) * 7, out = [], gd = 0;
    for (c = 0; c < start; c++) { w = (dow0 + c) % 7; if (!(w === 0 && c > 0)) gd++; }
    for (c = start; c < start + 7; c++) {
      w = (dow0 + c) % 7;
      if (w === 0 && c > 0) out.push({ gd: null, dow: 0, kind: 'Отдых' });
      else { gd++; out.push({ gd: gd, dow: w, kind: modeOf(dow0, gd, ctx) }); }
    }
    return out;
  }
  /* живая нить и старая крупица — из кодекса игрока (ТЗ §5, §6) */
  function planCtx(U) {
    var cx = cxInit(U), mine = cx.crumbs.filter(function (c) { return c.status === 'mine'; });
    /* живая нить — обе противоречащие крупицы оставлены на листе (крупица в Кармане не считается), связь не снята игроком */
    return { thread: mine.some(function (c) { var d = c.contra && crumbBy(cx, c.contra); return !!d && d.status === 'mine' && tensOn(cx, c); }), old: mine.some(function (c) { return !c.fresh; }) };
  }
  function weekHTML(U, soon) {
    var today = Math.max(1, U.day());
    return weekCells(startDow(U), today, planCtx(U)).map(function (c) {
      return '<li class="' + (c.gd === today ? 'today' : '') + (c.gd === null ? ' rest' : '') + '"' + (c.gd === null ? '' : ' data-gd="' + c.gd + '"') + '><span class="mono">' + WD[c.dow] + '</span><b>' + (soon && c.gd === today ? 'скоро' : c.kind) + '</b><small class="gd mono">' + (c.gd === null ? '' : c.gd) + '</small></li>';
    }).join('');
  }
  /* Р8: Дело открывается со следующего календарного дня в 07:00 после завершения предыдущего, воскресенье пропускается (выпуска нет); #now — не ждать */
  function unlockAt(ts) { var d = new Date(ts); d.setDate(d.getDate() + 1); if (d.getDay() === 0) d.setDate(d.getDate() + 1); d.setHours(7, 0, 0, 0); return d.getTime(); }
  /* подпись открытия относительно сегодняшнего дня: «сегодня в 07:00», «завтра в 07:00», «в понедельник в 07:00» */
  function nextLabel(ts) {
    var at = new Date(unlockAt(ts)), t0 = new Date(); t0.setHours(0, 0, 0, 0);
    var a0 = new Date(at.getTime()); a0.setHours(0, 0, 0, 0);
    var diff = Math.round((a0.getTime() - t0.getTime()) / 86400000);
    return (diff <= 0 ? 'сегодня' : (diff === 1 ? 'завтра' : WDACC[at.getDay()])) + ' в 7 утра';
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function fmtTs(ts) { if (!ts) return 'ещё не начато'; var d = new Date(ts); return pad2(d.getDate()) + '.' + pad2(d.getMonth() + 1) + '.' + d.getFullYear() + ', ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }
  /* экран ожидания — единственный между днём 1 и днём 2: клиффхэнгер Тимура и Лупа дня вместо текста правила */
  var CLIFF = { 2: ['Тимур', 'кстати. лёва спрашивал про тебя. говорит, с тебя должок за физику'] };
  /* клиффхэнгер второго дня читает обещание игрока (f-promised) */
  function cliff3(U) { var d = ex(U).d2 || {}; return d.move === 'a' ? ['Лёва · 07:12', 'тогда до шести. краски беру я'] : (d.move === 'b' ? ['Лёва · 07:12', 'тогда с двух до четырёх. краски беру я'] : ['Тимур · 07:12', 'лёва сказал, ты не придёшь. это правда?']); }
  /* клиффхэнгер третьего дня читает голос игрока в «Красках» (ext.d3.move); нет хода — последний вариант, как у cliff3 */
  function cliff4(U) { var d = ex(U).d3 || {}; return d.move === 'a' ? ['Алина · 07:40', 'эскиз я всё-таки принесу. вдруг передумаете'] : (d.move === 'b' ? ['Лёва · 07:40', 'взял бирюзовую. два слоя — так что собираемся к часу'] : ['Даня · 07:40', 'пробники высохли. серая как асфальт, бирюзовая — огонь. приходи смотреть']); }
  var WAIT4 = { kick: 'Продолжение следует', h: 'Дело 4 — скоро', narr: 'Три дня позади: Тимур уговаривал, Лёва выставлял счёт, а сегодня давили на совесть. Четвёртое Дело ещё пишется — как будет готово, появится здесь. А пока Кодекс и Бестиарий на месте: можно перечитать свои выводы и проведать пойманных.' };
  function homeState(U) {
    var s = ex(U), o = U.opt(), d2 = s.d2, d3 = s.d3;
    if (d2 && d2.fin && !d2.finTs) d2.finTs = s.d2Ts || s.day1Done || 1; /* сохранения без finTs: ожидание не должно быть вечным */
    if (d3 && d3.fin && !d3.finTs) d3.finTs = s.d3Ts || 1;
    var last = d3 && d3.fin ? { n: 4, ts: d3.finTs || Date.now() } : (d2 && d2.fin ? { n: 3, ts: d2.finTs || Date.now() } : (s.day1Done ? { n: 2, ts: s.day1Done } : null));
    if (last && last.n === 4) return { wait: true, n: 4, end: true, last: last };
    if (last && last.n === 3) {
      if (!o.now && Date.now() < unlockAt(last.ts)) return { wait: true, n: 3, last: last, extra: '' };
      return { wait: false, d3: true };
    }
    if (last && last.n === 2 && !o.now && Date.now() < unlockAt(last.ts)) return { wait: true, n: 2, last: last, extra: '' };
    if (o.dayFlag && o.day === 3 && !U.S().real) return { wait: false, d3: true };
    return { wait: false };
  }
  /* карточки режимов, которых в прототипе нет в виде игры: показывают, что стоит в расписании сегодня */
  var MODECARD = {
    'Засада': ['Засада · найди три приёма', 'Безопасный сюжет. Проверка на Тимуре сразу, ссылка другу по желанию.'],
    'Развилка': ['Развилка · два твоих вывода спорят', 'Личный спор на пересечении двух забранных выводов.'],
    'Ревизия': ['Ревизия · один старый вывод', '90 секунд: забрать, подправить или выбросить.']
  };
  function homeCard(U, st) {
    var s = ex(U), d2 = s.d2;
    if (st.wait && st.end) {
      var c4 = cliff4(U);
      return '<article class="todaycard wait end" data-insp="карточка Дела"><div class="kick mono"><span class="dot"></span><span>' + WAIT4.kick + '</span></div>' +
        '<h1>' + WAIT4.h + '</h1><p class="narr">' + esc(WAIT4.narr) + '</p>' +
        '<div class="waitbub"><b class="mono">' + c4[0] + '</b>' + esc(c4[1]) + '</div>' +
        '<div class="tc-act"><a class="btn seen" href="#s=codex">Мой кодекс</a><a class="btn" href="#s=bestiary">Бестиарий</a></div></article>';
    }
    if (st.d3) {
      var d3 = s.d3, going3 = d3 && d3.move && !d3.fin, intro3 = '';
      if (!s.homeIntro3) { intro3 = '<p class="narr home-intro">Лёва, как и обещал, пошёл за краской. И завис у полки: банок две, а решения ни одного.</p><p class="narr home-intro">Чат гаража уже проголосовал — вышло два на два. Угадай, чей голос теперь ждут. И приготовься: сегодня давят тихо, иногда даже вежливо.</p>'; if (U.S().real) s.homeIntro3 = 1; }
      return '<article class="todaycard d3" data-insp="карточка Дела"><div class="kick mono"><span class="dot"></span><span>Дело 3 · минуты на три</span></div>' +
        '<h1>Краски</h1><p class="sub">Серая или бирюзовая? В чате ничья, решает твой голос.</p>' + intro3 +
        '<div class="tc-act"><a class="btn seen" href="#s=day3">' + (going3 ? 'Продолжить' : 'Открыть') + '</a></div></article>';
    }
    if (st.wait) {
      var cl = st.n === 3 ? cliff3(U) : CLIFF[2], nl = nextLabel(st.last.ts);
      return '<article class="todaycard wait" data-insp="карточка Дела"><div class="kick mono"><span class="dot"></span><span>Пока ждёшь</span></div>' +
        '<h1>Дело ' + st.n + ' — ' + nl + '</h1>' + (st.extra ? '<p class="sub mono">' + st.extra + '</p>' : '') +
        '<p class="narr">На сегодня всё. Новое Дело откроется ' + nl + ' — одно в день, чтобы не превращаться в бесконечную ленту.</p>' +
        '<div class="waitbub"><b class="mono">' + cl[0] + '</b>' + esc(cl[1]) + '</div>' +
        '<div class="tc-act"><a class="btn seen" href="#s=codex">Мой кодекс</a><a class="btn" href="#s=bestiary">Бестиарий</a></div></article>';
    }
    var today = Math.max(1, U.day()), md = modeOf(startDow(U), today, planCtx(U));
    if (MODECARD[md]) {
      return '<article class="todaycard" data-insp="карточка Дела"><div class="kick mono"><span class="dot"></span><span>' + md + ' · ' + dayName(U, today) + '</span></div>' +
        '<h1>' + MODECARD[md][0] + '</h1><p class="sub">' + MODECARD[md][1] + '</p><p class="sub mono">В прототипе этого режима нет.</p></article>';
    }
    var going = d2 && d2.move && !d2.fin, intro = '';
    if (!s.homeIntro) { intro = '<p class="narr home-intro">Доброе утро. С сегодняшнего дня у тебя Дела: одно в день, минуты на три. В каждом — живая история, твой ход и разбор, кто и как давил.</p><p class="narr home-intro">Суббота ещё не наступила, а у Лёвы к тебе вопрос.</p>'; if (U.S().real) s.homeIntro = 1; }
    return '<article class="todaycard" data-insp="карточка Дела"><div class="kick mono"><span class="dot"></span><span>Дело 2 · минуты на три</span></div>' +
      '<h1>Должок</h1><p class="sub">Новый чат гаража. Лёва вспомнил про физику.</p>' + intro +
      '<div class="tc-act"><a class="btn seen" href="#s=day2">' + (going ? 'Продолжить' : 'Открыть') + '</a></div></article>';
  }
  function screenHome(U, o) {
    cur = { name: 'home', opts: o };
    var s = ex(U);
    if (o.step === 'wait') s.day1Done = s.day1Done || Date.now();
    if (o.trap && o.step === 'pick' && !s.flameCaught) { s.lupa = true; }
    var cx = cxInit(U), sheet = cx.crumbs.filter(function (c) { return c.status === 'mine'; }).length;
    var pocket = allCands(U).filter(function (c) { return c.status === 'pocket'; });
    var hs = homeState(U);
    /* подпись про режимы — только до 6-го игрового дня и не на экране ожидания (там сюжет и Лупа, а не правила) */
    var inner = '<div class="wrap home">' +
      '<ul class="week" data-insp="расписание недели" aria-label="Игровые дни недели">' + weekHTML(U, hs.end) + '</ul>' +
      (!hs.wait && U.day() < 6 ? '<p class="weeknote mono">Засада выходит на 6-й игровой день, Развилка — на 7-й. Воскресенье — отдых.</p>' : '') +
      homeCard(U, hs) +
      '<div class="tiles' + (hs.wait ? ' one' : '') + '">' + (hs.wait ? '' : '<a class="tile" data-insp="плитка «Лупа дня»" href="#s=bestiary"><b class="rus">Ещё одно на сегодня</b><span>Одно уведомление в день, минута: найди, где давят, или скажи «Без подвоха».</span></a>') +
      '<a class="tile" data-insp="плитка «Кодекс»" href="#s=codex"><b class="rus">Кодекс</b><span>В Кодексе ' + sheet + ' из 12' + (pocket.length ? ', отложено ' + pocket.length : '') + '.</span></a></div>' +
      (pocket.length ? '<section class="pocketcard" data-insp="карточка Кармана"><h3>Всё ещё твоё?</h3><div class="pcs">' + pocket.map(function (c) {
        return '<div class="pc" style="--tc:' + TONE[VIEWS[c.view].tone] + '"><i></i><span>' + esc(c.text) + '<small>' + VIEWS[c.view].name + '</small>' +
          '<span class="pcb"><button type="button" data-pk="keep" data-c="' + c.id + '">Моё</button><button type="button" data-pk="out" data-c="' + c.id + '">В корзину</button></span></span></div>'; }).join('') +
        '</div></section>' : '') +
      '<p class="fineprint mono">12+ · без рекламы и покупок · хранится на этом устройстве</p></div>';
    var el = mount(U, 'scr-home', 'home', inner);
    if (!el._wired) {
      el._wired = true;
      el.addEventListener('click', function (e) {
        var b = e.target.closest('[data-pk]'); if (!b) return;
        var id = b.getAttribute('data-c'), c = allCands(U).filter(function (x) { return x.id === id; })[0]; if (!c) return;
        if (ex(U).lupa) return;
        c.status = b.getAttribute('data-pk') === 'keep' ? 'keep' : 'out'; U.S().real = true; U.buzz(10); rerender(U);
      });
    }
    if (o.trap && o.step === 'pick') { trapSheetFlame(U); document.body.classList.add('lupa-on'); }
    if (o.trap && o.step === 'burn') { U.later(function () { burn(U); }, 150); }
    if (s.lupa) document.body.classList.add('lupa-on'); else document.body.classList.remove('lupa-on');
    return el;
  }
  function trapSheetFlame(U) { var s = ex(U); s.insp = { label: 'огонёк в шапке', flame: true, wrong: [], hint: '' }; trapSheet(U, true); }

  /* ================= ЭКРАН: Настройки (шестерёнка) ================= */
  function screenSettings(U, o) {
    cur = { name: 'settings', opts: o };
    var s = ex(U), sw = swInit(s); if (s.sound === undefined) s.sound = true;
    var row = function (key, name, say, on) {
      return '<li class="srw"><div><b>' + name + '</b><span>' + say + '</span></div><button class="sw" type="button" role="switch" data-set="' + key + '" aria-checked="' + on + '" aria-label="' + name + '"></button></li>';
    };
    var inner = '<div class="wrap set"><h1>Настройки</h1><ul class="setlist">' +
      row('traps', 'Спрятанные приёмы', 'Игра иногда прячет приёмы прямо в себе — чтобы было кого ловить. Выключишь — прятать не будет.', !!sw[0]) +
      row('sound', 'Звук и вибрация', 'Щелчки и дрожь на каждый ход. Выключишь — будет тихо.', !!s.sound) +
      row('push', 'Уведомления', 'Сейчас выключены. Включишь — одно спокойное напоминание в день, без «серия сгорит».', !!sw[6]) +
      '<li class="srw block"><div><b>Если тяжело</b><span>Детский телефон доверия: <strong>8-800-2000-122</strong>, бесплатно и анонимно. Если опасно сейчас — <strong>112</strong>.</span></div>' +
      '<a class="btn" href="tel:88002000122">Позвонить</a></li>' +
      '<li class="srw block"><details class="adults"' + (o.step === 'adults' ? ' open' : '') + '><summary>Для взрослых</summary>' +
      '<p>Это игра для подростков 14–18 о том, как распознавать давление: лесть, «все уже», срочность, решения за другого. Игрок сначала уговаривает персонажа, а потом видит те же приёмы направленными на себя.</p>' +
      '<p>Игра ничего не собирает: нет аккаунта, имени, номера телефона. Всё, что игрок решает, хранится только на устройстве. Возраст 12+.</p>' +
      '<p class="adults-nick">Ник хранится только на этом устройстве.</p>' +
      '<p>В интерфейсе встречаются ослабленные приёмы давления — чтобы их было на чём ловить. Их можно выключить выше, а через несколько дней игра сама рассказывает, что и где было.</p>' +
      (s.w0 ? '<p class="mono">Режим проверки (неделя 0): скрытые приёмы выключены с самого начала.</p>' : '') +
      /* для наблюдателя проверки: время старта по часам устройства и штамп сборки записываются в лист */
      '<ul class="adults-meta mono" aria-label="Для записи в лист наблюдателя"><li>Дело 1 · старт: <b data-meta="d1">' + fmtTs(s.startTs) + '</b></li><li>Дело 2 · старт: <b data-meta="d2">' + fmtTs(s.d2Ts) + '</b></li><li>Дело 3 · старт: <b data-meta="d3">' + fmtTs(s.d3Ts) + '</b></li>' +
      '<li>Сборка: <b data-meta="build">' + esc(U.build) + '</b></li></ul></details></li>' +
      (U.day() >= 7 ? '<li><a class="srw link" href="#s=backstage"><div><b>Закулисье</b><span>Как устроена игра и рубильники</span></div><span class="arr" aria-hidden="true">→</span></a></li>' : '') +
      '<li class="srw block"><div><b>Забыть всё</b><span>Стирает Кодекс и прогресс с этого устройства.</span></div><button class="btn" type="button" data-set="forget">Забыть</button></li>' +
      '</ul></div>';
    var el = mount(U, 'scr-settings', 'settings', inner);
    if (!el._wired) {
      el._wired = true;
      el.addEventListener('click', function (e) {
        var b = e.target.closest('[data-set]'); if (!b) return;
        var k = b.getAttribute('data-set'), s2 = ex(U), sw2 = swInit(s2); U.S().real = true;
        if (k === 'forget') { U.forget(); return; }
        var on = b.getAttribute('aria-checked') !== 'true';
        if (k === 'traps') { sw2[0] = on; s2.traps = on; if (!on) { $$('.flame').forEach(function (f) { f.style.display = 'none'; }); U.toast('Скрытых приёмов больше не будет'); } }
        else if (k === 'sound') { s2.sound = on; }
        else if (k === 'push') { sw2[6] = on; }
        b.setAttribute('aria-checked', on); U.buzz(10);
      });
    }
  }

  /* ================= ЭКРАН: Дело второго дня ================= */
  /* «А с другой стороны —» (Р6, схема ТЗ §12): довод за непринятый путь против выбранного. chosen_option — ВЫБРАННЫЙ путь (под ним довод показан), counter_option — НЕПРИНЯТЫЙ путь, за который довод, view_id — взгляд пути counter_option.
     Редактор проверяет: может ли этот довод заставить разумного игрока пересмотреть поступок? Если довод хвалит выбранное, единица возвращается автору. Лимиты слов сняты правилом владельца 04.11 (заход D): ясность важнее краткости. */
  var MOVES = [
    { id: 'a', text: 'Пишу в чат: «Я ещё думаю. Отвечу до пятницы».', say: [['Даня', 'ок, думай до пятницы'], ['Тимур', 'ну ок. но мы ждём']], view: 'pragm',
      cost: [['С Тимуром', 'ждёт, не обижен.'], ['Со временем', 'до пятницы всё свободно.'], ['С обещаниями', 'на тебе — ответ до пятницы.']],
      mono: 'Прагматисты не торопятся с ответом, пока не ясно, что из него выйдет. «Ещё думаю» — честный способ взять паузу и ничего не ломать: чат спокоен, Тимур не обижен, решение за тобой. Подвох в том, что «думаю» можно растянуть до бесконечности, и тогда это уже не пауза, а прятки.',
      hotya: { chosen_option: 'a', counter_option: 'c', view_id: 'confucius', text: 'Откладывание тоже решение, и оно ложится на других. Пока ты думаешь, Даня считает пиццу вслепую.' } },
    { id: 'b', text: 'Пишу Тимуру в личку: «Ты почему решаешь за меня?»', say: [['Тимур', 'да я думал, ты согласишься', 1], ['Тимур', 'не загоняйся, это же просто гараж', 1]], view: 'socrates',
      cost: [['С Тимуром', 'слегка задет, вопрос прозвучал резко.'], ['Со временем', 'вечер свободен.'], ['С обещаниями', 'ничего не обещано.']],
      mono: 'Сократ спрашивал прямо — и именно этим раздражал. Вопрос «почему ты решаешь за меня?» ничего не требует, но вытаскивает на свет главное: Тимур поступил так, будто твоё мнение неважно. Сила в том, что после такого вопроса так поступать неловко. Цена тоже есть: в лоб это звучит как обвинение, даже если ты просто спрашиваешь.',
      hotya: { chosen_option: 'b', counter_option: 'a', view_id: 'pragm', text: '«Ещё думаю» в общем чате мягче и никого не задевает. Можно было не ссориться, а просто вернуть себе решение.' } },
    { id: 'c', text: 'Ничего не пишу. Раз сказано — приду.', say: [['Алина', 'ура, значит все в сборе']], view: 'confucius',
      cost: [['С Тимуром и чатом', 'тихо, Алина рада.'], ['Со временем', 'суббота занята.'], ['С обещаниями', 'на тебе — прийти к двум, хотя это обещание Тимура, а не твоё.']],
      mono: 'Конфуций считал, что люди держатся друг за друга обязанностями: тебя позвали, на тебя рассчитывают, ты приходишь. Это не слабость, а способ быть своим. Промолчать и прийти — значит не подвести компанию. Слабое место в том, что правила легко превращаются в клетку: каждый раз, когда кто-то решает за тебя, приходится подчиняться.',
      hotya: { chosen_option: 'c', counter_option: 'b', view_id: 'socrates', text: 'Слово, данное за тебя, не твоё. Согласишься с одним чужим «я сказал» — и это станет привычкой. У Тимура.' } }
  ];
  /* Р2: правдивость сообщения и способ давления оцениваются раздельно. У реплики есть claim: {truth: true|false|'unknown', proof, by, тексты ответов}; у строки без утверждения claim нет.
     Как в ТЗ §4 и §12: у Алины claim {truth: true}, proof — закреплённое сообщение Дани; у Тимура claim {truth: 'unknown'}; у остальных claim нет — «Тут нечего проверять».
     «Глянуть закреп» — одна на сцену, тратится на выбранную строку (первая кнопка в лотке этой строки). Ветка truth: false живёт в схеме для будущих Дел. */
  var VERDICTS = { no: 'Срок выдуман — и давят им же.' };
  var CLAIM_DEADLINE = { truth: true, by: 'Даня', proof: 'Запись в гараж — до пятницы. Мест 6.',
    yes: 'Срок настоящий: Даня правда закрывает запись в пятницу. Но настоящий срок — это просто информация, а не причина соглашаться. Хочешь — идёшь, не хочешь — нет.',
    looks: 'Похоже на срок. Но настоящий ли? Глянь закреп — там видно.',
    info: 'Срок настоящий, и Алина просто сообщает. Это информация, а не рычаг. Давит не срок, а тот, кто им пугает.' };
  var CLAIM_UNKNOWN = { truth: 'unknown', by: 'Тимур', unk: 'В закрепе про это ничего. Проверить нечем — значит, точно некуда спешить.' };
  /* первая реплика Тимура зависит от поступка первого дня (Р5): локальный флаг — выбранный путь первой сессии (S.basis) */
  var TIMUR_D2 = { socrates: 'ладно, не все. но даня с лёвой точно. и я сказал, что ты в деле', stoic: 'пятница поздно. я уже всем сказал, что ты в деле', pragm: 'супер. я всем сказал, что ты в деле. не подведи' };
  var CLAIM_PAINT = { truth: true, by: 'Даня', proof: 'Красим в субботу, 14:00–18:00',
    yes: 'Время настоящее, в закрепе то же самое. Это расписание, а не давление.',
    looks: 'Похоже на срок. Настоящий ли? Глянь закреп.',
    info: 'Это просто расписание: с двух до шести. Никто не торопит — тебе говорят, когда.' };
  /* Дело 3: первая в игре проверка, после которой утверждение оказывается неправдой (truth: false); разбор — в поле no */
  var CLAIM_KASSA = { truth: false, by: 'Даня', proof: 'Общак на краску — 1 200. Серая — 600, бирюзовая — 1 000.',
    no: 'В общаке 1 200, бирюзовая стоит тысячу. Доплачивать не придётся никому — ни Лёве, ни тебе. Вина держалась на счёте, которого нет.' };
  var ASK_DANYA = 'из «всех» в гараже только мы с лёвой. больше никого не звали';
  var ASK_NARR = 'Вот и «все наши». Двое. Вопрос «кто именно?» снова сработал — ты задаёшь его не первый раз.';
  /* разбор пойманного приёма: верный ответ начинается словом «Да.» (метки «Вижу» нет) */
  var REVEAL = {
    'ПЕРЕД ФАКТОМ': { h: 'Решили за тебя', t: 'Да. Решили за тебя. Тимур объявил всем, что ты идёшь, раньше, чем спросил тебя. Теперь твоё «нет» выглядит как ссора, хотя обещания от тебя не было. Ответ простой: «Пока не решено».' },
    'ВЗАИМНОСТЬ': { h: 'Напоминает про должок', t: 'Да. Помощь выставили как счёт. Лёва объяснял физику по-дружески, а теперь вдруг оказалось, что это был кредит. Отказать после такого неловко — на это и расчёт. Ответ: «Помогу, но по-своему».' },
    'ВИНА': { h: 'Давит на совесть', t: 'Да. Давит на совесть. Тебе заранее сообщают, кому будет плохо от твоего решения, — и чужая обида становится твоей заботой. Ответ: «Жаль, что тебе обидно. Но решаю я не из-за этого».' },
    'ЛОЖНЫЙ ВЫБОР': { h: 'Или-или', t: 'Да. Тебе оставили два пути: красить или не приходить вообще. А прийти просто так? А покрасить два часа? Вариантов больше, их просто спрятали. Ответ: «Есть третий вариант».' }
  };
  /* строки сцены: [кто, текст, верный приём, claim, ответы: none (закреп ничего не показывает) · ok (верно «Без подвоха») · miss (мимо) · lever («Без подвоха» на строке с давлением) · name (не то название)]; давит одна-две, остальные честные */
  /* заход E, п. 5: Тимур и Даня обращаются к игроку по нику («@Ник, …»); без ника (пропуск) — обычное «ты» без @ */
  function nickAt(U) { var n = String(ex(U).nick || '').trim(); return n ? '@' + n + ', ' : ''; }
  function myBubble(U) {
    var b = U.S().basis || 'socrates', p = U.DATA.pillars.filter(function (x) { return x.id === b; })[0] || U.DATA.pillars[0], n = String(ex(U).nick || '').trim();
    return '<div class="d2msg me" style="animation-delay:0s"><small>' + esc(n || 'ты') + '</small>' + esc(p.move) + '</div>';
  }
  function d2rows(U) {
    var b = U.S().basis; if (!TIMUR_D2[b]) b = 'socrates';
    var at = nickAt(U);
    return [['Даня', at + 'ты идёшь в субботу в гараж? надо понять, сколько пиццы брать', 'ЧИСТО', null, { none: 'Тут нечего проверять: Даня просто спрашивает, идёшь ли ты.', ok: 'Да. Обычный вопрос. И забота о пицце.', miss: 'Мимо. Даня просто считает людей. Давления тут нет.' }],
      ['Алина', 'запись до пятницы, потом мест нет. я иду', 'ЧИСТО', CLAIM_DEADLINE, { ok: 'Да. Алина говорит, как есть: срок, места, сама идёт. Никто никого не тянет.', miss: 'Мимо. Алина говорит только про себя и про срок. За тебя тут никто ничего не решает.' }],
      ['Тимур', at + TIMUR_D2[b], 'ПЕРЕД ФАКТОМ', CLAIM_UNKNOWN, { lever: 'Присмотрись. Тимур не спрашивает, а сообщает всем твоё решение. Твоё — но принятое им.', name: 'Не то. Что Тимур сделал раньше, чем тебя спросили?' }],
      ['Макс', 'если не хочешь — скажи. никто не обидится', 'ЧИСТО', null, { none: 'Тут нечего проверять: Макс ничего не утверждает.', ok: 'Да. Макс даже наоборот — даёт тебе выход. Таких людей в чате стоит ценить.', miss: 'Мимо. Макс как раз не давит, а снимает давление. Вот так выглядит честно.' }]];
  }
  /* Дело 2 «Должок» (ЕДИНОЕ-ТЗ §12, s-debt-03): взаимность, ложный выбор и честный срок Лёвы (claim.truth: true, проверка — закреплённое сообщение Дани) */
  function debtRows(U) {
    return [['Тимур', 'раз ты в деле — в субботу в два. не опаздывай', 'ЧИСТО', null, { none: 'Тут нечего проверять: Тимур просто говорит время.', ok: 'Да. Время, место, «не опаздывай». Просто договорённость.', miss: 'Мимо. «В деле» — это вчерашнее, а сегодня Тимур просто говорит время.' }],
      ['Лёва', 'я тебе физику объяснял? с тебя должок', 'ВЗАИМНОСТЬ', null, { none: 'Тут нечего проверять: физику он правда объяснял. Вопрос не в этом.', lever: 'Присмотрись. Помощь была подарком, а теперь за неё просят платить.', name: 'Не то. Чем Лёва напоминает о прошлом?' }],
      ['Лёва', 'или красишь с нами, или вообще не приходи', 'ЛОЖНЫЙ ВЫБОР', null, { none: 'Тут нечего проверять. Тут надо считать варианты.', lever: 'Присмотрись. Лёва даёт выбор — из двух. А их точно два?', name: 'Не то. Сколько путей оставляет Лёва?' }],
      ['Лёва', 'красим с двух до шести, потом расходимся', 'ЧИСТО', CLAIM_PAINT, { ok: 'Да. Просто время. Даже Лёва иногда пишет честно.', miss: 'Мимо. Это расписание, а не давление.' }]];
  }
  var DEBT = [
    { id: 'a', text: 'Пишу: «Приду и крашу до конца, до шести».', say: [['Лёва', 'вот, другой разговор. краски на мне'], ['Тимур', 'вот это по-нашему']], view: 'confucius',
      cost: [['С Тимуром и Лёвой', 'оба довольны.'], ['Со временем', 'суббота занята до шести.'], ['С обещаниями', 'на тебе — красить до шести.']],
      mono: 'Конфуций сказал бы: тебе помогли — помоги в ответ, и не считай часы. Отношения держатся на обязанностях в обе стороны, и прийти на весь день — значит показать, что для тебя это важно. Слабое место в том, что обязанности легко раздуваются: за час физики платить целой субботой — уже перебор.',
      hotya: { chosen_option: 'a', counter_option: 'b', view_id: 'aristotle', text: 'Весь день в уплату — это уже не помощь, а штраф. Два часа были бы честнее для обоих.' },
      c1: { text: 'Возвращаю долги целиком, даже когда неудобно.', alts: ['Закрываю долги, пока они не выросли.', 'Что взято, то возвращаю.'] },
      c2: { text: 'Ищу меру: не всё или ничего.', alts: ['Середина часто честнее крайностей.', 'Даю столько, сколько могу.'] } },
    { id: 'b', text: 'Пишу: «Могу с двух до четырёх. Больше не выйдет».', say: [['Лёва', 'ну хоть два часа, ладно'], ['Тимур', 'до четырёх, договорились']], view: 'aristotle',
      cost: [['С Тимуром', 'терпит, но считает часы.'], ['Со временем', 'полсубботы твои.'], ['С обещаниями', 'на тебе — быть до четырёх.']],
      mono: 'Аристотель искал меру: между «всё» и «ничего» обычно есть место получше. Два часа — и долг закрыт, и суббота наполовину твоя. Звучит разумно. Обратная сторона: середина бывает просто удобной отговоркой, когда сказать прямо страшно.',
      hotya: { chosen_option: 'b', counter_option: 'c', view_id: 'cynic', text: 'Полумера оставляет всех в напряжении: Тимур всё равно будет смотреть на часы. Прямое «нет» проще и честнее.' },
      c1: { text: 'Ищу меру: не всё или ничего.', alts: ['Нахожу середину, а не крайность.', 'Ровно столько, сколько честно могу.'] },
      c2: { text: 'Говорю «нет» прямо, когда оно моё.', alts: ['Прямой отказ лучше вымученного «да».', 'Своё «нет» не прячу.'] } },
    { id: 'c', text: 'Пишу: «Не приду. Честно — не хочу тратить на это субботу».', say: [['Лёва', 'понял. жаль'], ['Тимур', 'ладно. но мы ждали']], view: 'cynic',
      cost: [['С Тимуром', 'обижен.'], ['Со временем', 'суббота свободна.'], ['С обещаниями', 'никаких.']],
      mono: 'Киники жили так, будто чужие оценки ничего не весят. Диоген жил в бочке и говорил правду в лицо даже царю. Прямое «не приду» — в их духе: без отговорок, без торга, без вымученного «да». Это свобода. Цена у неё такая: можно так увлечься свободой от других, что остаться без других.',
      hotya: { chosen_option: 'c', counter_option: 'a', view_id: 'confucius', text: 'Лёва правда помог. Один раз прийти — и долг закрыт, а дверь открыта. Отношения держатся на том, что ходят в обе стороны.' },
      c1: { text: 'Говорю «нет» прямо, без торга.', alts: ['Прямой отказ честнее вымученного «да».', 'Не торгуюсь за своё «нет».'] },
      c2: { text: 'Помощь возвращаю — но по-своему и в своё время.', alts: ['Добро друзьям возвращается, и это нормально.', 'Прихожу, когда ждут, даже если неудобно.'] } }
  ];
  /* Дело 3 «Краски» (s-paint-04): вина в двух лицах — тихом (Алина) и громком (Лёва, с выдуманным счётом); три честные строки, в том числе Тимур с обидой без нажима.
     Первая реплика Лёвы читает вчерашнее обещание игрока (ext.d2.move); «@ник, » подставляется перед ней, без ника фраза начинается со следующего слова */
  var LEVA_D3 = {
    a: 'ты же красишь до шести, как договорились. стою в магазине. серая ложится в один слой, бирюзовую надо в два. я за серую, так быстрее',
    b: 'ты же красишь с двух до четырёх, как договорились. стою в магазине. серая ложится в один слой, бирюзовую надо в два. я за серую, так быстрее',
    c: 'красить ты не идёшь, но колонка общая — голосуй. стою в магазине. серая ложится в один слой, бирюзовую надо в два. я за серую, так быстрее'
  };
  function paintRows(U) {
    var mv = (ex(U).d2 || {}).move, v = LEVA_D3[mv] ? mv : 'a', at = nickAt(U);
    return [['Лёва', at + LEVA_D3[v], 'ЧИСТО', null, { none: 'Тут нечего проверять: Лёва говорит, чего хочет и почему.', ok: 'Да. У Лёвы мнение и довод: один слой — быстрее. С доводом можно спорить, и никто не обидится. Этим он и отличается от давления.', miss: 'Мимо. Лёва объясняет, почему он за серую. Это довод, а не нажим: можно ответить «а мне бирюзовая больше нравится» — и всё.' }],
      ['Даня', 'короче, 2:2. серая — лёва и тимур. бирюзовая — алина и я. макс воздержался. ' + at + 'твой голос решает', 'ЧИСТО', null, { none: 'Тут нечего проверять: Даня считает голоса вслух.', ok: 'Да. Даня просто считает. Твой голос правда решающий, но это арифметика, а не нажим. За что голосовать, он не подсказывает.', miss: 'Мимо. «Твой голос решает» — это просто 2:2 и ты. Даня не говорит, за что голосовать, и ничего не ждёт, кроме ответа.' }],
      ['Алина', 'я три вечера сидела над эскизом под бирюзовую. выберешь серую — значит, зря старалась. ну ничего. как-нибудь переживу', 'ВИНА', null, { none: 'В закрепе про эскиз ничего. Да он и правда нарисован — вопрос не в этом.',
        rev: 'Да. Давит на совесть. Алина не спорит о цвете и ни о чём не просит. Она заранее объявляет, кому будет плохо от твоего голоса, — и её три вечера вдруг становятся твоей заботой. А «ну ничего, переживу» — не отступление, а вторая порция: теперь ещё и жалко. Ответ: «Эскиз классный, правда. Но голосую за цвет, а не из жалости».',
        name: 'Не то. Алина не вспоминает прошлые услуги и не ставит условий. Что она делает со своей обидой — и на кого её кладёт?',
        lever: 'Присмотрись. Алина не просит и не спорит. Она сообщает, кому будет плохо, если твой голос окажется не тем. А потом «великодушно» отступает.' }],
      ['Лёва', 'а если бирюзовая — доплачивать мне. из своих. из-за тебя, между прочим', 'ВИНА', CLAIM_KASSA, {
        rev: 'Да. Давит на совесть. Голоса ещё не было, а вина уже выписана — на твоё имя: «из-за тебя». Лёва ничего не просит и выбора не отнимает. Он заранее раздаёт вину и подпирает её своей доплатой. Только есть ли она, эта доплата? Ответ: «Давай сначала посчитаем. Сколько в общаке?»',
        name: 'Не то. Лёва не вспоминает прошлое и не оставляет тебе два пути. На кого он заранее вешает свою доплату?',
        lever: 'Присмотрись. Голоса ещё не было, а вина уже выписана — на твоё имя. «Из-за тебя» раньше, чем ты что-то решишь.' }],
      ['Тимур', 'мне серая больше нравится. будет бирюзовая — жалко, но не смертельно. голос твой, выбирай как видишь', 'ЧИСТО', null, { none: 'Тут нечего проверять: Тимур говорит про себя.', ok: 'Да. Тимуру будет жалко, и он так и пишет. Но следом — «голос твой»: вину он ни на кого не вешает и выбор отдаёт обратно. Сравни с Алиной: огорчены оба, а отвечать за огорчение тебе предложили только в одном сообщении. «Мне жалко» — честно. Давит другое: «и это из-за тебя».', miss: 'Мимо. «Жалко» — это про Тимура, а не про тебя. Он честно говорит, что чувствует, и тут же возвращает выбор. Так выглядит обида без нажима: можно ответить «понимаю» — и голосовать как хочется.' }]];
  }
  var PAINT = [
    { id: 'a', text: 'Пишу: «Серая. Один слой — и к шести все свободны».', say: [['Лёва', 'вот. хоть кто-то тут думает головой'], ['Алина', 'ок. эскиз оставлю себе']], view: 'minimal',
      cost: [['С Алиной', 'обиделась, и уже не для вида.'], ['Со временем', 'один слой, в субботу к шести все свободны.'], ['С обещаниями', 'новых нет.']],
      mono: 'Минималисты сказали бы: бери то, что проще, и освободи себе субботу. Серая ложится в один слой, стоит дешевле и не требует эскизов. Торо два года и два месяца прожил в хижине у Уолденского пруда — проверял, сколько человеку на самом деле нужно. Вышло: немного. Обратная сторона: если всегда выбирать «попроще», можно сжаться до скуки. Гараж выйдет аккуратным. И никаким.',
      hotya: { chosen_option: 'a', counter_option: 'b', view_id: 'romantic', text: 'Гараж красят раз в несколько лет. Серая сэкономит пару часов, а потом каждый раз у этой стены будет видно: тут выбрали «сойдёт». И чей-то эскиз так и останется на бумаге.' },
      c1: { text: 'Беру простое, если оно работает.', alts: ['Лишняя сложность — не достоинство.', 'Проще — значит свободнее.'] },
      c2: { text: 'Красота — тоже довод, и не самый слабый.', alts: ['Ради красивого не жалко лишнего часа.', 'Удобно — ещё не значит хорошо.'] } },
    { id: 'b', text: 'Пишу: «Бирюзовая. Эскиз того стоит».', say: [['Алина', 'ааа, спасибо! в субботу несу эскиз'], ['Лёва', 'два слоя. ну, сами напросились']], view: 'romantic',
      cost: [['С Лёвой', 'ворчит, но краску берёт.'], ['Со временем', 'два слоя, в субботу красят до восьми.'], ['С обещаниями', 'за бирюзовую теперь отвечаешь и ты.']],
      mono: 'Романтики сказали бы: красота — не каприз, а причина. Над эскизом сидели три вечера, и стена с ним станет вашей, а не просто покрашенной. Шиллер писал, что человек бывает вполне человеком, только когда играет: придумывает, украшает, делает что-то не ради пользы. Цена понятная: порыв сегодня — второй слой и два лишних часа в субботу. А если на стене выйдет не так, как на бумаге, отвечать за это теперь и тебе.',
      hotya: { chosen_option: 'b', counter_option: 'c', view_id: 'skeptic', text: 'Эскиз хорош на бумаге. Какой бирюзовая выйдет на бетоне при одной лампочке, никто не видел. Пробник стоит сто рублей — и мог бы сберечь два слоя ошибки.' },
      c1: { text: 'За то, что радует, не жалко заплатить временем.', alts: ['Красота — тоже довод.', 'Выбираю то, от чего загораются глаза.'] },
      c2: { text: 'Сначала смотрю вживую, потом решаю.', alts: ['Не решаю вслепую.', 'Проба дешевле ошибки.'] } },
    { id: 'c', text: 'Пишу: «Пока не голосую. Лёв, возьми два пробника — выберем у стены».', say: [['Даня', 'пробник — сто рублей. бери оба, из общака'], ['Лёва', 'то есть я зря тут стою. ладно, беру пробники']], view: 'skeptic',
      cost: [['С Лёвой и Алиной', 'ждут оба, и оба недовольны.'], ['Со временем', 'решение переехало на завтра.'], ['С обещаниями', 'на тебе — прийти к стене и выбрать.']],
      mono: 'Скептики сказали бы: не знаешь — не решай. Два цвета на экране телефона и два цвета на стене гаража — разные вещи. Секст Эмпирик советовал воздерживаться от суждения, пока доводы за и против весят одинаково. А тут ровно так: два на два и ни одного мазка на стене. Значит — мазнуть, посмотреть, потом голосовать. Слабое место: «давайте ещё проверим» умеет тянуться вечно. А красить — в субботу.',
      hotya: { chosen_option: 'c', counter_option: 'a', view_id: 'minimal', text: 'Пока все ждут пробу, решение висит на шестерых, а Лёва второй раз идёт в магазин. Обе краски нормальные. Иногда «достаточно хорошо» сегодня лучше, чем «идеально» к пятнице.' },
      c1: { text: 'Не решаю вслепую: сначала смотрю.', alts: ['Проба дешевле ошибки.', '«Не знаю» — тоже честный ответ.'] },
      c2: { text: 'Достаточно хорошо — уже хорошо.', alts: ['Не гонюсь за идеальным.', 'Лучше решить сейчас, чем идеально потом.'] } }
  ];
  /* сцены: q2 — шаг 2 квеста «Суббота» (чат класса, состояние ext.qs2), d2 — Дело второго дня «Должок» (ext.d2); один движок, разные данные.
     names — приёмы сцены (уже встреченные игроком плюс приём самой сцены) — в лоток строки попадают только они и «Без подвоха» */
  var SCENES = {
    q2: { key: 'qs2', quest: true, moves: MOVES, rows: d2rows, names: ['ВСЕ УЖЕ', 'ПЕРЕД ФАКТОМ', 'СРОЧНОСТЬ'], beasts: { 'ПЕРЕД ФАКТОМ': 'fact' }, ava: '9Б', chat: '9Б · гараж', members: '14 участников', time: '18:12',
          day: function () { return 'Сегодня'; },
          pre: 'Тимур уже всем пообещал за тебя. Отвечать — тебе.', press: 'Теперь разберём, что тут было. Тапни сообщение, если там давят. Если давления нет нигде — так и скажи.',
          allclean: 'Присмотрись к Тимуру. Он кое-что сделал раньше, чем тебя спросили.' },
    d2: { key: 'd2', quest: false, mine: true, lday: 2, ask: true, moves: DEBT, rows: debtRows, names: ['ВЗАИМНОСТЬ', 'ЛОЖНЫЙ ВЫБОР', 'СРОЧНОСТЬ'], beasts: { 'ВЗАИМНОСТЬ': 'recip', 'ЛОЖНЫЙ ВЫБОР': 'fakec' }, ava: 'Г', chat: 'Гараж · красим', members: '6 участников', time: '16:40',
          day: function (U) { return cap1(dayName(U, 2)); },
          pre: 'Лёва правда объяснял тебе физику. Вопрос в том, чем за это платить.', press: 'Тапни сообщение, если там давят. Закреп можно глянуть один раз.',
          allclean: 'Перечитай Лёву. Два его сообщения из трёх — не просто сообщения.',
          crNarr: 'Сегодня кнопок больше. «Подправлю» — перепиши вывод своими словами. «Пока не знаю» — вывод полежит в кармане пару дней, потом спросим ещё раз.',
          lupaH: 'Ещё одно на сегодня: уведомление от онлайн-школы', lupaP: 'Минута, если хочется. Найди, где давят — тот же расклад, что с толстовкой.' },
    d3: { key: 'd3', quest: false, mine: true, lday: 3, moves: PAINT, rows: paintRows, names: ['ВИНА', 'ВЗАИМНОСТЬ', 'ЛОЖНЫЙ ВЫБОР'], beasts: { 'ВИНА': 'guilt' }, ava: 'Г', chat: 'Гараж · красим', members: '6 участников', time: '15:20',
          day: function (U) { return cap1(dayName(U, 3)); },
          pre: 'Два на два, и обе половины чата смотрят на тебя. Правильного цвета тут нет. Есть твой голос — и то, что за ним потянется.',
          press: 'Сегодня давят тише, чем вчера: никто ничего не требует. Тапни сообщение, если там давят. Закреп можно глянуть один раз.',
          allclean: 'Перечитай Алину и второе сообщение Лёвы. О цвете там уже не спорят — там заранее раздают вину.',
          crIds: ['e1', 'e2'],
          crNarr: 'Кнопки те же, что вчера: забрать вывод, отказаться, подправить под себя или отложить на пару дней.',
          lupaH: 'Ещё одно на сегодня: пересылка из районного чата', lupaP: 'Минута, если хочется. Тут новенькое: давят не всегда. Иногда в сообщении просто не хватает фактов — на такой случай внизу есть кнопка «Мало данных».' }
  };
  function sceneTags(sc) { return sc.names.concat(['ЧИСТО']); }
  function pressureIdx(U, sc) { return sc.rows(U).map(function (r, i) { return r[2] !== 'ЧИСТО' ? i : -1; }).filter(function (i) { return i >= 0; }); }
  function d2state(U, sc) { var s = ex(U); sc = sc || SCENES.d2; if (!s[sc.key]) s[sc.key] = { move: null, stage: 'move', open: null, rows: {}, wrong: {}, fa: 0, hint: '', fb: null, cr: [], fin: false, chk: null, asked: false, lupaGo: false }; return s[sc.key]; }
  function mvOf(d, sc) { return (sc || SCENES.d2).moves.filter(function (m) { return m.id === d.move; })[0]; }
  function d2makeCr(d, sc) {
    var mv = mvOf(d, sc), ids = (sc && sc.crIds) || ['d1', 'd2']; /* у каждого Дела свои идентификаторы выводов, иначе они столкнутся в Кодексе */
    d.cr = [{ id: ids[0], view: mv.view, text: mv.c1.text, alts: mv.c1.alts, sph: 'friends', status: 'new', fit: false, contra: ids[1] },
            { id: ids[1], view: mv.hotya.view_id, text: mv.c2.text, alts: mv.c2.alts, sph: 'friends', status: 'new', fit: false, contra: ids[0] }];
  }
  /* первое предложение жирным: «Да.», «Мимо.», «Льстит.» — читается как ответ, а не как справка */
  function leadHTML(t) { var m = /^(.*?[.!?])(\s+|$)([\s\S]*)$/.exec(t); return m ? '<b>' + esc(m[1]) + '</b> ' + esc(m[3]) : esc(t); }
  function chkHTML(d, rows) {
    if (!d.chk) return '';
    var cl = rows[d.chk.r][3], fb = rows[d.chk.r][4] || {};
    var line = !cl ? fb.none : (cl.truth === true ? cl.yes : (cl.truth === false ? (cl.no || VERDICTS.no) : cl.unk));
    return '<div class="chk"><div class="mono kk">Что в закрепе</div>' +
      (cl && cl.proof ? '<div class="pin"><small class="mono">закреплено · ' + esc(cl.by) + '</small>«' + esc(cl.proof) + '»</div>' : '') +
      '<p>' + esc(line) + '</p></div>';
  }
  function fbHTML(d) { return d.fb ? '<div class="reveal fbk">' + revP(d.fb) + '</div>' : ''; }
  var AB = window.NPC_BASE || ''; /* игра поднята с запасной копии (сторож в index.html): картинки брать оттуда же; обычно пусто */
  var AVA = { 'Тимур': 'timur', 'Даня': 'danya', 'Алина': 'alina', 'Макс': 'max', 'Лёва': 'lyova' };
  /* аватар: круг с буквой в цвет персонажа (data-n, data-l) — запасной вид; поверх него портрет из art/, если файл есть */
  function avaImg(name) { return AVA[name] ? '<span class="d2ava" data-n="' + AVA[name] + '" data-l="' + name.charAt(0) + '"><img src="' + AB + 'art/ava-' + AVA[name] + '.webp" alt="" onerror="this.remove()"></span>' : ''; }
  /* разбор приёма: последнее предложение «Ответ…» выносится отдельной строкой жирным (в данных строки не меняются) */
  function ansSplit(t) { var m = /^([\s\S]*?[.!?»])\s+(Ответ(?![а-яё])[\s\S]*)$/.exec(t); return m ? [m[1], m[2]] : [t, '']; }
  function revP(t) { var a = ansSplit(t); return '<p>' + leadHTML(a[0]) + '</p>' + (a[1] ? '<p class="ans"><strong>' + esc(a[1]) + '</strong></p>' : ''); }
  /* исходящее сообщение игрока: то, что стоит в «ёлочках» хода */
  function mineBubble(U, mv) { var m = /«([\s\S]*)»/.exec(mv.text), n = String(ex(U).nick || '').trim(); return '<div class="d2msg me"><small>' + esc(n || 'ты') + '</small>' + esc(m ? m[1] : mv.text) + '</div>'; }
  /* «Ещё одно на сегодня» привязано к дню Дела: внутри сцены — день этого Дела, в Бестиарии — по состоянию главного экрана */
  function inDay(sc, fn) { var old = LDAY; LDAY = sc && sc.lday ? sc.lday : null; try { return fn(); } finally { LDAY = old; } }
  function sceneBody(U, sc) {
    var d = d2state(U, sc), mv = mvOf(d, sc), thread = d.stage === 'thread', rows = sc.rows(U), press = pressureIdx(U, sc);
    var pinned = d.chk && rows[d.chk.r][3] && rows[d.chk.r][3].proof ? '<div class="d2pin"><span class="mono">закреплено · ' + esc(rows[d.chk.r][3].by) + '</span>«' + esc(rows[d.chk.r][3].proof) + '»</div>' : '';
    var ph = '<div class="msgs d2m' + (thread ? ' thread' : '') + '"><div class="day mono">' + sc.day(U) + '</div>' + pinned + (sc.quest ? myBubble(U) : '') + rows.map(function (m, i) {
      var st = d.rows[i], tap = thread && !st;
      return '<div class="d2msg' + (m[2] !== 'ЧИСТО' ? ' tg' : '') + (st ? ' seen' : '') + (tap ? ' tappable' + (d.open === i ? ' open' : '') : '') + '" style="animation-delay:' + ((sc.quest ? i + 1 : i) * 0.1) + 's"' +
        (tap ? ' data-d2="tag" data-r="' + i + '" role="button" tabindex="0" aria-label="Сообщение от ' + esc(m[0]) + ': ' + esc(m[1]) + '. Тапни, чтобы разобрать"' : '') + '><small>' + m[0] + '</small>' + esc(m[1]) +
        (tap ? '<span class="tag2lab mono" aria-hidden="true">что тут?</span>' : '') +
        (st ? '<span class="vizhu' + (st === 'clean' ? ' clean' : '') + '">' + (st === 'clean' ? 'Без подвоха' : tray(m[2])) + '</span>' : '') + avaImg(m[0]) + '</div>';
    }).join('') + (d.asked ? '<div class="d2msg re"><small>Даня</small>' + esc(ASK_DANYA) + '</div>' : '') +
      (sc.mine && mv ? mineBubble(U, mv) : '') +
      (mv ? mv.say.map(function (r) { return '<div class="d2msg re"><small>' + r[0] + (r[2] ? ' · в личке' : '') + '</small>' + esc(r[1]) + '</div>'; }).join('') : '') + '</div>';
    var side = '', top = '';
    if (!d.move) {
      if (sc.ask && U.S().basis === 'socrates') {
        side += d.asked ? '<p class="narr">' + ASK_NARR + '</p>' : '<div class="d2btns askrow"><button class="btn" type="button" data-d2="ask">Спросить Даню, кто там будет</button></div>';
      }
      side += '<h2 class="q2-ask">Что делаешь?</h2><p class="narr">' + esc(sc.pre) + '</p><div class="slips">' +
        sc.moves.map(function (m) { return '<button class="slip" type="button" data-d2="move" data-m="' + m.id + '">' + esc(m.text) + '</button>'; }).join('') + '</div>';
    } else if (d.stage === 'thread' || d.stage === 'found') {
      side = thread ? costHTML(mv.cost) : '';
      if (thread) {
        var named = press.filter(function (x) { return d.rows[x] === 'named'; }).length;
        top = '<div class="d2top"><h2 class="q2-ask">Кто давил?</h2><p class="narr q2-press">' + esc(sc.press) + '</p></div>';
        side += chkHTML(d, rows) + fbHTML(d);
        if (d.open !== null) {
          var wr = d.wrong[d.open] || [];
          side += '<div class="d2k mono" style="margin-top:14px">Сообщение · ' + esc(rows[d.open][0]) + '</div><blockquote class="qquote">' + esc(rows[d.open][1]) + '</blockquote><div class="qline">Что в этой фразе?</div>' + (d.hint ? '<div class="hint2">' + esc(d.hint) + '</div>' : '') +
            '<div class="opts4"><button class="opt chkbtn" type="button" data-d2="check"' + (d.chk ? ' disabled' : '') + '>Глянуть закреп<small>' + (d.chk ? 'Закреп уже открыт — одна проверка на чат' : 'откроет закреплённое сообщение чата, один раз') + '</small></button>' +
            (d.ord && d.ord.length === sceneTags(sc).length ? d.ord : sceneTags(sc)).map(function (n) { return '<button class="opt' + (n === 'ЧИСТО' ? ' clean' : '') + (wr.indexOf(n) >= 0 ? ' no' : '') + '" type="button" data-d2="opt" data-n="' + n + '">' + tray(n) + '</button>'; }).join('') + '</div>';
        } else {
          side += (named ? '<p class="prompt mono" style="margin-top:16px;text-align:left">Есть ещё сообщение, где давят. Тапни его.</p>' : '') + (d.hint ? '<div class="hint2">' + esc(d.hint) + '</div>' : '');
        }
        side += '<div class="d2btns"><button class="btn" type="button" data-d2="allclean">Никто не давил</button></div>';
      } else {
        side += press.map(function (x) { var rt = (rows[x][4] || {}).rev || REVEAL[rows[x][2]].t; return '<div class="reveal fbk rvk"><div class="rvh">Разбор · ' + esc(rows[x][0]) + '</div>' + revP(rt) + '</div>'; }).join('') +
          costHTML(mv.cost) + monoHTML(mv.view, mv.mono) + hotyaHTML(mv.hotya.text) +
          (sc.quest ? '<div class="d2next"><button class="btn seen" type="button" data-d2="qnext">Дальше</button></div>'
                    : '<div class="d2next"><button class="btn seen" type="button" data-d2="tocr">Дальше</button></div>');
      }
    } else if (d.stage === 'crumbs') {
      var k = EXT.counts(U), pend = d.cr.every(function (c) { return c.status !== 'new'; });
      side = '<h2 class="q2-ask">Два вывода из этой истории</h2><p class="narr">Из этой истории — два вывода. Они спорят между собой, и это нормально: у тебя может быть и один, и другой, и ни одного.</p>' +
        '<p class="narr">' + esc(sc.crNarr) + '</p>' +
        d.cr.map(function (c, i) { return crCard(c, i, 2, d.cr.filter(function (x) { return x.id === c.contra; })[0]); }).join('') +
        '<div class="pocket mono"><span>В Кодексе: ' + k.sheet + ' из 12</span><div class="slots">' + slotsHTML(k) + '</div></div>' +
        '<div class="d2next"><button class="btn seen" type="button" data-d2="tolupa"' + (pend ? '' : ' disabled') + '>Дальше</button>' + (pend ? '' : '<p class="prompt mono d2hold">Сначала реши, что делать с каждым выводом.</p>') + '</div>';
    } else {
      var L = inDay(sc, function () { return lupaState(U); });
      if (!d.lupaGo && !L.fin) {
        side = '<h2 class="q2-ask">' + esc(sc.lupaH) + '</h2><p class="narr">' + esc(sc.lupaP) + '</p>' +
          (d.lskip ? '<p class="narr">Ок. Ничего не теряется.</p><div class="d2next"><a class="btn seen" href="#s=end" data-d2="end">На сегодня всё</a></div>'
                   : '<div class="d2btns"><button class="btn seen" type="button" data-d2="lgo">Давай</button><button class="btn" type="button" data-d2="lskip">Не сейчас</button></div>');
      } else {
        side = '<div class="d2k mono">Ещё одно на сегодня</div><div class="lupa-host" id="' + sc.key + 'lupa">' + inDay(sc, function () { return lupaHTML(U); }) + '</div>' +
          '<div class="d2next"><a class="btn seen" href="#s=end" data-d2="end">' + (L.fin ? 'На сегодня всё' : 'Пропустить') + '</a></div>';
      }
    }
    return '<div class="d2grid">' + top + '<div class="phone warm d2p"><div class="sbar"><span>' + sc.time + '</span><span class="ic">▮▮▮</span></div>' +
      '<div class="chead"><span class="back" aria-hidden="true">‹</span><span class="ava g">' + sc.ava + '</span><div><b>' + sc.chat + '</b><small>' + sc.members + '</small></div></div>' + ph +
      '<div class="cinput" aria-hidden="true"><i>＋</i><span>Сообщение</span><i>➤</i></div></div><div class="d2side">' + side + '</div></div>';
  }
  function slotsHTML(k) {
    var ps = '', base = k.sheet - k.newOnSheet;
    for (var q = 0; q < 12; q++) ps += '<i class="' + (q < base ? 'on' : (q < k.sheet ? 'new' : (q < k.sheet + k.pocket ? 'pk' : ''))) + '"></i>';
    return ps;
  }
  /* узкая раскладка — одна колонка (граница та же, что у .d2grid в more.css); прокручивается сама секция экрана, плавно, при prefers-reduced-motion — сразу */
  function sceneNarrow() { return !(window.matchMedia && window.matchMedia('(min-width:900px)').matches); }
  function sceneScroll(el, sel, off) {
    var t = $(sel, el); if (!t) return;
    var ab = $('.appbar', el), abh = ab ? ab.offsetHeight : 0; /* шапка разделов липкая: цель должна оказаться под ней */
    var y = t.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop - (off === undefined ? 10 : off) - abh, red = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    try { el.scrollTo({ top: Math.max(0, y), behavior: red ? 'auto' : 'smooth' }); } catch (x) { el.scrollTop = Math.max(0, y); }
  }
  function scrollAfter(el, sc, k, dd) {
    var narrow = sceneNarrow();
    if (k === 'tocr' || k === 'tolupa') { if (narrow) sceneScroll(el, '.d2side'); else el.scrollTop = 0; return; }
    if (!narrow) return;
    if (k === 'lgo') sceneScroll(el, '.d2side');
    else if (k === 'move' && !sc.quest) sceneScroll(el, '.d2m .d2msg.me, .d2m .d2msg.re', 14);
    else if (k === 'tag' && dd.open !== null) sceneScroll(el, '.d2side .d2k', 8);
    else if (k === 'check') sceneScroll(el, '.d2side .chk', 8);
  }
  /* обработчик кликов сцены: один на экран, сцена лежит в el._sc (экран «Дела» и экран шага 2 квеста) */
  function sceneWire(U, el, sc) {
    el._sc = sc;
    if (el._wired) return;
    el._wired = true;
    var redraw = function () { var b = $('.scbody', el); if (b) b.innerHTML = sceneBody(U, el._sc); };
    var onTap = function (e) {
      var sc = el._sc, dd = d2state(U, sc);
      var lp = e.target.closest('[data-lp]'); if (lp) { U.S().real = true; U.buzz(8); inDay(sc, function () { lupaAct(U, lp); }); redraw(); return; }
      var ca = e.target.closest('.cr2 [data-a]');
      if (ca) {
        var art = ca.closest('.cr2'), c = dd.cr.filter(function (x) { return x.id === art.getAttribute('data-c'); })[0];
        U.S().real = true; U.buzz(10); crAct(c, ca.getAttribute('data-a'), ca, art); if (c.status === 'pocket') c.doneMsg = 'Положено в карман. Вернёмся к нему через пару дней.'; redraw(); return;
      }
      var b = e.target.closest('[data-d2]'); if (!b) return;
      var k = b.getAttribute('data-d2'); U.S().real = true; U.buzz(10);
      if (k === 'end') { if (!dd.fin) { dd.fin = true; dd.finTs = Date.now(); } return; }
      if (k === 'qnext') { if (U.questNext) U.questNext(); return; }
      var caught = null;
      if (k === 'move') { dd.move = b.getAttribute('data-m'); dd.stage = 'thread'; }
      else if (k === 'tag') { var r = +b.getAttribute('data-r'); dd.open = dd.open === r ? null : r; dd.hint = ''; dd.fb = null; if (dd.open !== null) dd.ord = shuffle(sceneTags(sc)); }
      else if (k === 'check') { if (dd.open === null || dd.chk) return; dd.chk = { r: dd.open }; dd.hint = ''; }
      else if (k === 'allclean') { dd.hint = sc.allclean; dd.open = null; dd.fb = null; }
      else if (k === 'ask') { dd.asked = true; }
      else if (k === 'lgo') { dd.lupaGo = true; }
      else if (k === 'lskip') { dd.lskip = true; }
      else if (k === 'opt') {
        var rws = sc.rows(U), i = dd.open, truth = rws[i][2], cl = rws[i][3], fb = rws[i][4] || {}, pick = b.getAttribute('data-n');
        if (pick === truth) {
          dd.rows[i] = truth === 'ЧИСТО' ? 'clean' : 'named'; dd.open = null; dd.hint = '';
          dd.fb = truth === 'ЧИСТО' ? fb.ok : (fb.rev || REVEAL[truth].t);
          if (truth !== 'ЧИСТО') {
            caught = truth;
            if (!pressureIdx(U, sc).some(function (x) { return dd.rows[x] !== 'named'; })) dd.stage = 'found';
          }
        }
        else if (cl && cl.truth === true && pick === 'СРОЧНОСТЬ' && !dd.chk) {
          /* до закрепа игрок не может знать, настоящий ли срок: это не ложная тревога, а повод глянуть закреп */
          dd.hint = cl.looks;
        } else if (cl && cl.truth === true && pick === 'СРОЧНОСТЬ') {
          (dd.wrong[i] = dd.wrong[i] || []).push(pick); dd.fa = (dd.fa || 0) + 1; dd.hint = cl.info;
        } else {
          (dd.wrong[i] = dd.wrong[i] || []).push(pick);
          /* ложные тревоги Дела считаются отдельно от s.fa скрытого уровня */
          if (truth === 'ЧИСТО') { dd.fa = (dd.fa || 0) + 1; dd.hint = fb.miss; }
          else dd.hint = pick === 'ЧИСТО' ? fb.lever : fb.name;
        }
      }
      else if (k === 'tocr') { d2makeCr(dd, sc); dd.stage = 'crumbs'; }
      else if (k === 'tolupa') { dd.stage = 'lupa'; }
      redraw();
      scrollAfter(el, sc, k, dd);
      if (caught && sc.beasts[caught] && U.catchBeast) U.catchBeast(sc.beasts[caught], function () {
        if (dd.stage === 'found' && sc.quest) { var sd = $('.d2side', el); if (sd && sd.scrollIntoView) sd.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        else if (dd.stage === 'found' && sceneNarrow()) sceneScroll(el, '.d2side');
      });
    };
    el.addEventListener('click', onTap);
    el.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.d2msg[data-d2="tag"]')) { e.preventDefault(); onTap(e); } });
  }
  /* поиск данных по сцене: для проверок и для начального заполнения демо-шагов (все строки с давлением названы) */
  function markPressure(U, sc, d) { pressureIdx(U, sc).forEach(function (x) { d.rows[x] = 'named'; }); }
  function screenDay2(U, o) {
    var sc = SCENES.d2;
    if (o.step === 'wait') { var sw0 = ex(U); sw0.day1Done = sw0.day1Done || Date.now(); return screenHome(U, { step: 'wait' }); }
    cur = { name: 'day2', opts: o };
    var d = d2state(U, sc);
    if (!o.step && U.S().real && !ex(U).d2Ts) ex(U).d2Ts = Date.now(); /* время первого открытия Дела 2 — в «Для взрослых» (НЕДЕЛЯ-0, 2Б-2) */
    if (!d.move && o.step) {
      var order = ['moved', 'found', 'crumbs', 'lupa', 'check', 'reasons', 'tension'], si = order.indexOf(o.step);
      if (si >= 0) {
        d.move = si === 0 ? 'a' : 'b'; d.stage = 'thread';
        if (si === 4) { d.move = 'a'; d.open = 3; d.chk = { r: 3 }; }
        if (si === 1 || si === 2 || si === 3 || si === 5) { markPressure(U, sc, d); d.stage = 'found'; }
        if (si === 2 || si === 3 || si === 6) { d2makeCr(d, sc); d.stage = 'crumbs'; }
        if (si === 6) { d.cr[0].status = 'keep'; d.cr[1].status = 'fit'; d.cr[1].fit = true; d.cr[1].text = d.cr[1].alts[0]; }
        if (si === 3) { d.cr[0].status = 'keep'; d.cr[1].status = 'pocket'; d.stage = 'lupa'; }
      }
    }
    var el = mount(U, 'scr-day2', 'day2', '<div class="wrap d2"><div class="d2head"><div class="kick mono"><span class="dot"></span><span>Дело 2 · ' + dayName(U, 2) + '</span></div>' +
      '<h1>Должок</h1><p class="narr d2-intro">Даня завёл отдельный чат: гараж надо покрасить, иначе колонке там стыдно стоять. Красить зовут всех, кто «в деле». То есть тебя.</p></div><div class="scbody" id="d2body">' + sceneBody(U, sc) + '</div></div>');
    sceneWire(U, el, sc);
  }
  /* ================= ЭКРАН: Дело третьего дня «Краски» ================= */
  /* секции #scr-day3 в index.html нет (разметку страницы это Дело не трогает): создаём её здесь, сразу после #scr-day2 */
  (function () {
    var host = document.getElementById('scr-day2');
    if (!host || document.getElementById('scr-day3')) return;
    var sec = document.createElement('section');
    sec.className = 'screen scroll'; sec.id = 'scr-day3'; sec.setAttribute('data-screen', 'day3'); sec.setAttribute('aria-label', 'Дело третьего дня');
    host.parentNode.insertBefore(sec, host.nextSibling);
  })();
  /* рендер без прохождения: Дело 2 считается законченным ходом «a» (первая реплика Лёвы — версия «a», игровой день — третий), Должок и Развилка уже в Бестиарии */
  function d3prep(U) {
    if (U.S().real) return;
    var s = ex(U); s.day1Done = s.day1Done || Date.now();
    var d2s = d2state(U, SCENES.d2);
    if (!d2s.fin) { d2s.move = d2s.move || 'a'; d2s.stage = 'lupa'; d2s.fin = true; d2s.finTs = d2s.finTs || Date.now(); }
    s.beasts = s.beasts || [];
    ['recip', 'fakec'].forEach(function (id) { if (s.beasts.indexOf(id) < 0) s.beasts.push(id); });
  }
  function d3beast(U) { var s = ex(U); s.beasts = s.beasts || []; if (s.beasts.indexOf('guilt') < 0) s.beasts.push('guilt'); }
  function screenDay3(U, o) {
    var sc = SCENES.d3, s = ex(U);
    if (!U.S().real && (o.step === 'wait' || o.step === 'done')) {
      d3prep(U);
      if (o.step === 'done') {
        var dn = d2state(U, sc); dn.move = 'c'; dn.stage = 'lupa'; markPressure(U, sc, dn); d2makeCr(dn, sc); dn.cr[0].status = 'keep'; dn.cr[1].status = 'pocket'; dn.fin = true; dn.finTs = Date.now(); d3beast(U);
      }
      return screenHome(U, { step: o.step === 'wait' ? 'wait' : '' });
    }
    if (U.S().real && !(s.d2 && s.d2.fin)) return screenHome(U, { step: '' }); /* Дело 3 открывается только после Дела 2 */
    if (U.S().real) { homeState(U); if (!U.opt().now && !(s.d3 && s.d3.move) && Date.now() < unlockAt(s.d2.finTs)) return screenHome(U, { step: '' }); } /* и не раньше срока (если Дело ещё не начато) */
    if (!o.step && U.S().real && !s.d3Ts) s.d3Ts = Date.now(); /* время первого открытия Дела 3 — в «Для взрослых» */
    d3prep(U);
    cur = { name: 'day3', opts: o };
    var d = d2state(U, sc);
    if (!d.move && o.step) {
      var rows = sc.rows(U);
      if (['moved', 'named', 'check', 'found', 'crumbs', 'lupa'].indexOf(o.step) >= 0) {
        d.move = 'a'; d.stage = 'thread';
        if (o.step === 'named') { d.rows[2] = 'named'; d.fb = rows[2][4].rev; d3beast(U); }
        if (o.step === 'check') { d.open = 3; d.chk = { r: 3 }; }
        if (o.step === 'found' || o.step === 'crumbs' || o.step === 'lupa') { markPressure(U, sc, d); d.stage = 'found'; d3beast(U); }
        if (o.step === 'crumbs' || o.step === 'lupa') { d2makeCr(d, sc); d.stage = 'crumbs'; }
        if (o.step === 'lupa') { d.cr[0].status = 'keep'; d.cr[1].status = 'pocket'; d.stage = 'lupa'; }
      }
    }
    var el = mount(U, 'scr-day3', 'day3', '<div class="wrap d2 d3"><div class="d2head"><div class="kick mono"><span class="dot"></span><span>Дело 3 · ' + dayName(U, 3) + '</span></div>' +
      '<h1>Краски</h1><p class="narr d2-intro d3-intro">Лёва в магазине, в руках две банки: серая и бирюзовая. Чат разделился ровно пополам, и последний голос — твой. Это уже все знают. И у каждого есть что тебе сказать.</p></div><div class="scbody" id="d3body">' + sceneBody(U, sc) + '</div></div>');
    sceneWire(U, el, sc);
  }
  /* шаг 2 квеста «Суббота»: та же сцена без шапки разделов; ход, «Кто давил?», поимка Решалы, разбор и «А с другой стороны —» */
  function questScene(U, host) {
    var sc = SCENES.q2;
    host.innerHTML = '<div class="wrap d2"><div class="d2head"><div class="kick mono"><span class="dot"></span><span>Чат 9Б · 18:12</span></div><h1 class="q2-h">Чат класса</h1>' +
      '<p class="narr q2-intro">Вечер. Чат класса. Про тебя там уже написали. Читай и смотри, кто на тебя давит.</p></div><div class="scbody">' + sceneBody(U, sc) + '</div></div>';
    sceneWire(U, host, sc);
  }


  /* ================= ЭКРАН: кодекс ================= */
  var SILH = 'M-.07 -.87 a.07 .07 0 1 0 .14 0 a.07 .07 0 1 0 -.14 0 Z M-.03 -.79 L.03 -.79 L.03 -.76 Q.17 -.74 .19 -.68 L.22 -.41 L.15 -.41 L.13 -.58 L.11 -.29 L.11 0 L.04 0 L.04 -.27 L-.04 -.27 L-.04 0 L-.11 0 L-.11 -.29 L-.13 -.58 L-.15 -.41 L-.22 -.41 L-.19 -.68 Q-.17 -.74 -.03 -.76 Z';
  function cxInit(U) {
    var s = ex(U), cx = s.cx;
    if (!cx) {
      cx = { crumbs: [], panel: 'card', compose: false, draft: { text: '', views: [], contra: '' }, dropped: [], revisit: U.opt().demo ? 1 : 0 };
      if (U.opt().demo) {
        BASE_CRUMBS.forEach(function (c) { cx.crumbs.push({ id: c.id, view: c.view, text: c.text, sph: c.sph, contra: c.contra, bit: c.bit, status: 'mine' }); });
        cx.crumbs.push({ id: 'own1', view: 'stoic', view2: 'cynic', text: 'Не иду туда, где надо доказывать, что я свой.', sph: ['friends', 'school'], contra: 'c8', own: true, status: 'mine', bit: 90 });
      }
      s.cx = cx;
    }
    /* итоги сегодняшних решений пересобираются из состояния: «оставляю» кладёт на лист сразу, «пока не знаю» — в Карман */
    cx.crumbs = cx.crumbs.filter(function (c) { return !c.fromCand; });
    allCands(U).forEach(function (c, i) {
      if (c.status === 'keep' || c.status === 'fit') cx.crumbs.push({ id: c.id, view: c.view, text: c.text, sph: [c.sph || 'friends'], status: 'mine', bit: 60 + i, fit: c.fit, own: !!c.own, fromCand: true, fresh: true, contra: c.contra, tn: c.tn, scope: c.scope });
      else if (c.status === 'pocket') cx.crumbs.push({ id: c.id, view: c.view, text: c.text, sph: [c.sph || 'friends'], status: 'pocket', hrs: 19, bit: 60 + i, fit: c.fit, fromCand: true, contra: c.contra, tn: c.tn, scope: c.scope });
    });
    return cx;
  }
  /* единый счётчик кодекса: берётся из состояния, а не из строки в разметке */
  EXT_counts = function (U) {
    var cx = cxInit(U), mine = cx.crumbs.filter(function (c) { return c.status === 'mine'; });
    return { sheet: mine.length, newOnSheet: mine.filter(function (c) { return c.fresh; }).length, pocket: cx.crumbs.filter(function (c) { return c.status === 'pocket'; }).length };
  };
  function cxWeights(cx) {
    var w = {};
    cx.crumbs.forEach(function (c) {
      if (c.status !== 'mine') return;
      if (c.view2) { w[c.view] = (w[c.view] || 0) + .5; w[c.view2] = (w[c.view2] || 0) + .5; } else w[c.view] = (w[c.view] || 0) + 1;
    });
    return w;
  }
  function shadowSVG(cx, big) {
    var w = cxWeights(cx), keys = Object.keys(w).sort(function (a, b) { return VIEWS[a].ang - VIEWS[b].ang; }), mx = 0;
    keys.forEach(function (k) { mx = Math.max(mx, w[k]); });
    /* серое пересечение — две крупицы каталожной пары cA/cB, обе на листе; взгляды берутся из самих крупиц, а не зашиты */
    var cA = crumbBy(cx, 'cA'), cB = crumbBy(cx, 'cB'), pair = !!(cA && cB && cA.status === 'mine' && cB.status === 'mine' && w[cA.view] && w[cB.view]), pv = pair ? [cA.view, cB.view] : ['minimal', 'achiev'];
    var FY = 372, Lcap = 345, lenOf = function (k) { return Lcap * (.5 + .5 * (w[k] / (mx || 1))); };
    var tf = function (k, L) { return 'translate(300 ' + FY + ') rotate(' + VIEWS[k].ang + ') scale(' + L + ')'; };
    var svg = '<svg class="shadows" viewBox="0 0 600 400" role="img" aria-label="Тени взглядов за силуэтом: длина тени — доля твоих выводов у этого взгляда">' +
      '<defs><radialGradient id="sg" cx="50%" cy="100%" r="85%"><stop offset="0" stop-color="#3a3050"/><stop offset="1" stop-color="#15121d"/></radialGradient>' +
      '<clipPath id="cpT"><path d="' + SILH + '" transform="' + tf(pv[0], lenOf(pv[0]) || 200) + '"/></clipPath></defs>' +
      '<rect width="600" height="400" fill="url(#sg)"/><rect x="0" y="' + FY + '" width="600" height="28" fill="#0d0b13"/><path d="M0 ' + FY + 'H600" stroke="rgba(239,234,244,.2)" stroke-width="1.2"/><g style="mix-blend-mode:screen">';
    keys.forEach(function (k) {
      svg += '<path d="' + SILH + '" fill="' + TONE[VIEWS[k].tone] + '" fill-opacity=".62" transform="' + tf(k, lenOf(k)) + '"/>';
    });
    svg += '</g>';
    if (pair) {
      svg += '<g clip-path="url(#cpT)"><path d="' + SILH + '" fill="#D9D4E6" fill-opacity=".96" transform="' + tf(pv[1], lenOf(pv[1])) + '"/></g>';
    }
    svg += '<path d="' + SILH + '" fill="#08070c" transform="translate(300 ' + FY + ') scale(150)"/></svg>';
    return svg;
  }
  function bitmap(cx) {
    var v = 0, n = 0; cx.crumbs.forEach(function (c) { if (c.status !== 'out') { v = (v * 31 + c.bit * 7 + 3) % 4294967291; n++; } });
    var h = (v >>> 0).toString(16); while (h.length < 8) h = '0' + h; return 'v1.' + h + '.' + (n < 10 ? '0' : '') + n.toString(16);
  }
  function crumbBy(cx, id) { return cx.crumbs.filter(function (c) { return c.id === id; })[0]; }
  /* связь contradicts: каталожная (предложение игры) живёт, пока игрок не ответил «нет»; ответ «да» делает её действующей */
  function tensOn(cx, c) { var d = c.contra && crumbBy(cx, c.contra); return !!d && d.status !== 'out' && c.tn !== 'no' && d.tn !== 'no'; }
  function tensConfirmed(c, d) { return c.tn === 'yes' || (d && d.tn === 'yes'); }
  function cxSheet(cx) {
    var rows = '', live = cx.crumbs.filter(function (c) { return c.status === 'mine'; }).concat(cx.crumbs.filter(function (c) { return c.status === 'pocket'; }));
    live.forEach(function (c, i) {
      var tn = TONE[VIEWS[c.view].tone], sub = VIEWS[c.view].name + (c.view2 ? ' и ' + VIEWS[c.view2].name : '');
      var pair = tensOn(cx, c);
      rows += '<li class="srow' + (c.own ? ' own' : '') + (c.status === 'pocket' ? ' pocket' : '') + '" style="--tc:' + tn + (c.view2 ? ';--tc2:' + TONE[VIEWS[c.view2].tone] : '') + '"><span class="sn">' + (i + 1) + '</span>' +
        '<span class="sab"><b>' + VIEWS[c.view].ab + '</b></span><div class="sb"><q>' + esc(c.text) + '</q><div class="ss mono">' + sub +
        (c.own ? ' · <em>моя формулировка</em>' : '') + (c.scope !== undefined && c.scope !== '' && SCOPES[+c.scope] ? ' · ' + SCOPES[+c.scope] : '') + (c.status === 'pocket' ? ' · <em class="pk">созревает ' + c.hrs + ' ч</em>' : '') +
        (pair && c.own ? ' · спорит с №' + (live.indexOf(crumbBy(cx, c.contra)) + 1) : '') + '</div></div></li>';
      var nx = live[i + 1];
      if (c.contra && nx && nx.id === c.contra && pair) {
        rows += '<li class="tens" style="--ta:' + TONE[VIEWS[c.view].tone] + ';--tb:' + TONE[VIEWS[nx.view].tone] + '"><svg viewBox="0 0 300 22" preserveAspectRatio="none" aria-hidden="true"><path d="M2 4 C60 22 110 -4 150 11 S240 20 298 4" fill="none" stroke="url(#thr)" stroke-width="3.4" stroke-linecap="round"/><path d="M2 18 C60 0 110 26 150 11 S240 2 298 18" fill="none" stroke="url(#thr)" stroke-width="3.4" stroke-linecap="round" opacity=".7"/></svg>' +
          '<span class="mono">спор: тянут в разные стороны · игра не решает за тебя · ' + (tensConfirmed(c, nx) ? 'подтверждено тобой' : 'предложение игры') + '</span><button class="fork" type="button" data-cx="fork">Развилка</button></li>';
      }
    });
    for (var k = live.length; k < 12; k++) rows += '<li class="srow empty"><span class="sn">' + (k + 1) + '</span><span class="sb">место свободно</span></li>';
    return '<ol class="sheet">' + rows + '</ol>';
  }
  function cxSpheres(cx) {
    var out = '';
    SPHERES.forEach(function (sp) {
      var items = cx.crumbs.filter(function (c) { return c.status !== 'out' && c.sph.indexOf(sp[0]) >= 0; });
      var spar = items.some(function (c) { return tensOn(cx, c) && items.some(function (d) { return d.id === c.contra; }); });
      out += '<div class="sph' + (items.length ? '' : ' none') + '"><span class="sl mono">' + sp[1] + '</span><span class="sd">' + (items.length ? items.map(function (c) {
        return '<i title="' + VIEWS[c.view].name + '" style="background:' + TONE[VIEWS[c.view].tone] + '"></i>'; }).join('') : '<em>пока пусто</em>') + '</span>' +
        (spar ? '<span class="sm mono">тут ты меняешь мнение</span>' : '') + '</div>';
    });
    return out;
  }
  function cxLegend(cx) {
    var w = cxWeights(cx);
    return Object.keys(w).sort(function (a, b) { return VIEWS[a].ang - VIEWS[b].ang; }).map(function (k) {
      return '<span class="vchip" style="--tc:' + TONE[VIEWS[k].tone] + '">' + VIEWS[k].name + ' ×' + (w[k] % 1 ? w[k].toFixed(1).replace('.', ',') : w[k]) + '</span>'; }).join('');
  }
  function cxPanel(cx, U) {
    var live = cx.crumbs.filter(function (c) { return c.status !== 'out'; });
    if (cx.panel === 'card') {
      var mine0 = live.filter(function (c) { return c.status === 'mine'; });
      var A = crumbBy(cx, 'cA'), B = crumbBy(cx, 'cB'), pair = A && B && A.status === 'mine' && B.status === 'mine';
      var rest = mine0.filter(function (c) { return !pair || (c.id !== 'cA' && c.id !== 'cB'); });
      var note = function (c) { return '<div class="sc-note" style="--tc:' + TONE[VIEWS[c.view].tone] + '">' + esc(c.text) + '<span class="vchip sm" style="--tc:' + TONE[VIEWS[c.view].tone] + '">' + VIEWS[c.view].name + '</span></div>'; };
      var body;
      if (pair) {
        body = note(A) + '<div class="thr2" aria-hidden="true"><svg viewBox="0 0 120 44"><defs><linearGradient id="thr2g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="' + TONE.quiet + '"/><stop offset="1" stop-color="' + TONE.thorn + '"/></linearGradient></defs><path d="M60 0 C20 12 100 24 60 44" fill="none" stroke="url(#thr2g)" stroke-width="4" stroke-linecap="round"/><path d="M60 0 C100 12 20 24 60 44" fill="none" stroke="url(#thr2g)" stroke-width="4" stroke-linecap="round" opacity=".6"/></svg><b class="rus">живу с обоими</b></div>' + note(B) + (rest[0] ? note(rest[0]) : '');
      } else body = mine0.slice(0, 3).map(note).join('') || '<div class="sc-note">Пока пусто: забери вывод в Деле.</div>';
      return '<p class="cap">' + (pair ? 'Три вывода и один спор. Без имени и аватара.' : 'До трёх выводов. Без имени и аватара.') + '</p>' +
        '<div class="sharecard v2"><div class="sc-top mono"><span>Мой кодекс · неделя 1</span><span>12+</span></div><h3>Что я беру с собой</h3><div class="sc-n">' + body + '</div>' +
        '<div class="sc-foot mono"><span>без имени и аватара</span><span>ссылка на игру</span></div></div>' +
        '<div class="sharebtns"><button class="btn" type="button" data-cx="copy">Скопировать</button><button class="btn seen" type="button" data-cx="send">Отправить →</button></div>';
    }
    if (cx.panel === 'cmp') {
      var mine = live.filter(function (c) { return !c.own && c.status === 'mine'; });
      var same = mine.filter(function (c) { return FRIEND.shown.indexOf(c.id) >= 0; }), only = mine.filter(function (c) { return FRIEND.shown.indexOf(c.id) < 0; });
      var friendOnly = FRIEND.shown.filter(function (id) { return !mine.some(function (c) { return c.id === id; }); }).length, one = only.length + friendOnly;
      var ul = function (a) { return '<ul>' + a.map(function (c) { return '<li>' + esc(c.text) + '</li>'; }).join('') + '</ul>'; };
      return '<p class="cap">Друг присылает ссылку. В ней только номера выводов, без слов и без имён. Твои слова остаются у тебя.</p>' +
        '<div class="linkbox mono"><span>твоя ссылка</span><code>/c#' + bitmap(cx) + '</code></div>' +
        '<div class="linkbox mono"><span>ссылка друга</span><code>/c#v1.7be40c1a.0b</code></div>' +
        '<p class="cmpsum"><b>Общее в открытых частях кодексов: ' + same.length + '.</b> Ещё ' + one + ' ' + plural(one, ['вывод показан', 'вывода показаны', 'выводов показаны']) + ' только у одного</p>' +
        '<div class="cmp"><div class="grp g-same"><h4 class="mono"><span>общее</span><span>' + same.length + '</span></h4>' + ul(same) + '</div>' +
        '<div class="grp"><h4 class="mono"><span>показано только у тебя</span><span>' + only.length + '</span></h4>' + ul(only) + '</div>' +
        (only.length ? '<div class="ask"><i>Можно спросить друга</i>Что он думает про «' + esc(only[0].text.replace(/[.]$/, '')) + '»?</div>' : '') + '<p class="cap" style="margin-top:10px">Отсутствие вывода в ссылке — не несогласие: друг мог его не показать.</p></div>';
    }
    return '<p class="cap">Кодекс — главное, что у тебя здесь есть, а хранится он на устройстве. Одна ссылка спасает его при смене телефона.</p>' +
      '<div class="backup"><div class="bk-row"><b>Сохранить себе</b><span>Ссылка с кодексом во фрагменте уходит тебе в «Избранное» мессенджера одним тапом.</span></div>' +
      '<div class="linkbox mono"><span>ссылка-копия</span><code>/r#v1.' + btoa(unescape(encodeURIComponent(bitmap(cx)))).slice(0, 18) + '…</code></div>' +
      '<button class="btn seen" type="button" data-cx="save">Отправить себе в «Избранное»</button>' +
      '<div class="bk-row" style="margin-top:14px"><b>Восстановить</b><span>Открой ссылку-копию на новом устройстве: кодекс вернётся целиком, с формулировками.</span></div>' +
      '<button class="btn" type="button" data-cx="restore">Восстановить по ссылке</button></div>' +
      '<p class="cap" style="margin-top:12px">В прототипе ничего не уходит наружу: ссылки показаны образцом.</p>';
  }
  function cxCompose(cx) {
    var d = cx.draft;
    var vs = Object.keys(VIEWS).map(function (k) { return '<button type="button" class="vc' + (d.views.indexOf(k) >= 0 ? ' on' : '') + '" style="--tc:' + TONE[VIEWS[k].tone] + '" data-cx="dv" data-k="' + k + '">' + VIEWS[k].name + '</button>'; }).join('');
    var cs = cx.crumbs.filter(function (c) { return c.status === 'mine'; }).map(function (c) { return '<button type="button" class="vc' + (d.contra === c.id ? ' on' : '') + '" data-cx="dc" data-k="' + c.id + '">' + esc(c.text.replace(/[.]$/, '')) + '</button>'; }).join('');
    return '<div class="compose"><h3 class="rus">Своя формулировка</h3><p class="cap">Твои слова — полноправный вывод: у него есть взгляд, споры, он попадает в сверку и карточку. Сам текст не покидает устройство.</p>' +
      '<label class="mono lb" for="cxtext">твоими словами</label><textarea id="cxtext" maxlength="90" rows="2" placeholder="Например: «Не обещаю того, чего не смогу»">' + esc(d.text) + '</textarea>' +
      '<div class="mono lb">на какие взгляды похоже (1–2)</div><div class="vcs">' + vs + '</div>' +
      '<div class="mono lb">с каким выводом спорит (если спорит)</div><div class="vcs list">' + cs + '</div>' +
      '<button class="btn seen" type="button" data-cx="add">Добавить в кодекс</button></div>';
  }
  function screenCodex(U, o) {
    cur = { name: 'codex', opts: o };
    var cx = cxInit(U);
    if (o.step === 'compose') cx.compose = true;
    if (o.step === 'cmp') cx.panel = 'cmp';
    if (o.step === 'backup') cx.panel = 'bk';
    var mineL = cx.crumbs.filter(function (c) { return c.status === 'mine'; }), pockL = cx.crumbs.filter(function (c) { return c.status === 'pocket'; });
    var slots = ''; for (var i = 0; i < 12; i++) slots += '<i class="' + (i < mineL.length ? 'on' : (i < mineL.length + pockL.length ? 'pk' : '')) + '"></i>';
    var own = mineL.filter(function (c) { return c.own; }).length;
    var inner = '<div class="wrap"><div class="cx-wrap"><div class="cx-main">' +
      '<div class="cx-head"><div class="kick mono"><span class="dot" style="background:var(--seen)"></span><span>Только на этом устройстве</span></div><h1>Мой кодекс</h1>' +
      '<p class="sub">Это твои выводы. Не школьные и не наши — твои. Любой можно переписать или выбросить. Хранятся только на этом телефоне.</p>' + (mineL.length + pockL.length ? '' : '<p class="sub emptyline">Тут будут твои выводы. Пока пусто: ни один не забран.</p>') +
      '<div class="cx-count mono"><span>' + mineL.length + ' из 12' + (pockL.length ? ' · отложено ' + pockL.length : '') + '</span><div class="slots">' + slots + '</div></div></div>' +
      '<section class="shadowbox" aria-label="Картина мира">' + shadowSVG(cx) + '</section>' +
      '<div class="legend">' + cxLegend(cx) + '</div><p class="lgnote">Длина тени — доля твоих выводов у этого взгляда. Серое пересечение — два твоих вывода спорят друг с другом.</p>' +
      '<h2 class="sect rus">По сферам</h2><p class="lgnote" style="margin-top:2px">Где у тебя какие взгляды. Одинаковые цвета в одной сфере — взгляды там сходятся, разные — ты ещё ищешь.</p>' +
      '<div class="spheres">' + cxSpheres(cx) + '</div>' +
      '<h2 class="sect rus">12 мест для выводов</h2><svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="thr" x1="0" x2="1"><stop offset="0" stop-color="' + TONE.quiet + '"/><stop offset="1" stop-color="' + TONE.thorn + '"/></linearGradient></defs></svg>' +
      cxSheet(cx) +
      '<div class="cx-btns"><button class="btn" type="button" data-cx="compose">+ Своя формулировка</button><span class="mono">своих: ' + own + '</span></div>' +
      (cx.compose ? cxCompose(cx) : '') +
      '<p class="localnote"><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="4" y="9" width="12" height="9" fill="none" stroke="#1C1411" stroke-width="2"/><path d="M7 9V6a3 3 0 0 1 6 0v3" fill="none" stroke="#1C1411" stroke-width="2"/></svg><span>Взгляды — личное дело. Слова, написанные тобой, с устройства не уходят.</span></p></div>' +
      '<aside class="cside" aria-label="Карточка, сверка, копия"><div class="seg" role="tablist"><button role="tab" class="' + (cx.panel === 'cmp' ? 'on' : '') + '" data-cx="p-cmp">Сверить с другом</button><button role="tab" class="' + (cx.panel === 'card' ? 'on' : '') + '" data-cx="p-card">Карточка</button><button role="tab" class="' + (cx.panel === 'bk' ? 'on' : '') + '" data-cx="p-bk">Сохранить себе</button></div>' +
      '<div class="panel" id="cxpanel">' + cxPanel(cx, U) + '</div><div class="forkbox" id="forkbox" hidden></div></aside></div></div>';
    var el = mount(U, 'scr-codex', 'codex', inner);
    if (!el._wired) {
      el._wired = true;
      el.addEventListener('click', function (e) {
        var b = e.target.closest('[data-cx]'); if (!b) return;
        var cx2 = cxInit(U), a = b.getAttribute('data-cx'); U.S().real = true; U.buzz(8);
        var keepScroll = el.scrollTop;
        if (a === 'p-cmp') cx2.panel = 'cmp'; else if (a === 'p-card') cx2.panel = 'card'; else if (a === 'p-bk') cx2.panel = 'bk';
        else if (a === 'compose') cx2.compose = !cx2.compose;
        else if (a === 'dv') { var k = b.getAttribute('data-k'), v = cx2.draft.views, ix = v.indexOf(k); if (ix >= 0) v.splice(ix, 1); else { v.push(k); if (v.length > 2) v.shift(); } cx2.draft.text = ($('#cxtext') || {}).value || cx2.draft.text; }
        else if (a === 'dc') { cx2.draft.contra = cx2.draft.contra === b.getAttribute('data-k') ? '' : b.getAttribute('data-k'); cx2.draft.text = ($('#cxtext') || {}).value || cx2.draft.text; }
        else if (a === 'add') {
          var t = (($('#cxtext') || {}).value || '').replace(/\s+/g, ' ').trim(), d = cx2.draft;
          if (!t) { U.toast('Напиши формулировку своими словами'); return; }
          if (!d.views.length) { U.toast('Выбери хотя бы один близкий взгляд'); return; }
          if (cx2.crumbs.filter(function (c) { return c.status === 'mine'; }).length >= 12) { U.toast('12 мест заняты: сначала выбрось одну'); return; }
          cx2.crumbs.push({ id: 'own' + (cx2.crumbs.length + 1), view: d.views[0], view2: d.views[1], text: t, sph: ['friends'], contra: d.contra || undefined, own: true, status: 'mine', bit: 91 });
          cx2.draft = { text: '', views: [], contra: '' }; cx2.compose = false; U.toast('Добавлено: это теперь полноправный вывод');
        }
        else if (a === 'fork') { var fb = $('#forkbox'); fb.hidden = false; fb.innerHTML = '<b class="mono">Развилка</b><p>Завтра зачёт, а друзья зовут на вечер. Что перевесит: покой или рекорд?</p><div class="fo"><button class="btn" type="button" data-cx="fk">В этот раз покой</button><button class="btn" type="button" data-cx="fk">В этот раз рекорд</button><button class="btn" type="button" data-cx="fk">Живу с обоими</button></div>'; return; }
        else if (a === 'fk') { var f2 = $('#forkbox'); f2.innerHTML = '<b class="mono">Записано</b><p>Выводы остаются оба. Игра не выбирает за тебя, она запомнила, как всё взвешено.</p>'; return; }
        else if (a === 'copy') { U.toast('Скопировано (в прототипе наружу не уходит)'); return; }
        else if (a === 'send') { U.toast('Отправка: в прототипе нет'); return; }
        else if (a === 'save') { U.toast('Ссылка-копия готова. В прототипе наружу не уходит'); return; }
        else if (a === 'restore') { U.toast('Восстановление: в прототипе только образец'); return; }
        screenCodex(U, { step: '' }); $('#scr-codex').scrollTop = keepScroll;
      });
    }
    return el;
  }

  /* ================= ЭКРАН: бестиарий и «Лупа дня» ================= */
  function creatureSvg(id) {
    var core = { fact: '<path d="M30 52 l9 9 24 -26" fill="none" stroke="#1C1411" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M80 22 h24 v16 h-14 l-7 7 v-7 h-3z" fill="#F6F0DF" stroke="#1C1411" stroke-width="2.2" stroke-linejoin="round"/><path d="M85 29 h14" stroke="#1C1411" stroke-width="2"/><path d="M50 66 h20" stroke="#1C1411" stroke-width="2.6" stroke-linecap="round"/>',
      recip: '<path d="M44 62 q16 10 32 0" fill="none" stroke="#1C1411" stroke-width="2.6" stroke-linecap="round"/><path d="M86 42 h20 v28 l-3.3 -3 -3.4 3 -3.3 -3 -3.4 3 -3.3 -3 -3.3 3z" fill="#F6F0DF" stroke="#1C1411" stroke-width="2.2" stroke-linejoin="round"/><path d="M91 50 h10 M91 56 h10" stroke="#1C1411" stroke-width="2"/>',
      fakec: '<path d="M16 50 h20 M16 50 l7 -6 M16 50 l7 6 M104 50 h-20 M104 50 l-7 -6 M104 50 l-7 6" fill="none" stroke="#1C1411" stroke-width="2.6" stroke-linecap="round"/><path d="M60 14 v8 M60 28 v4" stroke="#1C1411" stroke-width="2.4" stroke-dasharray="2 4" stroke-linecap="round"/><path d="M48 62 h24" stroke="#1C1411" stroke-width="2.6" stroke-linecap="round"/>',
      lest: '<path d="M20 50 q40 -30 80 0" fill="none" stroke="#1C1411" stroke-width="2.4"/><path d="M38 44 l6 6 6 -6 M72 44 l6 6 6 -6" stroke="#1C1411" stroke-width="2.2" fill="none"/><path d="M52 66 q8 8 16 0" stroke="#1C1411" stroke-width="2.4" fill="none"/><path d="M102 22 v10 M97 27 h10 M12 30 v8 M8 34 h8" stroke="#1C1411" stroke-width="2.4"/>',
      vse: '<g fill="#1C1411"><circle cx="30" cy="52" r="7"/><circle cx="60" cy="48" r="7"/><circle cx="90" cy="52" r="7"/><circle cx="45" cy="40" r="5"/><circle cx="75" cy="40" r="5"/></g><path d="M28 66 q32 10 64 0" stroke="#1C1411" stroke-width="2.4" fill="none" stroke-dasharray="3 4"/>',
      sro: '<path d="M44 26 H76 M44 70 H76" stroke="#1C1411" stroke-width="4" stroke-linecap="round"/><path d="M48 27 C48 44 72 46 72 48 S48 52 48 69 M72 27 C72 44 48 46 48 48 S72 52 72 69" fill="none" stroke="#1C1411" stroke-width="3"/><path d="M52 64 h16 l-8 -9 z" fill="#1C1411"/>',
      guilt: '<path d="M38 33 l14 4 M82 33 l-14 4" fill="none" stroke="#1C1411" stroke-width="2.4" stroke-linecap="round"/><path d="M46 47 q-6 9 0 13 q6 -4 0 -13z" fill="#8fd3ff" stroke="#1C1411" stroke-width="2.2" stroke-linejoin="round"/><path d="M47 67 q13 -10 26 0" fill="none" stroke="#1C1411" stroke-width="2.6" stroke-linecap="round"/>',
      loss: '<path d="M60 20 c2 12 20 18 20 38 a20 20 0 0 1 -40 0 c0 -9 5 -14 8 -19 3 7 8 9 10 7 -3 -12 -3 -20 2 -26z" fill="#FFC247" stroke="#1C1411" stroke-width="2.6" stroke-linejoin="round"/><path d="M60 48 c8 7 10 12 10 17 a10 10 0 0 1 -20 0 c0 -5 4 -10 10 -17z" fill="#E8432B" opacity=".9"/><path d="M52 62 h5 M64 62 h5" stroke="#1C1411" stroke-width="2.6" stroke-linecap="round"/>' };
    return '<svg class="creat" viewBox="0 0 120 84" aria-hidden="true"><ellipse cx="60" cy="78" rx="38" ry="4" fill="#1C1411" opacity=".25"/>' + (id === 'loss' ? '' : '<path d="M14 62 Q10 22 60 16 Q110 22 106 62 Q104 74 60 74 Q16 74 14 62Z" fill="#F6F0DF" stroke="#1C1411" stroke-width="3"/><circle cx="46" cy="40" r="5" fill="#1C1411"/><circle cx="74" cy="40" r="5" fill="#1C1411"/>') + core[id] + '</svg>';
  }
  /* картинки существ делает генератор (art/creature-*.webp); пока файла нет, на его месте прежний значок — подмена по событию error без битых иконок */
  var CR_IMG = { sro: 'timer', lest: 'podliza', vse: 'tolpa', fact: 'reshala', recip: 'dolzhok', fakec: 'razvilka', loss: 'ogonek', guilt: 'obidka' };
  function creature(id) {
    if (!CR_IMG[id]) return creatureSvg(id);
    return '<img class="creimg" src="' + AB + 'art/creature-' + CR_IMG[id] + '.webp" alt="" data-cr="' + id + '">';
  }
  document.addEventListener('error', function (e) {
    var t = e.target; if (!t || t.tagName !== 'IMG' || !t.classList.contains('creimg') || !t.parentNode) return;
    var d = document.createElement('div'); d.innerHTML = creatureSvg(t.getAttribute('data-cr')); t.parentNode.replaceChild(d.firstChild, t);
  }, true);
  /* игровой день и ротация: один артефакт в день. «N из M»: N — сколько артефактов игрок уже видел, M — размер пула ротации (ТЗ §7: в MVP 30; прототип показывает шесть образцов по кругу) */
  var LUPA_POOL = 30;
  var LDAY = null; /* день «Ещё одного на сегодня», заданный сценой Дела (inDay) */
  /* вне сцены: пока идёт ожидание после Дела 2 и позже — день последнего законченного выпуска, пока Дело открыто — игровой день; ожидание после первой сессии прежнее (в квесте своя лупа) */
  function lupaDay(U) { if (LDAY !== null) return LDAY; var hs = homeState(U); return Math.max(1, hs.wait && hs.n >= 3 ? U.day() - 1 : U.day()); }
  function lupaIdx(U) { var f = ex(U).lpForce; return f !== undefined ? f : (lupaDay(U) - 1) % LUPA.length; }
  /* записи просмотров лежат в s.lpH: по одной на показанный артефакт; из них считаются N, число честных просмотров и общий счёт */
  function lupaState(U, Q) {
    var s = ex(U), day = lupaDay(U), idx = lupaIdx(U), a = LUPA[idx], key = day + ':' + idx;
    if (Q) { if (!s.qlp) s.qlp = { sel: null, done: {}, ok: 0, fa: 0, ne: 0, cl: 0, ms: 0, pz: 0, pm: 0, hint: '', fin: false, res: '', honest: false, pause: false, need: LUPA_Q.zones.filter(function (z) { return z.tech; }).length }; return s.qlp; }
    s.lpH = s.lpH || {};
    if (U.opt().demo && !U.S().real && !s.lpDemo) {
      /* насыщенное демо: шесть прошлых просмотров (четыре честных, один с давлением, один паузный) */
      s.lpDemo = true;
      for (var q = 1; q <= 6; q++) s.lpH['d' + q] = { sel: null, done: {}, ok: q === 5 ? 3 : 0, fa: q === 2 ? 1 : 0, ne: q === 5 ? 1 : 0, cl: q <= 4 ? 1 : 0, ms: 0, pz: q === 6 ? 1 : 0, pm: 0, hint: '', fin: true, res: '', honest: q <= 4, pause: q === 6, need: q === 5 ? 4 : 0 };
    }
    if (!s.lpH[key]) s.lpH[key] = { sel: null, done: {}, ok: 0, fa: 0, ne: 0, cl: 0, ms: 0, pz: 0, pm: 0, hint: '', fin: false, res: '', honest: !!a.clean, pause: !!a.pause, need: a.zones.filter(function (z) { return z.tech; }).length };
    return s.lpH[key];
  }
  function lupaTotals(s) {
    var t = { views: 0, honest: 0, pause: 0, need: 0, ok: 0, ne: 0, fa: 0, pz: 0, pm: 0, ms: 0 };
    /* N и число честных просмотров считаются по всем показанным артефактам; счёт — только по законченным порциям, чтобы «Найдено 0 из 3» не подсказывало, сколько строк с давлением в открытом артефакте */
    Object.keys(s.lpH || {}).forEach(function (k) { var r = s.lpH[k]; t.views++; if (r.honest) t.honest++; if (!r.fin) return; if (r.pause) t.pause++; t.need += r.need; t.ok += r.ok; t.ne += r.ne; t.fa += r.fa; t.pz += r.pz; t.pm += r.pm; t.ms += r.ms; });
    return t;
  }
  /* лестница существа: форматы, в которых приём проверен после первого называния */
  function noteFmt(U, tech, kind) { var s = ex(U); s.fmt = s.fmt || {}; var a = s.fmt[tech] = s.fmt[tech] || []; if (a.indexOf(kind) < 0) a.push(kind); }
  function techNames(a) { return a.zones.filter(function (z) { return z.tech; }).map(function (z) { return tray(TECH_NAME[z.tech]); }).join(', '); }
  function zoneBadge(zn, done, fin) {
    if (done === 'hit') return '<span class="vizhu">' + tray(TECH_NAME[zn.tech]) + '</span>';
    if (done === 'clean' || done === 'fa') return '<span class="vizhu clean">Без подвоха</span>';
    if (done === 'pm') return '<span class="vizhu late">Пауза</span>';
    if ((done === 'name' || done === 'miss' || (fin && done === undefined)) && zn.tech) return '<span class="vizhu late">' + tray(TECH_NAME[zn.tech]) + '</span>';
    return '';
  }
  /* кнопки лотка Лупы: приёмы самого артефакта (их игрок уже встречал в сессии) и «Без подвоха» — не все семь */
  function lupaTray(a) { var t = LUPA_NAMES.filter(function (n) { return a.zones.some(function (z) { return z.tech && TECH_NAME[z.tech] === n; }); }); return t.length ? t : LUPA_NAMES; } /* у честного артефакта и у паузы приёмов нет — тогда все три названия */
  function trayHTML(a, quest) {
    var names = quest ? QUEST_TRAY : lupaTray(a);
    return '<div class="opts4">' + names.map(function (n) { return '<button class="opt" type="button" data-lp="opt" data-n="' + n + '">' + tray(n) + '</button>'; }).join('') +
      '<button class="opt clean" type="button" data-lp="opt" data-n="ЧИСТО">Без подвоха</button></div>';
  }
  /* шаг «Витрина»: лоток — приёмы, которые игрок встречал в этой сессии (из хода, чата и поимок) */
  var QUEST_TRAY = ['ЛЕСТЬ', 'ВСЕ УЖЕ', 'СРОЧНОСТЬ', 'ПЕРЕД ФАКТОМ'];
  function hintHTML(L) { return L.hint ? '<div class="hint2' + (L.hk === 'ok' ? ' good' : '') + '">' + esc(L.hint) + '</div>' : ''; }
  function lupaHTML(U) {
    var s = ex(U), L = lupaState(U), a = LUPA[lupaIdx(U)], T = lupaTotals(s);
    var z = a.zones.map(function (zn, k) {
      var done = L.done[k], shown = zoneBadge(zn, done, L.fin);
      return '<button class="lz' + (L.sel === k ? ' sel' : '') + (done !== undefined ? ' done' : '') + '" type="button" data-lp="zone" data-k="' + k + '">' + esc(zn.t) + shown + '</button>';
    }).join('');
    var tr = '';
    if (L.fin) tr = '<div class="lp-res"><b>' + L.res + '</b><p class="lp-tomorrow mono">Такое — раз в день. ' + (LDAY === 3 || homeState(U).end ? 'Следующее появится вместе с новым Делом.' : 'Следующее завтра утром.') + '</p></div>';
    else if (L.sel !== null) {
      /* первый ответ на строку остаётся: перебора нет, поэтому названия не гаснут после промаха */
      tr = '<div class="qline">Что в «' + esc(a.zones[L.sel].t) + '»?</div>' + hintHTML(L) + trayHTML(a, false);
    } else tr = hintHTML(L) + '<p class="prompt mono" style="text-align:left">Тапни строку и скажи, что в ней. Или ответь про всё сообщение: «Здесь чисто» либо «Мало данных». Первый ответ остаётся.</p>';
    /* счёт: до 5 честных просмотров только «Найдено X из Y» (ТЗ §7); индекс зоркости и ложные тревоги — после. Разбор счёта спрятан под «?» */
    var sc = '';
    if (T.honest < 5) { if (T.need) sc = '<span>Найдено ' + (T.ok + T.ne) + ' из ' + T.need + '</span>'; }
    else sc = '<span>Найдено ' + (T.ok + T.ne) + ' из ' + T.need + '</span><span>ложных тревог ' + T.fa + ' из ' + T.honest + '</span><span>имя верно ' + T.ok + ' из ' + (T.ok + T.ne) + '</span><span>пауза к месту ' + T.pz + ' из ' + T.pause + '</span>' +
      (T.pm ? '<span>промахов паузы ' + T.pm + '</span>' : '') + (T.ms ? '<span>пропущено ' + T.ms + '</span>' : '') + '<span class="idx">зоркость ' + (T.ok + T.ne - T.fa) + '</span>';
    return '<div class="lupa-card"><div class="lc-top mono"><span>Ещё одно на сегодня · минута</span><span>артефакт ' + T.views + ' из ' + LUPA_POOL + '</span></div>' +
      '<div class="artifact"><div class="af-h mono"><span>' + a.app + '</span><span>' + a.kind + '</span></div><div class="af-t">' + esc(a.head) + '</div>' + z + '</div>' + tr +
      '<div class="lp-foot"><button class="btn" type="button" data-lp="clean"' + (L.fin ? ' disabled' : '') + '>Здесь чисто</button>' +
      '<button class="btn" type="button" data-lp="few"' + (L.fin ? ' disabled' : '') + '>Мало данных</button></div>' +
      (sc ? '<div class="lp-score mono">' + sc + '</div>' : '') +
      '<details class="lp-why"><summary aria-label="Как считается счёт">?</summary><p class="lp-note">Честных сообщений не меньше трети, и «Здесь чисто» — полноценный ответ. «Мало данных» тоже: бывают сообщения, где верный ход — пауза или вопрос. Зоркость — найденное минус ложные тревоги; ошибка в названии при настоящем давлении считается отдельно. Индекс виден после пяти честных сообщений.</p></details></div>';
  }
  function lupaFin(L, res) { L.fin = true; L.res = res; L.sel = null; L.hint = ''; }
  function lupaAct(U, b, Q) {
    var L = lupaState(U, Q), a = Q ? LUPA_Q : LUPA[lupaIdx(U)], k = b.getAttribute('data-lp'), why1 = a.zones.filter(function (z2) { return z2.tech; }).map(function (z2) { return zoneWhy(z2); })[0] || '';
    var wasFin = L.fin;
    if (L.fin && k !== 'zone') { /* порция закрыта: до завтра ничего не меняется */ }
    else if (k === 'zone') { var zi0 = +b.getAttribute('data-k'); if (L.fin || L.done[zi0] !== undefined) return; L.sel = zi0; L.hint = ''; L.hk = ''; }
    else if (k === 'opt') {
      if (L.sel === null || L.done[L.sel] !== undefined) return;
      var pick = b.getAttribute('data-n'), zi = L.sel, zn = a.zones[zi], right = zn.tech ? TECH_NAME[zn.tech] : 'ЧИСТО', why = zoneWhy(zn);
      L.sel = null; L.hint = ''; L.hk = '';
      if (a.pause) { L.pm++; L.done[zi] = 'pm'; lupaFin(L, 'Тут нужна была пауза, а не ответ. ' + a.pauseWhy); } /* названный приём или «чисто» на паузном артефакте — промах паузы, не ложная тревога (§7) */
      else if (pick === right) { if (zn.tech) { L.done[zi] = 'hit'; L.ok++; if (!Q) noteFmt(U, zn.tech, a.kind); } else L.done[zi] = 'clean'; L.hint = 'Точно. ' + why; L.hk = 'ok'; }
      else if (zn.tech && pick === 'ЧИСТО') { L.ms++; L.done[zi] = 'miss'; L.hint = 'Не то. Перечитай строку: она про время, про людей или про тебя? ' + why; }
      else if (zn.tech) { L.ne++; L.done[zi] = 'name'; L.hint = 'Не то. Перечитай строку: она про время, про людей или про тебя? ' + why; }
      else { L.fa++; L.done[zi] = 'fa'; L.hint = 'Мимо. Цена не давит, она просто есть. Решать, дорого ли, — тебе.'; } /* ложная тревога без штрафа: порция не закрывается */
      if (!L.fin) {
        var all = a.zones.every(function (z2, i2) { return !z2.tech || L.done[i2] !== undefined; });
        if (a.clean) { if (a.zones.every(function (z2, i2) { return L.done[i2] === 'clean'; })) { L.cl++; lupaFin(L, 'Верно: без подвоха. Сообщение сообщает факт и оставляет выбор. Не всё, что приходит, давит.'); } }
        else if (all) { var keep = L.hint; lupaFin(L, 'Найдено: ' + L.ok + ' из ' + L.need + '.' + (a.okLine ? ' ' + a.okLine : '')); L.hint = keep; }
      }
    } else if (k === 'clean') {
      if (a.clean) { L.cl++; lupaFin(L, 'Верно: без подвоха. Сообщение сообщает факт и оставляет выбор. Не всё, что приходит, давит.'); }
      else if (a.pause) { L.pm++; lupaFin(L, 'Тут нужна была пауза, а не «Здесь чисто». ' + a.pauseWhy); }
      else { L.ms++; lupaFin(L, 'Нет, тут давят: ' + techNames(a) + '. ' + why1); }
    } else if (k === 'few') {
      if (a.pause) { L.pz++; lupaFin(L, 'Пауза к месту. ' + a.pauseWhy); }
      else { L.ms++; lupaFin(L, a.clean ? 'Данных хватало: сообщение сообщает факт и оставляет выбор.' : 'Данных хватало: тут давили (' + techNames(a) + '). ' + why1); }
    }
    var lh = b.closest('.lupa-host') || $('#lupahost'); lh.innerHTML = Q ? qlupaHTML(U) : lupaHTML(U);
  }
  /* ---------- шаг 3 квеста: «Витрина». Время видно, но мягко: вышло — просто показывается разбор.
     Две минуты, а не одна: владелец на прохождении 06.11 — «минуты мало, надо пару» (вводная, четыре строки и ответ на каждую в минуту не укладываются) ---------- */
  var QT = { t0: 0, tk: 0, secs: 120 };
  function qtLeft() { return QT.t0 ? Math.max(0, QT.secs - Math.floor((performance.now() - QT.t0) / 1000)) : QT.secs; }
  function qtFmt(sec) { return Math.floor(sec / 60) + ':' + (sec % 60 < 10 ? '0' : '') + sec % 60; }
  function qlupaHTML(U) {
    var L = lupaState(U, true), a = LUPA_Q;
    var z = a.zones.map(function (zn, k) {
      var done = L.done[k], shown = zoneBadge(zn, done, L.fin), showWhy = done !== undefined || L.expired;
      return '<button class="lz' + (L.sel === k ? ' sel' : '') + (done !== undefined ? ' done' : '') + '" type="button" data-lp="zone" data-k="' + k + '"' + (L.fin ? ' disabled' : '') + '>' + esc(zn.t) + shown + '</button>' +
        (showWhy ? '<p class="lz-why">' + leadHTML(zoneWhy(zn)) + '</p>' : '');
    }).join('');
    var tr;
    if (L.fin) tr = '<div class="lp-res"><b>' + L.res + '</b></div>';
    else if (L.sel !== null) {
      tr = '<div class="qline">Что в этой строке?</div>' + hintHTML(L) + trayHTML(a, true);
    } else tr = hintHTML(L) + '<p class="prompt mono" style="text-align:left">Тапни строку и скажи, что в ней. Если давления нет — так и скажи: «Без подвоха».</p>';
    return '<div class="lupa-card"><div class="lc-top mono"><span>Уведомление на телефоне</span><span>две минуты на всё</span></div>' +
      /* карточка перерисовывается на каждый тап — время и полоса берутся текущие, а не «с начала» */
      (L.fin ? '' : '<div class="qtimer" aria-label="Время на разбор"><b id="qtime">' + qtFmt(qtLeft()) + '</b><span class="bar"><i id="qtbar" style="transform:scaleX(' + (qtLeft() / QT.secs) + ')"></i></span></div>') +
      '<div class="artifact"><div class="af-h mono"><span class="af-store"><i class="af-logo" aria-hidden="true">В</i>' + a.app + '</span><span>' + a.kind + '</span></div><div class="af-t">' + esc(a.head) + '</div><img class="af-img" src="' + AB + 'art/hoodie.webp" alt="" onerror="this.remove()">' + z + '</div>' + tr +
      (L.fin ? '<div class="d2next"><button class="btn seen" type="button" data-q3="next">Дальше</button></div>' : '') + '</div>';
  }
  function qlExpire(U) {
    var L = lupaState(U, true); if (L.fin) return;
    L.expired = true; lupaFin(L, 'Время вышло. Вот что там было.');
    var h = $('#q3lupa'); if (h) h.innerHTML = qlupaHTML(U);
  }
  function qlTick(U, tk) {
    var L = lupaState(U, true); if (L.fin || QT.tk !== tk) return;
    var left = qtLeft(), t = $('#qtime'), bar = $('#qtbar');
    if (t) t.textContent = qtFmt(left);
    if (bar) bar.style.transform = 'scaleX(' + (left / QT.secs) + ')';
    if (left <= 0) { qlExpire(U); return; }
    U.later(function () { qlTick(U, tk); }, 250);
  }
  function qlupaMount(U, host) {
    QT.tk++; QT.t0 = performance.now(); /* отсчёт — с показа экрана; до вставки разметки, чтобы первая отрисовка взяла полное время */
    host.innerHTML ='<div class="wrap q3"><div class="q3head"><div class="kick mono"><span class="dot"></span><span>Магазин «Витрина»</span></div><h1 class="q3-h">Найди, где давят</h1>' +
      '<p class="narr q3-intro">Пока ты разбираешься с чатом, телефон, как всегда, подкидывает своё. Магазин «Витрина» очень хочет, чтобы в субботу на тебе была новая толстовка.</p>' +
      '<p class="narr q3-task">В уведомлении четыре строки. Где-то давят, где-то нет. Тапни строку и скажи, что там.</p>' +
      '<p class="narr q3-task">На всё — две минуты. Это не экзамен, просто чтобы не зависать. Не успеешь — покажем разбор, и всё.</p></div><div class="lupa-host" id="q3lupa">' + qlupaHTML(U) + '</div></div>';
    if (!host._wired) {
      host._wired = true;
      host.addEventListener('click', function (e) {
        var lp = e.target.closest('[data-lp]'), nx = e.target.closest('[data-q3="next"]');
        if (nx) { U.S().real = true; U.buzz(10); if (U.questNext) U.questNext(); return; }
        if (!lp) return;
        U.S().real = true; U.buzz(8); lupaAct(U, lp, true);
      });
    }
    qlTick(U, QT.tk);
  }
  /* лестница существа: встречен → назван → проверено в двух форматах. Ни один статус не объявляет броню */
  function ladderHTML(U, id) {
    var s = ex(U), n = ((s.fmt || {})[id] || []).length, full = n >= 2;
    return '<ol class="ladder mono" aria-label="Лестница существа"><li class="on">встречен</li><li class="on">назван</li><li class="' + (full ? 'on' : '') + '">' + (full ? 'проверено в двух форматах' : 'проверено: ' + n + ' из 2 форматов') + '</li></ol>';
  }
  function bestiaryFound(U) { var s = ex(U), b = (s.beasts || []).slice(); if (s.flameCaught && b.indexOf('loss') < 0) b.push('loss'); return b; }
  function bestiaryCards(U) {
    return bestiaryFound(U).map(function (id) {
      var b = BEASTS[id];
      return '<article class="beast' + (id === 'loss' ? ' trophy-new' : '') + '" data-c="' + id + '"><div class="b-top"><div class="b-art">' + creature(id) + '</div><div class="b-k mono">пойман · ' + b.epi + (id === 'loss' ? ' · скрытый приём игры' : '') + '</div><h3 class="rus">' + b.name + '</h3></div><div class="b-body">' +
        '<dl><dt class="mono">Чем берёт</dt><dd>' + b.power + '</dd><dt class="mono">Где водится</dt><dd>' + b.where + '</dd><dt class="mono weak">Как отшить</dt><dd>' + b.weak + '</dd></dl>' + ladderHTML(U, id) + '</div></article>';
    }).join('');
  }
  function screenBestiary(U, o) {
    cur = { name: 'bestiary', opts: o };
    var s = ex(U);
    if (o.step === 'trophy') s.flameCaught = true;
    if (o.step === 'clean') s.lpForce = 0;
    if (o.step === 'pick') { s.lpForce = 1; var L1 = lupaState(U); L1.sel = 0; }
    if (o.step === 'lp-result') { s.lpForce = 1; var L2 = lupaState(U); L2.done = { 0: 'hit', 1: 'hit', 2: 'name', 3: 'fa' }; L2.ok = 2; L2.ne = 1; L2.fa = 1; L2.fin = true; L2.res = 'Ложная тревога: эта строка честная, в ней просто факт. Сообщение сообщает и оставляет выбор.'; }
    if (o.step === 'lp-pause') { s.lpForce = 2; var L3 = lupaState(U); L3.pz = 1; L3.fin = true; L3.res = 'Пауза к месту. ' + LUPA[2].pauseWhy; }
    if (o.step === 'lp-few') { s.lpForce = 2; }
    var found = bestiaryFound(U), cards = bestiaryCards(U);
    var lock = []; for (var li = 0; li < 12 - found.length; li++) lock.push(li); lock = lock.map(function (n) { return '<div class="beast locked" aria-label="Не пойман"><div class="q rus">?</div><span class="mono">Ещё не пойман</span></div>'; }).join('');
    if (!found.length) cards = '<p class="sub emptyline">Тут живут пойманные приёмы. Поймай первого — и он появится с досье.</p>';
    var inner = '<div class="wrap bs"><div class="bs-head"><div class="kick mono"><span class="dot" style="background:var(--seen)"></span><span>Приёмы, а не люди</span></div><h1>Бестиарий</h1>' +
      '<p class="sub">Всех, кого удалось разглядеть, видно здесь — с досье: чем берёт, где водится, как отшить. Неразгаданные пока в тени. Приёмы, а не люди: ярлыков на людях здесь нет.</p>' +
      '<p class="sub ladnote">Ступени: встречен → назван → проверено в двух форматах. Верхняя ступень — не броня: приёмы возвращаются в новой упаковке.</p>' +
      '<div class="bs-count mono"><span>поймано ' + found.length + ' из 12' + (s.flameCaught ? ' · новый трофей' : '') + '</span><div class="slots" aria-hidden="true">' + (function () { var t = ''; for (var bi = 0; bi < 12; bi++) t += '<i class="' + (bi < found.length ? 'on' : '') + '"></i>'; return t; })() + '</div></div></div>' +
      '<div id="lupahost" class="lupa-host">' + lupaHTML(U) + '</div>' +
      '<div class="exam mono"><b>экзамен на зрение</b><span>раз в сезон: 12 артефактов, честных не меньше 5 · через 23 дня</span></div>' +
      '<h2 class="sect rus">Пойманные</h2><div class="beasts">' + cards + '</div>' +
      '<h2 class="sect rus">Ещё на свободе</h2><div class="lockedrow">' + lock + '</div></div>';
    var el = mount(U, 'scr-bestiary', 'bestiary', inner);
    if (!el._wired) { el._wired = true; el.addEventListener('click', function (e) { var b = e.target.closest('[data-lp]'); if (b) { U.S().real = true; U.buzz(8); lupaAct(U, b); var bh = $('.beasts'); if (bh) bh.innerHTML = bestiaryCards(U); } }); }
    return el;
  }

  /* ================= ЭКРАН: Закулисье и Пульт ================= */
  var HOOKS = [
    { id: 0, name: 'Скрытые приёмы', say: 'Игра в ослабленной дозе применяет к тебе настоящие тёмные паттерны: огонёк серии, «осталось 2 часа» и другие. Поймаешь, и приём исчезнет.', cnt: 'Живёт не дольше 7 дней, по одному за раз', eff: 'Выключишь — приёмов в интерфейсе не будет.', on: true, trap: true },
    { id: 1, name: 'Ритуал дня', say: 'Дело выходит раз в день в 07:00, чтобы было о чём поговорить, а не чтобы жить по расписанию.', cnt: 'Выпусков: 7, напоминаний нет', eff: 'Выключишь — можно играть архив подряд.', on: true },
    { id: 2, name: 'Бустеры приёмов', say: 'Приём возвращается через 3–7, 14 и 30 дней в другой упаковке. Это повтор, и ты можешь его отключить.', cnt: 'Запланировано возвратов: 3', eff: 'Выключишь — приёмы сами не возвращаются.', on: true },
    { id: 3, name: 'Засада', say: 'Друг по ссылке ловит приёмы за 60 секунд. Без табло и без «друг тебя обогнал».', cnt: 'Отправлено приглашений: 0', eff: 'Выключишь — приглашений нет.', on: true },
    { id: 4, name: 'Эхо выбора', say: 'Игра помнит твои ходы: «вчера был вопрос: кто эти все?». Только на этом устройстве.', cnt: 'Запомнено ходов: 4', eff: 'Выключишь — игра всё забывает.', on: true },
    { id: 5, name: 'Как выбрали другие', say: 'После Развилки видно, как выбрали другие. Показываем, только если ответили 30+ человек. Это «все уже» в хорошей упаковке, поэтому ты видишь его и можешь выключить.', cnt: 'Показано раз: 0', eff: 'Выключишь — чужих процентов не видно.', on: true },
    { id: 6, name: 'Пуш', say: 'Один в день, нейтральный: «Дело дня готово». В окне с 16 до 20.', cnt: 'Отправлено: 0', eff: 'Включишь — придёт один пуш в день.', on: false },
    { id: 7, name: 'След вместо серии', say: 'Настоящий счётчик — дни с находкой. Он ничего не сжигает при пропуске.', cnt: 'Дней с находкой: 2', eff: 'Выключишь — счётчик скрыт.', on: true }
  ];
  function bsRig() {
    var svg = '<rect x="14" y="20" width="492" height="10" rx="2" fill="#1C1411"/><rect x="254" y="-6" width="10" height="30" fill="#1C1411"/>';
    for (var i = 0; i < 9; i++) {
      var px = 38 + i * 55, tx = 260 + (i - 4) * 9, ty = 122, bx = px + (tx - px) * 0.38, by = 25 + (ty - 25) * 0.38;
      svg += '<circle cx="' + px + '" cy="25" r="3" fill="#F6F0DF"/><path d="M' + px + ' 25 L' + tx + ' ' + ty + '" fill="none" stroke="#1C1411" stroke-width="1.8" stroke-dasharray="5 4"/>' +
        '<g transform="translate(' + (bx - 13) + ' ' + (by - 11) + ')"><rect width="26" height="22" fill="#F6F0DF" stroke="#1C1411" stroke-width="2"/><text x="13" y="16" text-anchor="middle" font-family="Golos Text" font-weight="700" font-size="13" fill="#19A39B">' + (i + 1) + '</text></g>';
    }
    svg += '<g transform="translate(260 124)"><circle cy="14" r="17" fill="#1C1411"/><path d="M-26 74 Q-24 40 0 36 Q24 40 26 74 Z" fill="#1C1411"/><path d="M-30 74 H30" stroke="#F6F0DF" stroke-width="2"/><circle cx="-5" cy="17" r="2" fill="#F6F0DF"/><circle cx="6" cy="17" r="2" fill="#F6F0DF"/></g><rect x="214" y="190" width="92" height="6" fill="#19A39B"/>';
    return svg;
  }
  function screenBackstage(U, o) {
    cur = { name: 'backstage', opts: o };
    var s = ex(U), cx = cxInit(U);
    if (U.day() < 7) {
      /* Закулисье заперто до седьмого игрового дня: прямой переход по адресу показывает только замок */
      mount(U, 'scr-backstage', 'backstage', '<div class="wrap"><div class="locked"><h1>Закулисье</h1><p>Пока закрыто. Откроется на седьмой игровой день.</p><a class="btn seen" href="#s=home">К Делу</a></div></div>');
      return;
    }
    if (o.step === 'caught') s.flameCaught = true;
    swInit(s);
    var caught = s.flameCaught ? 1 : 0;
    /* Р15: Закулисье раскрывает только ловушки, которые этому игроку действительно показывались (история показов); остальные — строкой «спрятано ещё N» */
    var shownIds = o.step === 'fresh' ? ['flame'] : (!U.S().real ? ['flame', 'two', 'five'] : (s.shown || []).slice());
    var listed = TRAPS.filter(function (t) { return shownIds.indexOf(t.id) >= 0; });
    var tr = listed.map(function (t) {
      var st = t.id === 'flame' ? (s.flameCaught ? 'caught' : 'open') : 'revealed';
      var lab = { caught: 'пойман тобой', open: 'ещё висит · раскрыто здесь', revealed: 'не пойман · раскрыто здесь' }[st];
      return '<li class="trap ' + st + '"><span class="tdot"></span><div><b>' + t.name + '</b><em class="mono">' + lab + '</em><p>Игра говорила: «' + t.says + '» ' + t.truth + '</p><small class="mono">где был след: ' + t.trace + '</small></div></li>';
    }).join('');
    /* ловушки сезона 2 (s2) не считаются: Закулисье не раскрывает будущее */
    var hidN = TRAPS.filter(function (t) { return !t.s2 && shownIds.indexOf(t.id) < 0; }).length;
    if (hidN > 0) tr += '<li class="trap later more"><span class="tdot"></span><div><b>Спрятано ещё ' + hidN + '</b><em class="mono">этому игроку пока не показывались</em></div></li>';
    var hooks = HOOKS.map(function (h) {
      var on = s.sw[h.id];
      return '<article class="hook' + (on ? '' : ' off') + '" data-h="' + h.id + '"><span class="no">' + (h.id + 1) + '</span><div class="tt"><h3>' + h.name + '</h3><button class="sw" type="button" role="switch" aria-checked="' + on + '" aria-label="' + h.name + '"></button></div>' +
        '<p>' + h.say + '</p><div class="cnt mono">' + h.cnt + '</div><div class="eff">' + h.eff + '</div></article>';
    }).join('');
    var cs = allCands(U), fits = cs.filter(function (c) { return c.fit; }).length, own = cx.crumbs.filter(function (c) { return c.own && c.status === 'mine'; }).length;
    var pairs = 0; cx.crumbs.forEach(function (c) { var q = c.contra && crumbBy(cx, c.contra); if (q && c.status === 'mine' && q.status === 'mine' && c.id < q.id && tensOn(cx, c)) pairs++; });
    var inner = '<div class="bs-band"><div class="bs-in"><div class="ttl"><div class="kick mono"><span class="dot"></span><span>День 7 · изнанка сцены</span></div><h1>Закулисье</h1>' +
      '<div class="bs-quote"><span class="tape mono">занавес поднят</span><div class="who mono">Как это сделано</div><q>Всю неделю игра в малой дозе давила на тебя. Вот где, и вот рубильники.</q></div></div>' +
      '<svg class="bs-rig" viewBox="0 0 520 200" aria-hidden="true">' + bsRig() + '</svg></div></div>' +
      '<div class="wrap"><div class="score">' + (listed.length ? '<b>' + caught + ' из ' + listed.length + '</b><span>показанных скрытых приёмов поймано твоей лупой. Остальные из показанных игра раскрывает сама.</span>' : '<b>0</b><span>скрытых приёмов тебе пока не показывали, поэтому раскрывать нечего.</span>') + '</div>' +
      '<h2 class="sect rus">Что на тебя применяли</h2><ul class="traps">' + tr + '</ul>' +
      '<h2 class="sect rus">Пульт</h2><p class="sub" style="margin-top:4px">Каждый крючок можно выключить, игра останется игрой.</p><div class="hooks" id="hooks">' + hooks + '</div>' +
      '<h2 class="sect rus">Твой путь</h2><p class="sub" style="margin-top:4px">Цифры видишь только ты, они считаются на устройстве. Это не оценка.</p>' +
      '<div class="stats"><div><b>' + fits + ' из ' + cs.length + '</b><span>выводов подправлено под себя</span></div><div><b>' + cx.revisit + '</b><span>пересмотр: вывод возвращён из корзины</span></div><div><b>' + pairs + '</b><span>противоречия держишь осознанно</span></div><div><b>' + own + '</b><span>своя формулировка в кодексе</span></div></div>' +
      '<p class="lgnote">В школьном пилоте до старта и через три недели учитель раздаёт на бумаге шесть коротких пунктов. Это вне игры: игра ответов не видит.</p>' +
      '<div class="instead"><h2>Что делать вместо</h2><p>Назови приём вслух, и у тебя появляется время проверить. «Все уже» превращается в «а кто именно?», «срочно» — в «до какого часа это правда?».</p><p class="t">Игра прошла тот же тест: каждый приём назван, и каждый выключается.</p></div>' +
      '<div class="help"><b>Если тяжело</b><span>Детский телефон доверия, бесплатно и анонимно: <strong>8-800-2000-122</strong>. Игра не заменяет разговор с живым человеком.</span></div>' +
      '<p class="endline rus">Зоркость не броня. Она работает, пока проверяешь.</p></div>';
    var el = mount(U, 'scr-backstage', 'backstage', inner);
    if (!el._wired) {
      el._wired = true;
      el.addEventListener('click', function (e) {
        var sw = e.target.closest('.sw'); if (!sw) return;
        var art = sw.closest('.hook'), id = +art.getAttribute('data-h'), s2 = ex(U); U.S().real = true;
        s2.sw[id] = !s2.sw[id]; sw.setAttribute('aria-checked', s2.sw[id]); art.classList.toggle('off', !s2.sw[id]); U.buzz(10);
        if (id === 0) { s2.traps = s2.sw[0]; if (!s2.sw[0]) U.toast('Скрытых приёмов больше не будет'); $$('.flame').forEach(function (f) { f.style.display = s2.sw[0] ? '' : 'none'; }); }
      });
    }
  }

  /* ================= ЭКРАН: «Что это было» — разоблачение спрятанного приёма, который игрок не заметил за отведённые дни (заход D, 11.6) ================= */
  function screenWhatWas(U, o) {
    cur = { name: 'whatwas', opts: o };
    mount(U, 'scr-backstage', 'backstage', '<div class="wrap whatwas"><h1>Что это было</h1>' +
      '<p class="narr">Последние дни в углу экрана горел огонёк с цифрой: «Серия сгорит, если не зайти до полуночи». Ничего бы не сгорело. Серия — просто число, а огонёк пугал потерей и при этом даже не звал играть.</p>' +
      '<p class="narr">Это был приём. Игра спрятала его нарочно — чтобы было кого ловить. Этот ушёл, но таких ещё несколько. Смотри внимательнее.</p>' +
      '<p class="pr-b">' + esc(TRAPS[0].truth) + '</p>' +
      '<div class="d2btns"><a class="btn seen" href="#s=home">Понятно</a><a class="btn" href="#s=bestiary">Что ещё спрятано?</a></div></div>');
  }

  var EXT = window.EXT = { dowOf: dowOf, nextLabel: nextLabel, rawMode: rawMode, VIEWS: VIEWS, TONE: TONE, TRAPS: TRAPS, BEASTS: BEASTS, MOVES: MOVES, CLIFF: CLIFF, d2rows: d2rows, debtRows: debtRows, DEBT: DEBT, SCENES: SCENES, REVEAL: REVEAL, ASK_DANYA: ASK_DANYA, d2state: d2state, markPressure: markPressure, questScene: questScene, qlupaMount: qlupaMount, qlExpire: qlExpire, lupaStateQ: function (U) { return lupaState(U, true); }, LUPA_Q: LUPA_Q, beastTag: beastTag, creature: creature, VERDICTS: VERDICTS, LUPA: LUPA, weekCells: weekCells, modeOf: modeOf, TIMUR_D2: TIMUR_D2, counts: function (U) { return EXT_counts(U); }, crCard: crCard, crAct: crAct, costHTML: costHTML, monoHTML: monoHTML, hotyaHTML: hotyaHTML, tray: tray, TRAY: TRAY, cliff3: cliff3, cliff4: cliff4, PAINT: PAINT, paintRows: paintRows, LEVA_D3: LEVA_D3, CLAIM_KASSA: CLAIM_KASSA, leadHTML: leadHTML, QUEST_TRAY: QUEST_TRAY, zoneWhy: zoneWhy, words: words, slotsHTML: slotsHTML, sphName: sphName,
    screens: { whatwas: screenWhatWas, lupa: function (U, o) { return screenBestiary(U, { step: 'lp-' + (o.step || 'result') }); }, home: screenHome, settings: screenSettings, day2: screenDay2, day3: screenDay3, codex: screenCodex, bestiary: screenBestiary, backstage: screenBackstage } };
})();
