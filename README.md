# HVZEweb

Сайт-портфолио: сайты, Telegram-боты, ИИ-консультанты и автоматизация для малого бизнеса.
У каждой услуги своя посадочная страница — под отдельную рекламу и отдельную ссылку.

**Сайт:** https://hvzeweb.github.io · **Telegram:** [@HVZEweb](https://t.me/HVZEweb) · **Почта:** hvzeweb@mail.ru

## Страницы

| Страница | Адрес | Цена от |
|---|---|---|
| Главная | `/` | — |
| Все услуги | `/uslugi/` | — |
| Лендинг | `/uslugi/lending/` | 3 000 ₽ |
| Сайт-визитка | `/uslugi/sajt-vizitka/` | 3 000 ₽ |
| Сайт компании | `/uslugi/sajt-kompanii/` | 5 000 ₽ |
| Интернет-магазин | `/uslugi/internet-magazin/` | 15 000 ₽ |
| Telegram-бот | `/uslugi/telegram-bot/` | 2 000 ₽ |
| ИИ-консультант | `/uslugi/ii-konsultant/` | 30 000 ₽ |
| Автоматизация Авито | `/uslugi/avtomatizaciya-avito/` | 10 000 ₽ |
| Парсеры и интеграции | `/uslugi/parsery-i-integracii/` | 2 000 ₽ |
| CRM и веб-сервисы | `/uslugi/veb-servisy/` | 10 000 ₽ |

Демо-проекты лежат в `portfolio/` и открываются из блока «Работы».

## Как менять тексты и цены

Все тексты — в одном файле [scripts/site-data.mjs](scripts/site-data.mjs): услуги, цены, пакеты, вопросы, кейсы, демо.
HTML собирается из него, руками страницы не правим.

```bash
node scripts/build-site.mjs
```

Цены сайтов и ботов совпадают с прайсом объявлений на Авито (`Avito/server/playbook.json`). Меняете цену там — меняйте и здесь.

Новая услуга: добавьте объект в `services` (свой `slug`, `accent`, `icon`, тексты) и пересоберите — появятся страница, пункт меню, карточка, строка в ценах и запись в `sitemap.xml`.

Дополнительно (нужен Playwright):

```bash
node scripts/build-site.mjs --og
```

пересобирает картинки для соцсетей `assets/og/*.png`.

```bash
node scripts/capture-previews.mjs
```

переснимает превью демо в `assets/portfolio/previews/`.

## Реклама и аналитика

Ссылка в рекламу — на страницу услуги, с UTM-метками, например:

```
https://hvzeweb.github.io/uslugi/telegram-bot/?utm_source=yandex&utm_medium=cpc&utm_campaign=telegram-bot
```

Яндекс Метрика (`110092464`) подключена на всех страницах. Цели типа «JavaScript-событие» нужно один раз создать в интерфейсе Метрики:

| Цель | Когда срабатывает |
|---|---|
| `cta_telegram` | клик по любой кнопке «Обсудить» / Telegram |
| `cta_email` | клик по почте |
| `brief_telegram` | отправка брифа в Telegram |
| `brief_email` | отправка брифа на почту |

У каждой цели есть параметры `page`, `place` (где кнопка) и `service` (какая услуга) — по ним видно, какая реклама приводит обращения.

## Структура

| Файл | Что это |
|---|---|
| `scripts/site-data.mjs` | весь контент |
| `scripts/build-site.mjs` | сборка страниц, `sitemap.xml`, OG-картинок |
| `css/site.css`, `js/site.js` | дизайн и поведение сайта |
| `portfolio/`, `css/demo-*`, `js/demo-*`, `js/i18n.js` | демо-проекты |

## Публикация

GitHub Pages: каждый пуш в `main` публикует сайт через `.github/workflows/pages.yml`. Чтобы остановить публикацию, удалите этот файл; вернуть его можно из истории git.

Локально:

```bash
python -m http.server 8090
```

и открыть http://localhost:8090.
