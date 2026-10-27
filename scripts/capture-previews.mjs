// Скриншоты демо для карточек: assets/portfolio/previews/<slug>.jpg
// Запуск: node scripts/capture-previews.mjs (нужен playwright)
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
import { pathToFileURL } from 'url';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'assets', 'portfolio', 'previews');

const demos = [
    'example-vizitka',
    'example-landing',
    'example-corporate',
    'example-shop',
    'example-shop-admin',
    'example-wordpress',
    'example-telegram-bot',
    'example-booking',
    'example-ai-sales',
    'example-pdf-chat',
    'example-doc-gen',
];

// Концепт Felker лежит в отдельной папке (в git не входит)
const extra = [['example-felker', path.join(root, 'felker-pitch', 'index.html')]];

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'ru-RU' });
// Демо выбирают язык по localStorage — снимаем русскую версию
await context.addInitScript(() => localStorage.setItem('hvze_lang', 'ru'));
const page = await context.newPage();

const targets = [...demos.map((slug) => [slug, path.join(root, 'portfolio', `${slug}.html`)]), ...extra];

for (const [slug, filePath] of targets) {
    if (!existsSync(filePath)) {
        console.log('Skip (no file)', slug);
        continue;
    }
    await page.goto(pathToFileURL(filePath).href, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(800);
    await page.screenshot({
        path: path.join(outDir, `${slug}.jpg`),
        type: 'jpeg',
        quality: 82,
        fullPage: false,
    });
    console.log('Captured', slug);
}

await browser.close();
