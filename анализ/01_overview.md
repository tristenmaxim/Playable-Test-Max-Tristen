# Обзор проекта

## Цель
Разработать клон playable креатива: https://playbox.play.plbx.ai/playoff/runner

## Требования
- Единый HTML-файл
- Размер бандла ≤ 5 МБ
- Git-репозиторий с осмысленными коммитами
- ⭐ Задача со звёздочкой: Рескин (замена персонажа и фона)

---

## Технологии

### Основные библиотеки
- **PixiJS** - 2D WebGL рендеринг
- **GSAP** (v3.12.5) - Анимации (подключается через CDN)
- **Howler.js** - Аудио система

### Технические детали
- **Рендеринг**: WebGL через PixiJS
- **Аудио**: HTML5 Audio API + Howler.js
- **Анимации**: GSAP + PixiJS Ticker
- **Защита контента**: Встроенный watermarking и tracking

### Структура кода
- **Минифицированный код**: Основной JS файл минифицирован
- **Модульная система**: ES6 modules
- **Asset loading**: PixiJS Assets API
- **Spritesheets**: JSON-based spritesheet format

---

## Структура файлов референса

```
reference/
├── playable_game.html          (2.9 MB) - Полный HTML с встроенными ассетами
├── reference_page.html         (89 KB)  - HTML структура страницы
├── extract_code.py            - Скрипт для извлечения кода
├── extracted_code/
│   ├── scripts/
│   │   ├── script_00_module.js (2.9 MB) - Основной игровой код (PixiJS)
│   │   ├── script_01_inline.js (1.7 KB) - Content Protection Warning
│   │   └── script_02_inline.js (0.75 KB) - CTA Helper
│   └── styles/
│       ├── style_00.css        (0.54 KB)
│       ├── style_01.css        (0.01 KB)
│       ├── style_02.css        (0.01 KB)
│       └── style_03.css        (42.4 KB) - Основные стили
└── reference_assets/
    ├── data_uri_assets/        - 46 ассетов (1.7 MB)
    │   ├── Изображения (PNG, WebP, AVIF)
    │   ├── Аудио (MP3, WAV)
    │   └── Шрифты (TTF)
    └── Внешние ассеты:
        ├── enemy-spritesheet.png
        ├── image.png
        └── player-woman.png
```

### Статистика

| Компонент | Размер | Описание |
|-----------|--------|----------|
| **JavaScript** | 2.9 MB | Минифицированный PixiJS + игровая логика |
| **CSS** | 43 KB | Стили интерфейса |
| **Ассеты (data URI)** | 1.7 MB | Встроенные изображения, аудио, шрифты |
| **Внешние ассеты** | ~? | enemy-spritesheet, player-woman, image |
| **Общий HTML** | 2.9 MB | Полный файл |

---

## Игровая механика

### Тип игры
**Endless Runner** - бесконечный раннер с препятствиями

### Основные компоненты
1. **Player** - главный персонаж (player-woman.png)
2. **Enemies/Obstacles** - враги/препятствия (enemy-spritesheet.png)
3. **Background** - параллакс фон
4. **UI** - интерфейс (счёт, прогресс, HP)
5. **Audio** - звуковые эффекты и музыка
6. **Collectibles** - собираемые предметы (доллары, PayPal карты)

---

## Структура анализа

Анализ разбит на отдельные файлы:
- `02_game_controller.md` - GameController (Iq) - основная логика игры
- `03_player.md` - Player ($S) - персонаж
- `04_background.md` - ParallaxBackground (Tq) - фон
- `05_enemies_obstacles.md` - Враги и препятствия
- `06_collectibles.md` - Собираемые предметы
- `07_ui_system.md` - UI система
- `08_audio_system.md` - Аудио система
- `09_assets.md` - Ассеты и их загрузка
- `10_physics_collisions.md` - Физика и коллизии
- `11_animations.md` - Анимации
- `12_constants.md` - Константы игры
