# tools

Вспомогательные страницы для генерации картинок. В самом сайте не участвуют.

* `og-template.html` — макет OG-картинки (1200×630) для соцсетей.
* `icon-template.html` — фавиконка в 512×512 для экспорта в PNG.

Как перегенерировать (нужен любой headless-браузер, например Chrome):

```bash
python3 -m http.server 8000            # из корня репозитория
chromium --headless --disable-gpu --window-size=1200,630 \
         --screenshot=og.png http://localhost:8000/tools/og-template.html
convert og.png -quality 88 -strip assets/img/og.jpg
```

Для иконок: снимок `icon-template.html` в 512×512, затем

```bash
convert icon.png -background '#0B0D12' -alpha remove -resize 180x180 assets/img/apple-touch-icon.png
convert icon.png -background none -resize 192x192 assets/img/icon-192.png
convert icon.png -background none -resize 512x512 assets/img/icon-512.png
convert icon.png -background none -resize 32x32   assets/img/favicon-32.png
convert icon.png -background none -resize 16x16   assets/img/favicon-16.png
```
