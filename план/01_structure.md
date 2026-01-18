# Структура проекта

## Обзор

Проект будет состоять из одного HTML файла со встроенными стилями, скриптами и ассетами.

---

## Структура HTML файла

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Runner Game</title>
  
  <!-- GSAP CDN -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  
  <style>
    /* CSS стили */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; overflow: hidden; }
    #game-canvas { display: block; }
    /* ... остальные стили ... */
  </style>
</head>
<body>
  <!-- Preloader -->
  <div id="preloader">...</div>
  
  <!-- Canvas для игры -->
  <canvas id="game-canvas"></canvas>
  
  <!-- UI элементы (создаются динамически) -->
  
  <script type="module">
    // Основной код игры
    // 1. Инициализация PixiJS
    // 2. Система загрузки ассетов
    // 3. Игровые классы
    // 4. Инициализация игры
  </script>
</body>
</html>
```

---

## Структура кода (внутри script)

### 1. Константы

```javascript
// Константы игры
const CONSTANTS = {
  SPEED: { BASE: 200, DECELERATION_RATE: 0.9, MIN: 10 },
  HEALTH: { MAX: 3 },
  SCORE: { START_BALANCE: 0, DOLLAR_VALUE: 1, PAYPAL_MIN: 5, PAYPAL_MAX: 10 },
  POSITIONS: { GROUND_Y: 0 }, // Будет вычисляться динамически
  Z_INDEX: {
    FAR_BACKGROUND: 0,
    MID_BACKGROUND: 1,
    NEAR_BACKGROUND: 2,
    GROUND: 10,
    PLAYER: 20,
    ENEMIES: 21,
    OBSTACLES: 22,
    COLLECTIBLES: 23,
    FINISH_LINE: 24,
    WARNING_LABEL: 25,
    OVERLAY: 100,
    CONFETTI: 101
  },
  STATES: {
    LOADING: 'loading',
    INTRO: 'intro',
    RUNNING: 'running',
    PAUSED: 'paused',
    END_WIN: 'end_win',
    END_LOSE: 'end_lose'
  }
}
```

### 2. Утилиты

```javascript
// Вспомогательные функции
const Utils = {
  // Коллизии
  rectanglesIntersect(rect1, rect2) { ... },
  
  // Загрузка ассетов
  async loadAsset(url) { ... },
  
  // Создание текстур из data URI
  createTextureFromDataURI(dataURI) { ... },
  
  // Адаптация размера текста
  fitTextToContainer(element, maxSize, minSize) { ... }
}
```

### 3. Система загрузки ассетов

```javascript
class AssetLoader {
  constructor() {
    this.cache = new Map()
    this.workerPool = null
  }
  
  async load(url) { ... }
  async loadImageBitmap(data) { ... }
  async loadSpritesheet(jsonUrl, imageUrl) { ... }
}
```

### 4. Игровые классы

```javascript
// Основной класс приложения
class App {
  constructor() { ... }
  async init() { ... }
  createUI() { ... }
}

// Контроллер игры
class GameController {
  constructor(app) { ... }
  async init() { ... }
  update(deltaMS) { ... }
  handleTap() { ... }
}

// Игрок
class Player {
  constructor() { ... }
  async init() { ... }
  update(deltaMS) { ... }
  jump() { ... }
  run() { ... }
  idle() { ... }
  hurt() { ... }
}

// Фон
class ParallaxBackground {
  constructor() { ... }
  async init() { ... }
  update(deltaMS, speed) { ... }
}

// Враги
class Enemy {
  constructor() { ... }
  async init() { ... }
  update(deltaMS, gameSpeed) { ... }
}

// Препятствия
class Obstacle {
  constructor() { ... }
  async init() { ... }
  update(deltaMS, gameSpeed) { ... }
}

// Коллекции
class Collectible {
  constructor() { ... }
  async init() { ... }
  update(deltaMS, gameSpeed) { ... }
  collect() { ... }
}

// Финишная линия
class FinishLine {
  constructor() { ... }
  async init() { ... }
  update(deltaMS, gameSpeed) { ... }
  breakTape() { ... }
}

// Конфетти
class ConfettiEmitter {
  constructor() { ... }
  async init() { ... }
  update(deltaMS) { ... }
  burst(x, y, angle) { ... }
}
```

### 5. UI классы

```javascript
class UIManager {
  constructor() { ... }
  createHPDisplay() { ... }
  createScoreDisplay() { ... }
  createTutorialOverlay() { ... }
  createEndOverlay() { ... }
  updateHP(hp) { ... }
  updateScore(score) { ... }
  showTutorial(type) { ... }
  showEndScreen(type, score) { ... }
}
```

### 6. Система ввода

```javascript
class InputHandler {
  constructor(gameController) { ... }
  setupListeners() { ... }
  handlePointerDown(event) { ... }
  handlePointerUp(event) { ... }
  handleKeyDown(event) { ... }
}
```

### 7. Аудио система

```javascript
class AudioManager {
  constructor() { ... }
  async init() { ... }
  play(soundName) { ... }
  stop(soundName) { ... }
  setVolume(volume) { ... }
  mute() { ... }
}
```

### 8. Инициализация

```javascript
// Главная функция инициализации
async function init() {
  // 1. Скрыть preloader
  // 2. Создать App
  // 3. Инициализировать App
  // 4. Запустить игровой цикл
}

// Запуск
init().catch(console.error)
```

---

## Организация ассетов

### Встроенные ассеты (data URI)

```javascript
const ASSETS = {
  images: {
    player: "data:image/png;base64,...",
    enemy: "data:image/png;base64,...",
    obstacle: "data:image/png;base64,...",
    collectible: "data:image/png;base64,...",
    background: "data:image/png;base64,...",
    // ... остальные изображения
  },
  spritesheets: {
    player: {
      json: "data:application/json;base64,...",
      image: "data:image/png;base64,..."
    },
    enemy: {
      json: "data:application/json;base64,...",
      image: "data:image/png;base64,..."
    }
  },
  audio: {
    jump: "data:audio/mpeg;base64,...",
    collect: "data:audio/mpeg;base64,...",
    hit: "data:audio/mpeg;base64,...",
    win: "data:audio/mpeg;base64,...",
    lose: "data:audio/mpeg;base64,...",
    music: "data:audio/mpeg;base64,..."
  },
  fonts: {
    main: "data:font/ttf;base64,..."
  }
}
```

---

## Структура папок (для разработки)

```
playable-game/
├── index.html              # Финальный HTML файл
├── src/                    # Исходный код (для разработки)
│   ├── constants.js
│   ├── utils.js
│   ├── asset-loader.js
│   ├── app.js
│   ├── game-controller.js
│   ├── entities/
│   │   ├── player.js
│   │   ├── enemy.js
│   │   ├── obstacle.js
│   │   ├── collectible.js
│   │   ├── finish-line.js
│   │   └── parallax-background.js
│   ├── ui/
│   │   └── ui-manager.js
│   ├── systems/
│   │   ├── input-handler.js
│   │   ├── audio-manager.js
│   │   └── confetti-emitter.js
│   └── main.js
├── assets/                 # Исходные ассеты
│   ├── images/
│   ├── audio/
│   └── fonts/
├── build/                  # Скрипты сборки
│   ├── bundle.js           # Скрипт объединения в один HTML
│   └── optimize.js         # Оптимизация размера
└── package.json
```

---

## Процесс сборки

### Разработка
1. Работа с отдельными файлами в `src/`
2. Использование обычных импортов
3. Ассеты как отдельные файлы

### Сборка
1. Объединение всех JS файлов в один
2. Конвертация ассетов в data URI
3. Встраивание всего в HTML
4. Минификация кода
5. Оптимизация изображений
6. Проверка размера (< 5 MB)

---

## Зависимости библиотек

### Внешние (CDN)
- **GSAP**: `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js`

### Встроенные
- **PixiJS**: Встроить полную библиотеку в код
- **Howler.js**: Встроить полную библиотеку в код

---

## Примечания

- Все должно быть в одном HTML файле для финальной версии
- Во время разработки можно использовать модульную структуру
- Ассеты должны быть оптимизированы (WebP для изображений, сжатие аудио)
- Код должен быть минифицирован для финальной версии
- Размер бандла должен быть < 5 MB
