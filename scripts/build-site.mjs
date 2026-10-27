// Собирает статические страницы сайта из scripts/site-data.mjs:
//   index.html, uslugi/index.html, uslugi/<slug>/index.html, sitemap.xml
// Запуск: node scripts/build-site.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { site, niches, groups, services, cases, demos, guarantees, homeFaq } from './site-data.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const NB = '\u00A0';
const HOME_ACCENT = '#CFF24A';

const svcBySlug = Object.fromEntries(services.map((s) => [s.slug, s]));
const itemById = Object.fromEntries([...cases, ...demos].map((x) => [x.id, x]));

const escAttr = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// Для видимого текста: ещё и не даём переносить строку внутри «3–7» и перед тире
const esc = (s) =>
    escAttr(s)
        .replace(/(\d)–(\d)/g, '$1–⁠$2')
        .replace(/ — /g, `${NB}— `);
const money = (n) => n.toLocaleString('ru-RU').replace(/\s/g, NB);
const price = (n, per) => (n == null ? 'по ТЗ' : `от${NB}${money(n)}${NB}₽${per ? ` ${per}` : ''}`);
const tgUrl = (text) => `https://t.me/${site.telegram}?text=${encodeURIComponent(text)}`;
const mailUrl = (subject) => `mailto:${site.email}?subject=${encodeURIComponent(subject)}`;
const svcText = (s) => `Здравствуйте! Пишу с сайта, интересует услуга «${s.name}». `;
const GENERAL_TEXT = 'Здравствуйте! Пишу с сайта, хочу обсудить проект. ';

// Иконки в стиле Lucide: 24×24, обводка
const ICONS = {
    layout: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M7 13h6M7 16h10"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><circle cx="8.5" cy="12" r="2.5"/><path d="M14 10h4.5M14 14h3"/>',
    building: '<path d="M3 21h18M5 21V7l7-4v18M19 21V10l-7-3"/><path d="M8.5 10v.01M8.5 14v.01M8.5 18v.01M15.5 13v.01M15.5 17v.01"/>',
    bag: '<path d="M6 7h12l1 14H5L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
    send: '<path d="M21.5 3 10.5 14"/><path d="M21.5 3 14.5 21l-4-7-7-4 18-7z"/>',
    sparkles: '<path d="M12 3l1.8 4.9 4.9 1.8-4.9 1.8L12 16.4l-1.8-4.9-4.9-1.8 4.9-1.8L12 3z"/><path d="M18.5 15l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',
    flow: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><path d="M10 6.5h3.5a3 3 0 0 1 3 3V14"/>',
    grid: '<rect x="3" y="3" width="7.5" height="9" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="5" rx="1.5"/><rect x="13.5" y="11" width="7.5" height="10" rx="1.5"/><rect x="3" y="15" width="7.5" height="6" rx="1.5"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowUp: '<path d="M7 17 17 7M8 7h9v9"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    mail: '<rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="m3 6 9 7 9-7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
};
const icon = (name, cls = 'ic') =>
    `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

const ldJson = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

const provider = { '@type': 'ProfessionalService', name: site.brand, url: `${site.url}/`, email: site.email, areaServed: 'RU' };

const faqLd = (items) => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});

/* ---------- Каркас страницы ---------- */

function layout({ root, urlPath, title, description, accent, og, jsonld = [], body, bodyClass = '' }) {
    const canonical = `${site.url}/${urlPath}`;
    return `<!DOCTYPE html>
<html lang="ru" data-ym="${site.metrikaId}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escAttr(title)}</title>
<meta name="description" content="${escAttr(description)}">
<link rel="canonical" href="${canonical}">
<meta name="theme-color" content="#0E0E0D">
<meta property="og:type" content="website">
<meta property="og:locale" content="ru_RU">
<meta property="og:site_name" content="${site.brand}">
<meta property="og:url" content="${canonical}">
<meta property="og:title" content="${escAttr(title)}">
<meta property="og:description" content="${escAttr(description)}">
<meta property="og:image" content="${site.url}/assets/og/${og}.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${root}assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Unbounded:wght@500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${root}css/site.css">
<script>document.documentElement.classList.add('js')</script>
${jsonld.map(ldJson).join('\n')}
</head>
<body class="${bodyClass}" style="--accent:${accent}">
<a class="skip" href="#main">Перейти к содержимому</a>
${header(root)}
<main id="main">
${body}
</main>
${footer(root)}
<script src="${root}js/site.js" defer></script>
</body>
</html>
`;
}

function header(root) {
    const home = root || './';
    const ddGroups = groups
        .map(
            (g) => `<div class="dd__col">
                <p class="dd__title">${esc(g.title)}</p>
                ${services
                    .filter((s) => s.group === g.id)
                    .map(
                        (s) => `<a class="dd__link" href="${root}uslugi/${s.slug}/" style="--c:${s.accent}">
                    <span class="dd__ic">${icon(s.icon)}</span>
                    <span><span class="dd__name">${esc(s.name)}</span><span class="dd__price">${price(s.from)}</span></span>
                </a>`
                    )
                    .join('')}
            </div>`
        )
        .join('');
    const mobileLinks = services
        .map((s) => `<a class="mnav__svc" href="${root}uslugi/${s.slug}/" style="--c:${s.accent}"><span class="mnav__dot"></span>${esc(s.name)}<span class="mnav__price">${price(s.from)}</span></a>`)
        .join('');
    return `<header class="hdr" data-hdr>
    <div class="wrap hdr__in">
        <a class="logo" href="${home}" aria-label="HVZEweb — на главную">HVZE<span>web</span></a>
        <nav class="nav" aria-label="Основное меню">
            <div class="nav__dd">
                <a class="nav__a" href="${root}uslugi/">Услуги ${icon('chevron', 'ic ic--chev')}</a>
                <div class="dd"><div class="dd__in">${ddGroups}</div></div>
            </div>
            <a class="nav__a" href="${root}#portfolio">Работы</a>
            <a class="nav__a" href="${root}#ceny">Цены</a>
            <a class="nav__a" href="${root}#faq">Вопросы</a>
        </nav>
        <a class="btn btn--accent btn--sm hdr__cta" href="${tgUrl(GENERAL_TEXT)}" target="_blank" rel="noopener" data-goal="cta_telegram" data-place="header">Обсудить проект</a>
        <button class="burger" type="button" aria-expanded="false" aria-controls="mnav" aria-label="Открыть меню" data-burger><span></span><span></span></button>
    </div>
    <div class="mnav" id="mnav" data-mnav>
        <div class="wrap">
            <p class="mnav__title">Услуги</p>
            <div class="mnav__svcs">${mobileLinks}</div>
            <div class="mnav__links">
                <a href="${root}#portfolio">Работы</a>
                <a href="${root}#ceny">Цены</a>
                <a href="${root}#faq">Вопросы</a>
                <a href="${root}#contacts">Контакты</a>
            </div>
            <a class="btn btn--accent btn--block" href="${tgUrl(GENERAL_TEXT)}" target="_blank" rel="noopener" data-goal="cta_telegram" data-place="mobile_menu">Написать в Telegram</a>
        </div>
    </div>
</header>`;
}

function footer(root) {
    const cols = groups
        .map(
            (g) => `<div class="ftr__col">
            <p class="ftr__title">${esc(g.title)}</p>
            ${services
                .filter((s) => s.group === g.id)
                .map((s) => `<a href="${root}uslugi/${s.slug}/">${esc(s.name)}</a>`)
                .join('')}
        </div>`
        )
        .join('');
    return `<footer class="ftr">
    <div class="wrap">
        <div class="ftr__top">
            <div class="ftr__brand">
                <a class="logo logo--lg" href="${root || './'}">HVZE<span>web</span></a>
                <p>Сайты, Telegram-боты, ИИ-консультанты и автоматизация для малого бизнеса. Работаю удалённо по всей России.</p>
                <div class="ftr__contacts">
                    <a href="https://t.me/${site.telegram}" target="_blank" rel="noopener" data-goal="cta_telegram" data-place="footer">Telegram @${site.telegram}</a>
                    <a href="mailto:${site.email}" data-goal="cta_email" data-place="footer">${site.email}</a>
                </div>
            </div>
            ${cols}
        </div>
        <div class="ftr__bottom">
            <span>© 2026 ${site.brand}</span>
            <a href="${root}privacy.html">Политика конфиденциальности</a>
        </div>
    </div>
</footer>`;
}

/* ---------- Блоки ---------- */

function secHead(kicker, title, lead = '', cls = '') {
    return `<div class="sec__head ${cls}">
        <p class="kicker rv">${kicker}</p>
        <h2 class="h2 rv">${title}</h2>
        ${lead ? `<p class="sec__lead rv">${lead}</p>` : ''}
    </div>`;
}

function serviceCard(s, root) {
    return `<a class="scard rv" href="${root}uslugi/${s.slug}/" style="--c:${s.accent}">
        <span class="scard__bg" aria-hidden="true">${icon(s.icon)}</span>
        <span class="scard__ic">${icon(s.icon)}</span>
        <span class="scard__name">${esc(s.name)}</span>
        <span class="scard__text">${esc(s.short)}</span>
        <span class="scard__foot">
            <span class="scard__price">${price(s.from)}</span>
            <span class="scard__days">${esc(s.days)}</span>
            <span class="scard__go">${icon('arrow')}</span>
        </span>
    </a>`;
}

function servicesByGroup(root) {
    return groups
        .map((g) => {
            const list = services.filter((s) => s.group === g.id);
            return `<div class="sgroup">
            <div class="sgroup__head rv">
                <h3 class="h3">${esc(g.title)}</h3>
                <p>${esc(g.text)}</p>
            </div>
            <div class="scards" style="--n:${list.length}">${list.map((s) => serviceCard(s, root)).join('')}</div>
        </div>`;
        })
        .join('');
}

function caseCard(c, root) {
    const svc = svcBySlug[c.service];
    return `<article class="case rv" style="--c:${c.accent}">
        <div class="case__top">
            <span class="tag">${esc(c.kind)}</span>
            ${svc ? `<a class="case__svc" href="${root}uslugi/${svc.slug}/">${esc(svc.name)} ${icon('arrow')}</a>` : ''}
        </div>
        <div class="case__metric"><b>${esc(c.metric[0])}</b><span>${esc(c.metric[1])}</span></div>
        <h3 class="case__title">${esc(c.title)}</h3>
        <ul class="case__pts">${c.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
        <div class="case__foot">
            <div class="chips">${c.stack.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>
            ${c.link ? `<a class="case__link" href="${c.link}" target="_blank" rel="noopener">Открыть ${icon('arrowUp')}</a>` : ''}
        </div>
    </article>`;
}

function demoCard(d, root) {
    const href = /^https?:/.test(d.href) ? d.href : `${root}${d.href}`;
    return `<a class="demo rv" href="${href}" target="_blank" rel="noopener">
        <span class="demo__img"><img src="${root}${d.img}" alt="${esc(`${d.kind}: ${d.title}`)}" width="800" height="500" loading="lazy"></span>
        <span class="demo__meta">
            <span><span class="demo__kind">${esc(d.kind)}</span><span class="demo__title">${esc(d.title)}</span></span>
            <span class="demo__go">${icon('arrowUp')}</span>
        </span>
    </a>`;
}

function exampleCard(id, root) {
    const item = itemById[id];
    if (!item) throw new Error(`Нет примера ${id}`);
    return id.startsWith('demo-') ? demoCard(item, root) : caseCard(item, root);
}

function steps(list) {
    return `<ol class="steps">${list
        .map(
            (s, i) => `<li class="step rv">
            <span class="step__n">${String(i + 1).padStart(2, '0')}</span>
            <span class="step__t">${esc(s.t)}</span>
            <span class="step__d">${esc(s.d)}</span>
        </li>`
        )
        .join('')}</ol>`;
}

function guaranteeList() {
    return `<div class="guar">${guarantees
        .map(
            (g) => `<div class="guar__item rv">
            <span class="guar__ic">${icon('check')}</span>
            <span><span class="guar__t">${esc(g.t)}</span><span class="guar__d">${esc(g.d)}</span></span>
        </div>`
        )
        .join('')}</div>`;
}

function faqList(items) {
    return `<div class="faq">${items
        .map(
            (f) => `<details class="faq__item rv">
            <summary><span>${esc(f.q)}</span>${icon('plus', 'ic faq__ic')}</summary>
            <p>${esc(f.a)}</p>
        </details>`
        )
        .join('')}</div>`;
}

function contactSection(root, current) {
    const options = [
        `<option value="">Пока не знаю, подскажите</option>`,
        ...groups.map(
            (g) => `<optgroup label="${esc(g.title)}">${services
                .filter((s) => s.group === g.id)
                .map((s) => `<option value="${esc(s.name)}"${current?.slug === s.slug ? ' selected' : ''}>${esc(s.name)} — ${price(s.from)}</option>`)
                .join('')}</optgroup>`
        ),
    ].join('');
    const subject = current ? `Заявка с сайта: ${current.name}` : 'Заявка с сайта';
    return `<section class="sec sec--dark contact" id="contacts">
    <div class="contact__glow" aria-hidden="true"></div>
    <div class="wrap contact__in">
        <div class="contact__copy">
            <p class="kicker rv">Обсудим задачу</p>
            <h2 class="h2 rv">Расскажите о&nbsp;задаче&nbsp;— пришлю план и&nbsp;цену</h2>
            <p class="sec__lead rv">Отвечаю в течение дня, обычно быстрее. Смета бесплатно и ни к чему не обязывает.</p>
            <div class="contact__links rv">
                <a class="clink" href="${tgUrl(current ? svcText(current) : GENERAL_TEXT)}" target="_blank" rel="noopener" data-goal="cta_telegram" data-place="contacts"${current ? ` data-service="${current.slug}"` : ''}>
                    <span class="clink__ic">${icon('send')}</span>
                    <span><span class="clink__label">Telegram</span><span class="clink__val">@${site.telegram}</span></span>
                </a>
                <a class="clink" href="${mailUrl(subject)}" data-goal="cta_email" data-place="contacts"${current ? ` data-service="${current.slug}"` : ''}>
                    <span class="clink__ic">${icon('mail')}</span>
                    <span><span class="clink__label">Почта</span><span class="clink__val">${site.email}</span></span>
                </a>
            </div>
        </div>
        <form class="brief rv" data-brief data-tg="${site.telegram}" data-email="${site.email}"${current ? ` data-service="${current.slug}"` : ''} novalidate>
            <p class="brief__title">Быстрый бриф</p>
            <label class="fld"><span class="fld__l">Что нужно</span>
                <select name="service">${options}</select>
            </label>
            <label class="fld"><span class="fld__l">Коротко о задаче</span>
                <textarea name="task" rows="4" placeholder="Например: сайт для автосервиса с онлайн-записью"></textarea>
            </label>
            <label class="fld"><span class="fld__l">Когда нужно</span>
                <select name="deadline">
                    <option>Не горит, хочу узнать цену</option>
                    <option>В течение месяца</option>
                    <option>В течение двух недель</option>
                    <option>Срочно</option>
                </select>
            </label>
            <div class="brief__btns">
                <button class="btn btn--accent" type="submit" value="tg">${icon('send')} Отправить в Telegram</button>
                <button class="btn btn--ghost" type="submit" value="mail">${icon('mail')} На почту</button>
            </div>
            <p class="brief__note">Откроется Telegram или почта с готовым сообщением — останется нажать «Отправить».</p>
        </form>
    </div>
</section>`;
}

/* ---------- Визуалы в шапке ---------- */

function ntf({ title, lines = [], buttons = [], draft, bars }, cls = '') {
    return `<div class="ntf ${cls}">
        <div class="ntf__head"><span class="ntf__av">${icon('send')}</span><span class="ntf__t">${esc(title)}</span><span class="ntf__time">сейчас</span></div>
        ${lines.map((l) => `<p class="ntf__l">${esc(l)}</p>`).join('')}
        ${draft ? `<p class="ntf__draft"><span>Черновик ответа</span>${esc(draft)}</p>` : ''}
        ${bars ? `<div class="ntf__bars">${bars.map(([l, v]) => `<div class="ntf__bar"><span>${esc(l)}</span><i style="--w:${v}%"></i></div>`).join('')}</div>` : ''}
        ${buttons.length ? `<div class="ntf__btns">${buttons.map((b) => `<span>${esc(b)}</span>`).join('')}</div>` : ''}
    </div>`;
}

function browserMock(img, url, alt, root, cls = '') {
    return `<figure class="mock ${cls}">
        <div class="mock__bar"><i></i><i></i><i></i><span>${esc(url)}</span></div>
        <img src="${root}${img}" alt="${esc(alt)}" width="1280" height="800">
    </figure>`;
}

function visual(s, root) {
    const v = s.visual;
    if (v.type === 'browser') {
        return `<div class="art art--browser">
            ${browserMock(v.img, v.url, v.alt, root, 'mock--main')}
            ${ntf({ title: 'Новая заявка с сайта', lines: ['Ольга · +7 9•• •••-••-48', '«Хочу узнать цену»'] }, 'ntf--float')}
        </div>`;
    }
    if (v.type === 'chat') {
        const msgs = v.messages
            .map((m) =>
                m.from === 'buttons'
                    ? `<div class="chat__btns">${m.items.map((b) => `<span>${esc(b)}</span>`).join('')}</div>`
                    : `<p class="chat__m chat__m--${m.from}">${esc(m.text)}</p>`
            )
            .join('');
        return `<div class="art art--chat">
            <div class="chat">
                <div class="chat__head"><span class="chat__av">${icon(s.icon)}</span><span><b>${esc(v.title)}</b><small>${esc(v.sub)}</small></span></div>
                <div class="chat__body">${msgs}</div>
            </div>
            ${v.notify ? ntf(v.notify, 'ntf--below') : ''}
        </div>`;
    }
    if (v.type === 'notify-stack') {
        return `<div class="art art--stack">${v.cards.map((c, i) => ntf(c, `ntf--stack ntf--s${i}`)).join('')}</div>`;
    }
    if (v.type === 'dashboard') {
        const bars = [38, 52, 44, 68, 58, 82, 74];
        return `<div class="art art--dash">
            <div class="dash">
                <div class="dash__side"><span class="dash__logo"></span><i class="is-on"></i><i></i><i></i><i></i></div>
                <div class="dash__main">
                    <div class="dash__top"><b>Сводка</b><span>за неделю</span></div>
                    <div class="dash__kpis">
                        <div><small>Заявки</small><b>128</b><em>+12%</em></div>
                        <div><small>Сделки</small><b>34</b><em>+5%</em></div>
                        <div><small>Задачи</small><b>17</b><em class="is-warn">3 горят</em></div>
                    </div>
                    <div class="dash__chart">${bars.map((h) => `<i style="--h:${h}%"></i>`).join('')}</div>
                    <div class="dash__rows">
                        <div><span class="dot dot--g"></span>ООО «Вектор» · счёт оплачен<b>48 000 ₽</b></div>
                        <div><span class="dot dot--y"></span>ИП Смирнова · ждёт ответа<b>12 500 ₽</b></div>
                        <div><span class="dot dot--g"></span>Кафе «Лето» · договор<b>30 000 ₽</b></div>
                    </div>
                </div>
            </div>
            ${ntf({ title: 'Задача просрочена', lines: ['Позвонить клиенту «Вектор»'], buttons: ['Открыть'] }, 'ntf--float')}
        </div>`;
    }
    return '';
}

/* ---------- Страницы ---------- */

function homePage() {
    const root = '';
    const hero = `<section class="hero hero--home">
    <div class="hero__bg" aria-hidden="true"><div class="hero__glow"></div><div class="hero__grid"></div></div>
    <div class="wrap hero__in">
        <div class="hero__copy">
            <p class="eyebrow rv"><span class="pulse"></span>Принимаю новые проекты</p>
            <h1 class="h1 rv">Сайты, боты и&nbsp;ИИ, которые приносят <em>заявки</em></h1>
            <p class="lead rv">Делаю под ключ для малого бизнеса: от лендинга за 3 дня до ИИ-консультанта, который отвечает клиентам ночью. Заявки сразу приходят вам в Telegram.</p>
            <div class="hero__cta rv">
                <a class="btn btn--accent btn--lg" href="${tgUrl(GENERAL_TEXT)}" target="_blank" rel="noopener" data-goal="cta_telegram" data-place="hero">${icon('send')} Обсудить проект</a>
                <a class="btn btn--ghost btn--lg" href="#uslugi">Услуги и цены</a>
            </div>
            <ul class="facts rv">
                <li><b>от 2${NB}000${NB}₽</b><span>Telegram-бот</span></li>
                <li><b>от 3${NB}000${NB}₽</b><span>сайт под ключ</span></li>
                <li><b>1–7 дней</b><span>типовой проект</span></li>
                <li><b>50 / 50</b><span>оплата по факту</span></li>
            </ul>
        </div>
        <div class="hero__art" aria-hidden="true">
            <div class="collage">
                ${browserMock('assets/portfolio/previews/example-corporate.jpg', 'atlas-build.ru', '', root, 'mock--back')}
                ${browserMock('assets/portfolio/previews/example-landing.jpg', 'pulse-fitness.ru', '', root, 'mock--front')}
                ${ntf({ title: 'Новая заявка', lines: ['Анна · Маникюр · завтра 14:00', '+7 9•• •••-••-12'], buttons: ['Ответить', 'В работу'] }, 'ntf--hero')}
                <div class="badge-float"><span class="pulse"></span>Бот отвечает 24/7</div>
            </div>
        </div>
    </div>
</section>
<div class="ticker" aria-label="Для кого делаю">
    <div class="ticker__track">${[...niches, ...niches].map((n) => `<span>${esc(n)}</span>`).join('')}</div>
</div>`;

    const servicesSec = `<section class="sec" id="uslugi">
    <div class="wrap">
        ${secHead('01 — Услуги', 'Что я делаю', 'У каждой услуги своя страница: что входит, цены, примеры и ответы на частые вопросы.')}
        ${servicesByGroup(root)}
    </div>
</section>`;

    const workSec = `<section class="sec sec--dark" id="portfolio">
    <div class="wrap">
        ${secHead('02 — Работы', 'Реальные проекты', 'Заказы клиентов, собственные инструменты и концепты. Скриншоты и подробности по похожим задачам покажу в переписке.')}
        <div class="cases">${cases.map((c) => caseCard(c, root)).join('')}</div>
        <div class="sub-head rv">
            <h3 class="h3">Демо: так может выглядеть ваш проект</h3>
            <p>Интерактивные примеры — открываются в новой вкладке.</p>
        </div>
        <div class="demos">${demos.map((d) => demoCard(d, root)).join('')}</div>
    </div>
</section>`;

    const processSec = `<section class="sec" id="process">
    <div class="wrap">
        ${secHead('03 — Как работаем', 'Прозрачно на каждом шаге', 'Цена и срок фиксируются до начала работ, а остаток оплаты — только после приёмки.')}
        ${steps([
            { t: 'Обсуждаем задачу', d: 'Пишете пару слов о бизнесе, я задаю уточняющие вопросы. Бесплатно.' },
            { t: 'Смета и срок', d: 'Фиксирую цену, срок и что входит. Без доплат «по ходу».' },
            { t: 'Разработка', d: 'Предоплата 50%. Показываю промежуточный результат, вносим правки.' },
            { t: 'Запуск и передача', d: 'Запускаю, передаю доступы и инструкцию. Остаток — после приёмки.' },
        ])}
        ${guaranteeList()}
    </div>
</section>`;

    const priceRows = groups
        .map((g) =>
            services
                .filter((s) => s.group === g.id)
                .map(
                    (s) => `<a class="prow rv" href="uslugi/${s.slug}/" style="--c:${s.accent}">
                <span class="prow__ic">${icon(s.icon)}</span>
                <span class="prow__name"><b>${esc(s.name)}</b><small>${esc(s.short)}</small></span>
                <span class="prow__days">${esc(s.days)}</span>
                <span class="prow__price">${price(s.from)}</span>
                <span class="prow__go">${icon('arrow')}</span>
            </a>`
                )
                .join('')
        )
        .join('');
    const priceSec = `<section class="sec sec--paper2" id="ceny">
    <div class="wrap">
        ${secHead('04 — Цены', 'Стартовые цены', 'Итоговую цену называю после короткого обсуждения: она зависит от объёма и интеграций. Смета бесплатно.')}
        <div class="ptable">${priceRows}</div>
    </div>
</section>`;

    const faqSec = `<section class="sec" id="faq">
    <div class="wrap wrap--narrow">
        ${secHead('05 — Вопросы', 'Частые вопросы')}
        ${faqList(homeFaq)}
    </div>
</section>`;

    const body = [hero, servicesSec, workSec, processSec, priceSec, faqSec, contactSection(root)].join('\n');

    const jsonld = [
        {
            '@context': 'https://schema.org',
            ...provider,
            description: 'Сайты, Telegram-боты, ИИ-консультанты и автоматизация для малого бизнеса',
            priceRange: '₽₽',
            hasOfferCatalog: {
                '@type': 'OfferCatalog',
                name: 'Услуги',
                itemListElement: services.map((s) => ({
                    '@type': 'Offer',
                    url: `${site.url}/uslugi/${s.slug}/`,
                    priceSpecification: { '@type': 'PriceSpecification', minPrice: s.from, priceCurrency: 'RUB' },
                    itemOffered: { '@type': 'Service', name: s.name, description: s.short },
                })),
            },
        },
        faqLd(homeFaq),
    ];

    return layout({
        root,
        urlPath: '',
        title: 'HVZEweb — сайты, Telegram-боты и ИИ для бизнеса под ключ',
        description: 'Сайты от 3 000 ₽, Telegram-боты от 2 000 ₽, ИИ-консультанты и автоматизация Авито для малого бизнеса. Смета бесплатно, оплата 50/50, правки до приёмки.',
        accent: HOME_ACCENT,
        og: 'home',
        jsonld,
        body,
        bodyClass: 'page-home',
    });
}

function servicesIndexPage() {
    const root = '../';
    const body = `<section class="hero hero--sub">
    <div class="hero__bg" aria-hidden="true"><div class="hero__glow"></div><div class="hero__grid"></div></div>
    <div class="wrap">
        <nav class="crumbs rv" aria-label="Навигация"><a href="${root}">Главная</a><span>/</span><span>Услуги</span></nav>
        <h1 class="h1 h1--sub rv">Услуги и цены</h1>
        <p class="lead rv">Девять направлений — от одной страницы под рекламу до ИИ-консультанта и CRM. У каждой услуги своя страница с примерами и ответами на вопросы.</p>
    </div>
</section>
<section class="sec">
    <div class="wrap">${servicesByGroup(root)}</div>
</section>
<section class="sec sec--paper2">
    <div class="wrap">
        ${secHead('Гарантии', 'Как я работаю')}
        ${guaranteeList()}
    </div>
</section>
${contactSection(root)}`;
    return layout({
        root,
        urlPath: 'uslugi/',
        title: 'Услуги и цены — HVZEweb',
        description: 'Лендинги, сайты-визитки, сайты компаний, интернет-магазины, Telegram-боты, ИИ-консультанты, автоматизация Авито, парсеры и CRM. Стартовые цены и сроки.',
        accent: HOME_ACCENT,
        og: 'home',
        jsonld: [
            {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Главная', item: `${site.url}/` },
                    { '@type': 'ListItem', position: 2, name: 'Услуги', item: `${site.url}/uslugi/` },
                ],
            },
        ],
        body,
        bodyClass: 'page-services',
    });
}

function servicePage(s) {
    const root = '../../';
    const group = groups.find((g) => g.id === s.group);
    const tg = tgUrl(svcText(s));
    const others = services.filter((o) => o.slug !== s.slug);

    const pkgCards = s.packages
        .map((p) => {
            const badge = p.badge || (p.active ? 'Эта услуга' : '');
            const link = p.href && p.href !== s.slug ? `<a class="pkg__link" href="${root}uslugi/${p.href}/">Подробнее ${icon('arrow')}</a>` : '';
            return `<div class="pkg rv${p.active ? ' is-active' : ''}">
                ${badge ? `<span class="pkg__badge">${esc(badge)}</span>` : ''}
                <p class="pkg__name">${esc(p.name)}</p>
                <p class="pkg__price">${price(p.from)}${p.per ? ` <small>${esc(p.per)}</small>` : ''}</p>
                <p class="pkg__days">${esc(p.days)}</p>
                <p class="pkg__note">${esc(p.note)}</p>
                ${link}
            </div>`;
        })
        .join('');

    const body = `<section class="hero hero--svc">
    <div class="hero__bg" aria-hidden="true"><div class="hero__glow"></div><div class="hero__grid"></div></div>
    <div class="wrap hero__in">
        <div class="hero__copy">
            <nav class="crumbs rv" aria-label="Навигация"><a href="${root}">Главная</a><span>/</span><a href="${root}uslugi/">Услуги</a><span>/</span><span>${esc(s.name)}</span></nav>
            <p class="eyebrow rv"><span class="eyebrow__ic">${icon(s.icon)}</span>${esc(group.title)}</p>
            <h1 class="h1 h1--svc rv">${esc(s.h1)}</h1>
            <p class="lead rv">${esc(s.lead)}</p>
            <ul class="hero__chips rv">
                <li><b>${price(s.from)}</b></li>
                <li>${esc(s.days)}</li>
                <li>смета бесплатно</li>
            </ul>
            <div class="hero__cta rv">
                <a class="btn btn--accent btn--lg" href="${tg}" target="_blank" rel="noopener" data-goal="cta_telegram" data-place="hero" data-service="${s.slug}">${icon('send')} Обсудить в Telegram</a>
                <a class="btn btn--ghost btn--lg" href="#primery">Примеры работ</a>
            </div>
        </div>
        <div class="hero__art" aria-hidden="true">${visual(s, root)}</div>
    </div>
</section>

<section class="sec">
    <div class="wrap">
        ${secHead('Кому подходит', 'Узнаёте свою ситуацию?')}
        <div class="pains">${s.pains
            .map(
                (p, i) => `<div class="pain rv">
            <span class="pain__n">${String(i + 1).padStart(2, '0')}</span>
            <p class="pain__t">${esc(p.t)}</p>
            <p class="pain__d">${esc(p.d)}</p>
        </div>`
            )
            .join('')}</div>
    </div>
</section>

<section class="sec sec--paper2">
    <div class="wrap incl">
        <div class="incl__main">
            ${secHead('Что входит', 'Результат под ключ')}
            <ul class="checks">${s.included.map((x) => `<li class="rv">${icon('check')}<span>${esc(x)}</span></li>`).join('')}</ul>
        </div>
        <aside class="incl__card rv">
            <span class="incl__ic">${icon(s.icon)}</span>
            <p class="incl__name">${esc(s.name)}</p>
            <p class="incl__price">${price(s.from)}</p>
            <p class="incl__days">Срок: ${esc(s.days)}</p>
            <a class="btn btn--accent btn--block" href="${tg}" target="_blank" rel="noopener" data-goal="cta_telegram" data-place="included" data-service="${s.slug}">Узнать точную цену</a>
            <p class="incl__note">Отвечу с планом и ценой в тот же день.</p>
        </aside>
    </div>
</section>

<section class="sec" id="ceny">
    <div class="wrap">
        ${secHead('Цены', 'Пакеты и сроки', 'Точную цену и срок назову после короткого обсуждения. Смета бесплатно.')}
        <div class="pkgs">${pkgCards}</div>
    </div>
</section>

<section class="sec sec--dark" id="primery">
    <div class="wrap">
        ${secHead('Примеры', 'Работы и демо', 'Похожие проекты — по вашей нише покажу больше в переписке.')}
        <div class="examples">${s.examples.map((id) => exampleCard(id, root)).join('')}</div>
    </div>
</section>

<section class="sec">
    <div class="wrap">
        ${secHead('Как работаем', 'Четыре шага до запуска')}
        ${steps(s.steps)}
        ${guaranteeList()}
    </div>
</section>

<section class="sec sec--paper2" id="faq">
    <div class="wrap wrap--narrow">
        ${secHead('Вопросы', `Частые вопросы: ${esc(s.name.toLowerCase())}`)}
        ${faqList(s.faq)}
    </div>
</section>

${contactSection(root, s)}

<section class="sec sec--tight">
    <div class="wrap">
        <div class="sub-head rv"><h3 class="h3">Другие услуги</h3></div>
        <div class="others">${others
            .map(
                (o) => `<a class="other rv" href="${root}uslugi/${o.slug}/" style="--c:${o.accent}">
            <span class="other__ic">${icon(o.icon)}</span>
            <span class="other__name">${esc(o.name)}</span>
            <span class="other__price">${price(o.from)}</span>
        </a>`
            )
            .join('')}</div>
    </div>
</section>

<div class="sticky-cta" data-sticky>
    <span class="sticky-cta__price"><small>${esc(s.name)}</small><b>${price(s.from)}</b></span>
    <a class="btn btn--accent" href="${tg}" target="_blank" rel="noopener" data-goal="cta_telegram" data-place="sticky" data-service="${s.slug}">Обсудить</a>
</div>`;

    const jsonld = [
        {
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: s.name,
            serviceType: s.name,
            description: s.metaDescription,
            url: `${site.url}/uslugi/${s.slug}/`,
            areaServed: 'RU',
            provider,
            offers: {
                '@type': 'AggregateOffer',
                priceCurrency: 'RUB',
                lowPrice: s.from,
                offerCount: s.packages.length,
            },
        },
        faqLd(s.faq),
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Главная', item: `${site.url}/` },
                { '@type': 'ListItem', position: 2, name: 'Услуги', item: `${site.url}/uslugi/` },
                { '@type': 'ListItem', position: 3, name: s.name, item: `${site.url}/uslugi/${s.slug}/` },
            ],
        },
    ];

    return layout({
        root,
        urlPath: `uslugi/${s.slug}/`,
        title: s.metaTitle,
        description: s.metaDescription,
        accent: s.accent,
        og: s.slug,
        jsonld,
        body,
        bodyClass: 'page-service',
    });
}

function privacyPage() {
    const root = '';
    const sections = [
        ['Какие данные мы получаем', 'Когда вы пишете в Telegram, на почту или отправляете бриф с сайта, вы сами передаёте: имя или имя пользователя, адрес почты или аккаунт Telegram и текст сообщения о проекте. Бриф на сайте ничего не отправляет сам: он только открывает Telegram или почту с готовым текстом.'],
        ['Зачем', 'Только чтобы ответить на ваш запрос: обсудить проект, посчитать стоимость и сроки, ответить на вопросы.'],
        ['Как долго храним', 'До завершения переписки по заявке или до вашего запроса на удаление.'],
        ['Кому передаём', 'Не продаём и не передаём данные третьим лицам, кроме технических сервисов, через которые вы пишете (Telegram, почта).'],
        ['Аналитика', 'На сайте работает Яндекс Метрика: она собирает обезличенные данные о посещениях и действиях на страницах, включая Вебвизор. По ним я понимаю, какие страницы и реклама работают.'],
        ['Ваши права', `Вы можете попросить удалить или уточнить свои данные, написав на <a href="mailto:${site.email}">${site.email}</a>.`],
    ];
    const body = `<section class="hero hero--sub">
    <div class="hero__bg" aria-hidden="true"><div class="hero__glow"></div><div class="hero__grid"></div></div>
    <div class="wrap">
        <nav class="crumbs rv" aria-label="Навигация"><a href="./">Главная</a><span>/</span><span>Политика конфиденциальности</span></nav>
        <h1 class="h1 h1--sub rv">Политика конфиденциальности</h1>
        <p class="lead rv">Как ${site.brand} обрабатывает данные посетителей сайта ${site.url.replace('https://', '')}. Обновлено 27 октября 2026.</p>
    </div>
</section>
<section class="sec">
    <div class="wrap wrap--narrow legal">
        ${sections.map(([t, d]) => `<h2 class="h3">${esc(t)}</h2>\n        <p>${d}</p>`).join('\n        ')}
    </div>
</section>`;
    return layout({
        root,
        urlPath: 'privacy.html',
        title: 'Политика конфиденциальности — HVZEweb',
        description: 'Какие данные получает HVZEweb, зачем и как долго хранит.',
        accent: HOME_ACCENT,
        og: 'home',
        body,
        bodyClass: 'page-legal',
    });
}

function sitemap() {
    const urls = [
        ['', '1.0', 'weekly'],
        ['uslugi/', '0.9', 'weekly'],
        ...services.map((s) => [`uslugi/${s.slug}/`, '0.9', 'monthly']),
        ...demos.filter((d) => !/^https?:/.test(d.href)).map((d) => [d.href, '0.5', 'monthly']),
        ['privacy.html', '0.2', 'yearly'],
    ];
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
    .map(([p, prio, freq]) => `  <url>\n    <loc>${site.url}/${p}</loc>\n    <lastmod>${site.updated}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${prio}</priority>\n  </url>`)
    .join('\n')}
</urlset>
`;
}

function write(rel, content) {
    const file = path.join(ROOT, rel);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, content);
    console.log('  ', rel);
}

console.log('Сборка сайта:');
write('index.html', homePage());
write('uslugi/index.html', servicesIndexPage());
for (const s of services) write(`uslugi/${s.slug}/index.html`, servicePage(s));
write('privacy.html', privacyPage());
write('sitemap.xml', sitemap());

/* ---------- Картинки для соцсетей: node scripts/build-site.mjs --og (нужен playwright) ---------- */

function ogHtml({ accent, iconName, kicker, title, sub, chips }) {
    return `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=Unbounded:wght@600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;overflow:hidden;background:#0F0F0E;color:#F4F2EC;font-family:Manrope,sans-serif;position:relative}
.glow{position:absolute;inset:0;background:radial-gradient(620px 420px at 88% 22%,${accent}40,transparent 70%),radial-gradient(500px 360px at 0% 100%,${accent}1c,transparent 70%)}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(244,242,236,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(244,242,236,.05) 1px,transparent 1px);background-size:64px 64px}
.in{position:absolute;inset:64px 72px;display:flex;flex-direction:column}
.logo{font:700 30px/1 Unbounded;letter-spacing:-.02em}.logo span{color:${accent}}
.kicker{margin-top:auto;display:inline-flex;align-self:flex-start;padding:10px 18px;border:1px solid rgba(244,242,236,.18);border-radius:999px;color:#C9C5BB;font-weight:700;font-size:22px}
h1{margin:22px 0 0;font:700 ${title.length > 26 ? 60 : 72}px/1.04 Unbounded;letter-spacing:-.035em;max-width:820px}
p{margin:20px 0 0;color:#A9A59B;font-size:28px;font-weight:500;max-width:760px}
.chips{display:flex;gap:12px;margin-top:30px}.chip{padding:12px 22px;border-radius:999px;font-weight:800;font-size:24px;border:1px solid rgba(244,242,236,.18)}
.chip:first-child{background:${accent};color:#121211;border-color:${accent}}
.badge{position:absolute;right:72px;top:64px;width:132px;height:132px;border-radius:36px;background:${accent};color:#121211;display:grid;place-items:center}
.badge svg{width:68px;height:68px}
.url{position:absolute;right:72px;bottom:64px;color:#A9A59B;font-size:22px;font-weight:700}
</style></head><body><div class="glow"></div><div class="grid"></div>
<div class="badge">${icon(iconName)}</div>
<div class="in"><div class="logo">HVZE<span>web</span></div>
<div class="kicker">${esc(kicker)}</div><h1>${esc(title)}</h1><p>${esc(sub)}</p>
<div class="chips">${chips.map((c) => `<span class="chip">${c}</span>`).join('')}</div></div>
<div class="url">${site.url.replace('https://', '')}</div></body></html>`;
}

if (process.argv.includes('--og')) {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    const jobs = [
        ['home', ogHtml({ accent: HOME_ACCENT, iconName: 'bolt', kicker: 'Для малого бизнеса', title: 'Сайты, боты и ИИ, которые приносят заявки', sub: 'Под ключ, смета бесплатно, оплата 50/50', chips: [`от${NB}2${NB}000${NB}₽`, '1–7 дней'] })],
        ...services.map((s) => [
            s.slug,
            ogHtml({ accent: s.accent, iconName: s.icon, kicker: groups.find((g) => g.id === s.group).title, title: s.name, sub: s.short, chips: [price(s.from), esc(s.days)] }),
        ]),
    ];
    mkdirSync(path.join(ROOT, 'assets', 'og'), { recursive: true });
    for (const [name, html] of jobs) {
        await page.setContent(html, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path: path.join(ROOT, 'assets', 'og', `${name}.png`) });
        console.log('   assets/og/' + name + '.png');
    }
    await browser.close();
}
