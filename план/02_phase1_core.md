# Фаза 1: Основные системы

## Цель

Создать базовую инфраструктуру игры: инициализацию PixiJS, систему загрузки ассетов, базовую структуру GameController и основной игровой цикл.

---

## Задачи

### 1. Инициализация PixiJS

#### Задача 1.1: Создать HTML структуру
- [ ] Создать базовый HTML файл
- [ ] Добавить canvas элемент
- [ ] Добавить preloader
- [ ] Подключить GSAP через CDN

#### Задача 1.2: Инициализировать PixiJS Application
```javascript
import { Application } from 'pixi.js'

class App {
  constructor() {
    this.app = null
  }
  
  async init() {
    this.app = new Application()
    await this.app.init({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0xFCFCF6,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      antialias: true,
      resizeTo: window
    })
    
    document.body.appendChild(this.app.canvas)
  }
}
```

**Чеклист:**
- [ ] Canvas создаётся и добавляется в DOM
- [ ] Размеры canvas соответствуют размеру окна
- [ ] Фон отображается корректно
- [ ] Responsive работает (изменение размера окна)

---

### 2. Система загрузки ассетов

#### Задача 2.1: Базовый AssetLoader
```javascript
class AssetLoader {
  constructor() {
    this.cache = new Map()
  }
  
  async load(url) {
    if (this.cache.has(url)) {
      return this.cache.get(url)
    }
    
    // Загрузка через fetch или PixiJS Assets
    const asset = await this._loadAsset(url)
    this.cache.set(url, asset)
    return asset
  }
  
  async _loadAsset(url) {
    // Реализация загрузки
  }
}
```

**Чеклист:**
- [ ] Кэширование работает
- [ ] Data URI загружаются корректно
- [ ] Обработка ошибок загрузки
- [ ] Поддержка изображений (PNG, WebP, AVIF)
- [ ] Поддержка аудио (MP3, WAV)
- [ ] Поддержка шрифтов (TTF)

#### Задача 2.2: Web Workers для ImageBitmap
```javascript
class ImageBitmapWorker {
  constructor() {
    this.worker = null
    this._initWorker()
  }
  
  _initWorker() {
    // Создание worker из blob
  }
  
  async loadImageBitmap(imageData) {
    // Загрузка через worker
  }
}
```

**Чеклист:**
- [ ] Worker создаётся корректно
- [ ] ImageBitmap загружается через worker
- [ ] Обработка ошибок
- [ ] Пул workers для оптимизации

#### Задача 2.3: Загрузка Spritesheets
```javascript
async loadSpritesheet(jsonUrl, imageUrl) {
  const jsonData = await this.load(jsonUrl)
  const imageTexture = await this.load(imageUrl)
  
  // Создание Spritesheet через PixiJS
  const spritesheet = new Spritesheet(imageTexture, jsonData)
  await spritesheet.parse()
  
  return spritesheet
}
```

**Чеклист:**
- [ ] JSON загружается корректно
- [ ] Изображение загружается корректно
- [ ] Spritesheet парсится правильно
- [ ] Текстуры кадров доступны

---

### 3. GameController (базовая структура)

#### Задача 3.1: Создать базовый класс
```javascript
class GameController {
  constructor(app) {
    this.app = app
    this.state = CONSTANTS.STATES.LOADING
    this.isRunning = false
    this.events = new Map()
  }
  
  setState(newState) {
    const oldState = this.state
    this.state = newState
    this.emit('stateChange', { from: oldState, to: newState })
  }
  
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event).push(callback)
  }
  
  emit(event, data) {
    if (this.events.has(event)) {
      this.events.get(event).forEach(cb => cb(data))
    }
  }
}
```

**Чеклист:**
- [ ] Класс создаётся корректно
- [ ] Состояния переключаются
- [ ] События эмитятся и обрабатываются
- [ ] Подписка на события работает

#### Задача 3.2: Базовый игровой цикл
```javascript
class GameController {
  update(deltaMS) {
    // Базовый цикл обновления
    switch (this.state) {
      case CONSTANTS.STATES.LOADING:
        // Загрузка
        break
      case CONSTANTS.STATES.INTRO:
        // Вводный экран
        break
      case CONSTANTS.STATES.RUNNING:
        // Игровой процесс
        break
      case CONSTANTS.STATES.PAUSED:
        // Пауза
        break
      case CONSTANTS.STATES.END_WIN:
      case CONSTANTS.STATES.END_LOSE:
        // Экран завершения
        break
    }
  }
}
```

**Чеклист:**
- [ ] Update вызывается каждый кадр
- [ ] DeltaMS передаётся корректно
- [ ] Состояния обрабатываются правильно
- [ ] Производительность приемлемая (60 FPS)

---

### 4. Интеграция систем

#### Задача 4.1: Связать App и GameController
```javascript
class App {
  async init() {
    // Инициализация PixiJS
    await this.initPixiJS()
    
    // Создание GameController
    this.gameController = new GameController(this.app)
    
    // Запуск игрового цикла
    this.app.ticker.add((ticker) => {
      this.gameController.update(ticker.deltaMS)
    })
  }
}
```

**Чеклист:**
- [ ] App и GameController связаны
- [ ] Игровой цикл запускается
- [ ] Ticker работает корректно

#### Задача 4.2: Система состояний
```javascript
// Реализовать все состояния
const STATES = {
  LOADING: 'loading',
  INTRO: 'intro',
  RUNNING: 'running',
  PAUSED: 'paused',
  END_WIN: 'end_win',
  END_LOSE: 'end_lose'
}
```

**Чеклист:**
- [ ] Все состояния определены
- [ ] Переходы между состояниями работают
- [ ] События состояния эмитятся

---

## Результат фазы 1

После завершения фазы 1 должна быть рабочая база:
- ✅ PixiJS инициализирован и отображает canvas
- ✅ Система загрузки ассетов работает
- ✅ GameController создан с базовой структурой
- ✅ Игровой цикл запущен
- ✅ Система состояний работает

---

## Тестирование

### Базовые тесты
1. Открыть HTML файл в браузере
2. Проверить, что canvas отображается
3. Проверить консоль на ошибки
4. Проверить производительность (FPS)

### Проверка загрузки
1. Попробовать загрузить тестовый ассет
2. Проверить кэширование
3. Проверить обработку ошибок

---

## Следующие шаги

После завершения Фазы 1 перейти к:
- **Фаза 2**: Игровые сущности (Player, Background)
- Затем добавить остальные сущности

---

## Примечания

- На этом этапе не нужны ассеты (можно использовать placeholder'ы)
- Фокус на архитектуре и структуре
- Код должен быть чистым и расширяемым
- Документировать сложные места
