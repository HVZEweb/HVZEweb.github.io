#!/usr/bin/env bash
# Выкладка сайта на siteprod.ru (crypto-vps, общий Caddy). Запуск из Git Bash: bash deploy.sh
#  1. собирает страницы;
#  2. заливает файлы из git в /var/www/siteprod (с заменой одним переключением);
#  3. если siteprod.ru уже смотрит на сервер — ставит свой блок Caddy (с бэкапом и проверкой) и шлёт адреса в IndexNow.
# Чужие блоки Caddyfile и другие проекты на сервере не трогает.
set -euo pipefail
cd "$(dirname "$0")"

HOST=crypto-vps
SERVER_IP=83.222.16.56
DOMAIN=siteprod.ru

echo "== Сборка"
node scripts/build-site.mjs > /dev/null

if ! git diff --quiet HEAD -- . ':!.claude' || [ -n "$(git ls-files --others --exclude-standard -- . ':!.claude')" ]; then
    echo "Есть незакоммиченные изменения: на сервер уйдёт только то, что в git. Сначала закоммитьте."
    exit 1
fi

echo "== Файлы на сервер"
# Только публичные файлы сайта из git: без scripts/, README и служебных папок
git ls-files -z -- index.html 404.html privacy.html robots.txt sitemap.xml '*.txt' uslugi blog portfolio css js assets fonts \
    | tar --null -T - -czf - \
    | ssh "$HOST" 'set -e
        rm -rf /var/www/siteprod.new
        mkdir -p /var/www/siteprod.new
        tar -xzf - -C /var/www/siteprod.new
        chmod -R a+rX /var/www/siteprod.new
        if [ -d /var/www/siteprod ]; then rm -rf /var/www/siteprod.old; mv /var/www/siteprod /var/www/siteprod.old; fi
        mv /var/www/siteprod.new /var/www/siteprod
        echo "   файлов: $(find /var/www/siteprod -type f | wc -l)"'

echo "== Caddy"
RESOLVED=$(ssh "$HOST" "getent ahostsv4 $DOMAIN | awk '{print \$1}' | sort -u | tr '\n' ' '" || true)
if ! echo " $RESOLVED " | grep -q " $SERVER_IP "; then
    echo "   $DOMAIN пока не указывает на $SERVER_IP (сейчас: ${RESOLVED:-нет записи})."
    echo "   Поставьте A-записи siteprod.ru и www → $SERVER_IP в DNS Бегета и запустите скрипт ещё раз."
    exit 0
fi

ssh "$HOST" 'cat > /tmp/siteprod.caddy' < deploy/siteprod.caddy
ssh "$HOST" 'set -e
    CF=/etc/caddy/Caddyfile
    BAK=$CF.bak-siteprod-$(date +%Y%m%d-%H%M%S)
    cp "$CF" "$BAK"
    awk "/^# >>> siteprod/{skip=1} !skip{print} /^# <<< siteprod <<</{skip=0}" "$BAK" > /tmp/Caddyfile.new
    if [ -n "$(tail -c1 /tmp/Caddyfile.new)" ]; then echo >> /tmp/Caddyfile.new; fi
    echo >> /tmp/Caddyfile.new
    cat /tmp/siteprod.caddy >> /tmp/Caddyfile.new
    if caddy validate --config /tmp/Caddyfile.new --adapter caddyfile > /tmp/siteprod-validate.log 2>&1; then
        install -m 644 /tmp/Caddyfile.new "$CF"
        systemctl reload caddy
        echo "   блок siteprod обновлён, бэкап: $BAK"
    else
        echo "   Caddyfile не прошёл проверку, оставил как было:"
        tail -5 /tmp/siteprod-validate.log
        exit 1
    fi'

echo "== Проверка HTTPS"
for i in $(seq 1 12); do
    if curl -fsS -o /dev/null --max-time 10 "https://$DOMAIN/"; then
        echo "   https://$DOMAIN/ отвечает"
        break
    fi
    [ "$i" = 12 ] && { echo "   Сертификат ещё не выпущен, проверьте через пару минут: ssh $HOST journalctl -u caddy -n 50"; exit 0; }
    sleep 10
done

echo "== IndexNow (Яндекс узнаёт о страницах сразу)"
KEY=$(basename "$(git ls-files '*.txt' | grep -E '^[0-9a-f]{32}\.txt$' | head -1)" .txt)
URLS=$(grep -o "<loc>[^<]*</loc>" sitemap.xml | sed 's#</\?loc>##g' | grep "^https://$DOMAIN/" | sed 's/.*/"&"/' | paste -sd, -)
curl -sS -o /dev/null -w "   ответ Яндекса: %{http_code}\n" -X POST "https://yandex.com/indexnow" \
    -H "Content-Type: application/json; charset=utf-8" \
    -d "{\"host\":\"$DOMAIN\",\"key\":\"$KEY\",\"keyLocation\":\"https://$DOMAIN/$KEY.txt\",\"urlList\":[$URLS]}" || true
