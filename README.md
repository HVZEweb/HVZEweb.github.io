# HVZEweb

**Product studio** — MVP, AI chatbots, CRM, Telegram bots and business automation for startups and SMB.

[![Site](https://img.shields.io/badge/Site-hvzeweb.github.io-B8A88A?style=for-the-badge)](https://hvzeweb.github.io)
[![Telegram](https://img.shields.io/badge/Telegram-@HVZEweb-26A5E4?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/HVZEweb)
[![Email](https://img.shields.io/badge/Email-hvzeweb%40mail.ru-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:hvzeweb@mail.ru)

---

## Live site

**https://hvzeweb.github.io**

Static site; automatic publishing is disabled for now. Contact form opens Telegram with prefilled message.

---

## Deploy (GitHub Pages)

1. Create repo **`HVZEweb.github.io`** (must match your GitHub username).
2. Push this project to `main` or `master`.
3. GitHub → **Settings → Pages → Source**: **GitHub Actions**.
4. Add a Pages deploy workflow back (it was removed while the site is unpublished).
5. **Disable/delete** the old Netlify site so only GitHub Pages serves the portfolio.

```bash
git add .
git commit -m "Deploy portfolio on GitHub Pages"
git push -u origin main
```

Optional custom domain: Settings → Pages → Custom domain → add DNS records.

---

## Product demos

| Demo | URL |
|------|-----|
| AI Sales Assistant | [/portfolio/example-ai-sales.html](https://hvzeweb.github.io/portfolio/example-ai-sales.html) |
| CRM Dashboard | [/portfolio/example-shop-admin.html](https://hvzeweb.github.io/portfolio/example-shop-admin.html) |
| Booking system | [/portfolio/example-booking.html](https://hvzeweb.github.io/portfolio/example-booking.html) |
| AI PDF Chat | [/portfolio/example-pdf-chat.html](https://hvzeweb.github.io/portfolio/example-pdf-chat.html) |
| Document generator | [/portfolio/example-doc-gen.html](https://hvzeweb.github.io/portfolio/example-doc-gen.html) |
| Telegram bot (live) | [/portfolio/example-telegram-bot.html](https://hvzeweb.github.io/portfolio/example-telegram-bot.html) |
| SaaS MVP landing | [/portfolio/example-landing.html](https://hvzeweb.github.io/portfolio/example-landing.html) |
| Store + admin | [/portfolio/example-shop.html](https://hvzeweb.github.io/portfolio/example-shop.html) |

---

## Stack

HTML · CSS · JavaScript · OpenAI · Telegram Bot API · Cloudflare Workers · GitHub Pages

---

## Config

| File | Purpose |
|------|---------|
| `js/config.js` | Site URL, Telegram, Metrika ID |
| `js/i18n.js` | EN/RU translations |

Form on static hosting: set `contactApiUrl` in `config.js` if you add a Cloudflare Worker; otherwise Telegram fallback is used.

---

## Contact

| Channel | Link |
|---------|------|
| Site | [hvzeweb.github.io](https://hvzeweb.github.io) |
| Telegram | [@HVZEweb](https://t.me/HVZEweb) |
| Email | [hvzeweb@mail.ru](mailto:hvzeweb@mail.ru) |
| GitHub | [@HVZEweb](https://github.com/HVZEweb) |

---

<p align="center"><sub>© 2026 HVZEweb</sub></p>
