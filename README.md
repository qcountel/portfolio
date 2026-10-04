# portfolio

Сайт-портфолио **anx1ous** — [anx1ous.ru](https://anx1ous.ru).

Статический одностраничник без сборки: `index.html`, `styles.css`, `script.js`. Хостится на GitHub Pages (домен в `CNAME`).

- Карточки проектов с фильтрами (счётчики считаются автоматически по `data-category`).
- Терминал PROFILE.EXE отправляет сообщение в Telegram через Cloudflare Worker (`WORKER_URL` в `script.js`).
- Анимации отключаются при системной настройке «уменьшить движение».

## Как добавить проект

Скопировать любой `<article class="project-card reveal">` в `index.html`, поменять номер, тег, описание, ссылку и `data-category` (`software`, `mcpe`, `content` — через пробел).

После правок CSS/JS увеличить `?v=` в подключении файлов, чтобы сбросить кэш.
