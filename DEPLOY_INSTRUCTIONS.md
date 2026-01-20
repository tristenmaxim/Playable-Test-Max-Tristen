# Инструкция по загрузке на vidwizr.tech

## Метод 1: Через SSH с приватным ключом

Если у вас есть приватный SSH ключ, соответствующий публичному ключу:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINifD1hYQrUltAL6Ga2AdOint1U9Jbi42yjW+tCxjOyN trading-bot
```

Выполните:
```bash
# Сохраните приватный ключ в файл (например, ~/.ssh/vidwizr_key)
# Затем:
chmod 600 ~/.ssh/vidwizr_key
ssh -i ~/.ssh/vidwizr_key root@91.84.107.36 "mkdir -p /var/www/vidwizr.tech/Playable"
scp -i ~/.ssh/vidwizr_key playable_game.html root@91.84.107.36:/var/www/vidwizr.tech/Playable/index.html
```

## Метод 2: Через веб-интерфейс (FTP/File Manager)

Если есть доступ к файловому менеджеру или FTP:
1. Загрузите файл `playable_game.html` 
2. Переименуйте его в `index.html`
3. Поместите в `/var/www/vidwizr.tech/Playable/`

## Метод 3: Через веб-интерфейс хостинга

Если есть панель управления (cPanel, Plesk и т.д.):
1. Войдите в панель управления
2. Найдите File Manager
3. Перейдите в `/var/www/vidwizr.tech/Playable/` (или создайте папку)
4. Загрузите `playable_game.html` и переименуйте в `index.html`

## Файл для загрузки

Файл готов: `/Users/maximtristen/Desktop/Playable-Test-4/playable_game.html`
Размер: ~3.5 МБ

## Настройка веб-сервера

После загрузки файла убедитесь, что веб-сервер настроен правильно:
- Nginx: должен обслуживать `/var/www/vidwizr.tech/Playable/index.html`
- Apache: должен иметь DirectoryIndex index.html
