// HVZEweb — поведение страниц: меню, появление блоков, бриф в Telegram/почту, цели Метрики
(function () {
    'use strict';

    const html = document.documentElement;
    const ymId = html.dataset.ym;
    const page = location.pathname.replace(/index\.html$/, '') || '/';

    // Демо в /portfolio берут язык из localStorage — открываем их на русском
    try {
        localStorage.setItem('hvze_lang', 'ru');
    } catch (e) {
        /* приватный режим */
    }

    if (ymId) {
        (function (m, e, t, r, i, k, a) {
            m[i] =
                m[i] ||
                function () {
                    (m[i].a = m[i].a || []).push(arguments);
                };
            m[i].l = 1 * new Date();
            for (let j = 0; j < document.scripts.length; j++) {
                if (document.scripts[j].src === r) return;
            }
            k = e.createElement(t);
            a = e.getElementsByTagName(t)[0];
            k.async = 1;
            k.src = r;
            a.parentNode.insertBefore(k, a);
        })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=' + ymId, 'ym');
        window.ym(ymId, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
    }

    // Цели: cta_telegram, cta_email, brief_telegram, brief_email — с параметрами страницы, места и услуги
    function goal(name, params) {
        try {
            if (ymId && typeof window.ym === 'function') {
                window.ym(ymId, 'reachGoal', name, Object.assign({ page: page }, params));
            }
        } catch (e) {
            /* аналитика не должна ломать страницу */
        }
    }

    document.addEventListener('click', function (event) {
        const el = event.target.closest('[data-goal]');
        if (!el) return;
        goal(el.dataset.goal, { place: el.dataset.place || '', service: el.dataset.service || '' });
    });

    /* Шапка и мобильное меню */

    const hdr = document.querySelector('[data-hdr]');
    const burger = document.querySelector('[data-burger]');
    const mnav = document.querySelector('[data-mnav]');

    function onScroll() {
        if (hdr) hdr.classList.toggle('is-scrolled', window.scrollY > 8);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    function setMenu(open) {
        if (!burger || !mnav) return;
        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
        mnav.classList.toggle('is-open', open);
        hdr.classList.toggle('is-menu', open);
        document.body.classList.toggle('menu-open', open);
    }

    if (burger && mnav) {
        burger.addEventListener('click', function () {
            setMenu(burger.getAttribute('aria-expanded') !== 'true');
        });
        mnav.addEventListener('click', function (event) {
            if (event.target.closest('a')) setMenu(false);
        });
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') setMenu(false);
        });
        window.matchMedia('(min-width: 961px)').addEventListener('change', function (event) {
            if (event.matches) setMenu(false);
        });
    }

    /* Появление блоков */

    const reveal = document.querySelectorAll('.rv');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if ('IntersectionObserver' in window && !reduce) {
        const io = new IntersectionObserver(
            function (entries) {
                let n = 0;
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    entry.target.style.transitionDelay = (n++ % 6) * 70 + 'ms';
                    entry.target.classList.add('is-in');
                    io.unobserve(entry.target);
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
        );
        reveal.forEach(function (el) {
            io.observe(el);
        });
    } else {
        reveal.forEach(function (el) {
            el.classList.add('is-in');
        });
    }

    /* Плавающая кнопка на страницах услуг: после первого экрана и до блока контактов */

    const sticky = document.querySelector('[data-sticky]');
    const hero = document.querySelector('.hero');
    const contacts = document.getElementById('contacts');
    if (sticky && hero && contacts && 'IntersectionObserver' in window) {
        let heroVisible = true;
        let contactsVisible = false;
        const update = function () {
            sticky.classList.toggle('is-on', !heroVisible && !contactsVisible);
        };
        new IntersectionObserver(function (entries) {
            heroVisible = entries[0].isIntersecting;
            update();
        }).observe(hero);
        new IntersectionObserver(function (entries) {
            contactsVisible = entries[0].isIntersecting;
            update();
        }).observe(contacts);
    }

    /* Бриф: собирает сообщение и открывает Telegram или почту */

    document.querySelectorAll('[data-brief]').forEach(function (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            const via = event.submitter && event.submitter.value === 'mail' ? 'mail' : 'tg';
            const data = new FormData(form);
            const service = data.get('service') || 'пока не знаю, нужна консультация';
            const task = String(data.get('task') || '').trim();
            const lines = ['Здравствуйте! Пишу с сайта.', 'Услуга: ' + service];
            if (task) lines.push('Задача: ' + task);
            lines.push('Срок: ' + data.get('deadline'));
            const text = lines.join('\n');
            const params = { place: 'brief', service: form.dataset.service || '' };

            if (via === 'mail') {
                goal('brief_email', params);
                location.href =
                    'mailto:' +
                    form.dataset.email +
                    '?subject=' +
                    encodeURIComponent('Заявка с сайта: ' + service) +
                    '&body=' +
                    encodeURIComponent(text);
            } else {
                goal('brief_telegram', params);
                window.open('https://t.me/' + form.dataset.tg + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
            }
        });
    });
})();
