# Архитектура проекта

## Общая структура

```
project/
├── index.html              # Единый HTML файл (< 5MB)
├── src/
│   ├── core/              # Ядро игры
│   │   ├── App.js         # Главный класс приложения
│   │   ├── GameController.js
│   │   └── Constants.js
│   ├── entities/          # Игровые сущности
│   │   ├── Player.js
│   │   ├── Enemy.js
│   │   ├── Obstacle.js
│   │   ├── Collectible.js
│   │   └── FinishLine.js
│   ├── systems/           # Системы
│   │   ├── ParallaxBackground.js
│   │   ├── AssetLoader.js
│   │   ├── InputHandler.js
│   │   ├── ConfettiEmitter.js
│   │   └── AudioManager.js
│   ├── ui/                # UI компоненты
│   │   ├── HPDisplay.js
│   │   ├── ScoreDisplay.js
│   │   ├── TutorialOverlay.js
│   │   ├── EndOverlay.js
│   │   └── FailOverlay.js
│   └── utils/             # Утилиты
│       ├── Collision.js
│       └── Math.js
├── assets/                # Ассеты (будут встроены)
│   ├── images/
│   ├── audio/
│   └── fonts/
└── build/                 # Сборка
    └── bundle.js          # Минифицированный код
```

---

## Основные классы

### Core (Ядро)

#### App (Zq)
**Ответственность**: Инициализация приложения, управление жизненным циклом
**Зависимости**: PixiJS Application, GameController

```javascript
class App {
  constructor() {
    this.app = null          // PixiJS Application
    this.gameController = null
    this.uiManager = null
  }
  
  async init() { }
  async loadAssets() { }
  start() { }
}
```

#### GameController (Iq)
**Ответственность**: Управление игровым процессом, состояниями, сущностями
**Зависимости**: Player, ParallaxBackground, все Entity классы

```javascript
class GameController {
  constructor(app) {
    this.app = app
    this.state = GameState.LOADING
    this.player = null
    this.parallax = null
    this.enemies = []
    this.obstacles = []
    this.collectibles = []
    this.finishLine = null
  }
  
  update(deltaMS) { }
  checkCollisions() { }
  spawnEntity(data) { }
}
```

---

### Entities (Сущности)

#### Player ($S)
**Ответственность**: Игрок, физика прыжков, анимации
**Зависимости**: PixiJS AnimatedSprite, AssetLoader

```javascript
class Player {
  constructor() {
    this.sprite = null
    this.x = 0
    this.y = GROUND_Y
    this.velocityY = 0
    this.isOnGround = true
  }
  
  jump() { }
  update(deltaMS) { }
  getHitbox() { }
}
```

#### Enemy (sq), Obstacle (oq), Collectible (lq)
**Ответственность**: Игровые сущности с движением и коллизиями
**Зависимости**: PixiJS Sprite/AnimatedSprite

---

### Systems (Системы)

#### ParallaxBackground (Tq)
**Ответственность**: Параллакс фон с декорациями
**Зависимости**: PixiJS Container, Sprite

#### AssetLoader (te)
**Ответственность**: Загрузка и кэширование ассетов
**Зависимости**: PixiJS Assets, Web Workers

#### InputHandler
**Ответственность**: Обработка ввода (touch/mouse)
**Зависимости**: GameController

#### ConfettiEmitter (kq)
**Ответственность**: Эффект конфетти при победе
**Зависимости**: PixiJS Container, Sprite

---

## Паттерны проектирования

### 1. Singleton
- **App**: Один экземпляр приложения
- **AssetLoader**: Единая точка загрузки ассетов
- **AudioManager**: Единый менеджер аудио

### 2. Object Pooling
- **Декорации фона**: Переиспользование спрайтов
- **Частицы конфетти**: Переиспользование частиц
- **Предупреждающие метки**: Переиспользование меток

### 3. Observer (Event Emitter)
- **GameController**: Эмитит события (start, hit, collect, win, lose)
- **UI компоненты**: Подписываются на события для обновления

### 4. State Machine
- **GameController**: Управление состояниями игры (LOADING, INTRO, RUNNING, PAUSED, END_WIN, END_LOSE)

---

## Потоки данных

### Инициализация
```
App.init()
  → AssetLoader.loadAll()
  → GameController.init()
  → UIManager.createUI()
  → App.start()
```

### Игровой цикл
```
PixiJS Ticker
  → GameController.update(deltaMS)
    → Player.update()
    → ParallaxBackground.update()
    → Entities.update()
    → checkCollisions()
    → checkSpawns()
  → UIManager.update()
```

### Обработка ввода
```
Input Event
  → InputHandler.handleTap()
    → GameController.handleTap()
      → Player.jump() или GameController.start()
```

---

## Зависимости между модулями

```
App
├── GameController
│   ├── Player
│   ├── ParallaxBackground
│   ├── Enemy[]
│   ├── Obstacle[]
│   ├── Collectible[]
│   └── FinishLine
├── UIManager
│   ├── HPDisplay
│   ├── ScoreDisplay
│   ├── TutorialOverlay
│   ├── EndOverlay
│   └── FailOverlay
├── AssetLoader
├── InputHandler
├── AudioManager
└── ConfettiEmitter
```

---

## Управление памятью

### Object Pooling
- Декорации фона переиспользуются
- Частицы конфетти переиспользуются
- Предупреждающие метки переиспользуются

### Очистка
- Сущности удаляются при выходе за экран
- Текстуры кэшируются и не перезагружаются
- События отписываются при уничтожении

---

## Оптимизации

### Рендеринг
- Batch rendering для спрайтов
- Ограничение resolution до 2
- Culling объектов за экраном

### Производительность
- Object pooling
- Минимизация аллокаций
- Оптимизация коллизий (AABB)

---

## Следующие шаги

Переходите к [02_implementation_stages.md](./02_implementation_stages.md) для детального плана реализации.
