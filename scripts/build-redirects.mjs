// Делает из GitHub Pages переадресацию на основной домен: для каждой страницы сайта —
// заглушка в _redirect/ с тем же путём, canonical и мгновенным переходом на siteprod.ru.
// Запускается в .github/workflows/pages.yml, когда siteprod.ru уже работает.
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { site } from './site-data.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, '_redirect');

const pages = execFileSync('git', ['ls-files', '*.html'], { cwd: ROOT, encoding: 'utf8' })
    .split('\n')
    .filter((f) => /^[^/]+\.html$/.test(f) || /^(uslugi|blog|portfolio)\//.test(f));

const stub = (target, keepPath) => `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>Сайт переехал на ${new URL(site.url).host}</title>
<link rel="canonical" href="${target}">
<meta name="robots" content="noindex, follow">
<meta http-equiv="refresh" content="0; url=${target}">
<script>location.replace(${keepPath ? `'${site.url}' + location.pathname + location.search + location.hash` : `'${target}' + location.search + location.hash`})</script>
</head>
<body><p>Сайт переехал: <a href="${target}">${target}</a></p></body>
</html>
`;

for (const file of pages) {
    const urlPath = file === '404.html' ? '' : file.replace(/(^|\/)index\.html$/, '$1');
    const html = file === '404.html' ? stub(`${site.url}/`, true) : stub(`${site.url}/${urlPath}`, false);
    const out = path.join(OUT, file);
    mkdirSync(path.dirname(out), { recursive: true });
    writeFileSync(out, html);
}
writeFileSync(path.join(OUT, '.nojekyll'), '');
console.log(`Переадресаций: ${pages.length} → ${site.url}`);
