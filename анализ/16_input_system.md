# Система обработки ввода

## Обзор

Игра обрабатывает ввод через события браузера (touch и mouse). Все взаимодействия обрабатываются через единый интерфейс.

---

## Обработка событий

### Основные события

#### Touch события (мобильные)
- `touchstart` - начало касания
- `touchmove` - движение пальца
- `touchend` - окончание касания
- `touchcancel` - отмена касания

#### Mouse события (десктоп)
- `mousedown` - нажатие кнопки мыши
- `mouseup` - отпускание кнопки мыши
- `click` - клик

#### Keyboard события (опционально)
- `keydown` - нажатие клавиши
- `keyup` - отпускание клавиши

---

## Реализация

### Универсальный обработчик

```javascript
class InputHandler {
  constructor(gameController) {
    this.gameController = gameController
    this.isPointerDown = false
    this.setupListeners()
  }

  setupListeners() {
    // Touch события
    window.addEventListener('touchstart', this.handlePointerDown.bind(this), { passive: true })
    window.addEventListener('touchend', this.handlePointerUp.bind(this), { passive: true })
    window.addEventListener('touchcancel', this.handlePointerUp.bind(this), { passive: true })

    // Mouse события
    window.addEventListener('mousedown', this.handlePointerDown.bind(this))
    window.addEventListener('mouseup', this.handlePointerUp.bind(this))
    window.addEventListener('click', this.handleClick.bind(this))

    // Keyboard события (опционально)
    window.addEventListener('keydown', this.handleKeyDown.bind(this))
    window.addEventListener('keyup', this.handleKeyUp.bind(this))
  }

  handlePointerDown(event) {
    event.preventDefault()
    this.isPointerDown = true
    this.gameController.handleTap()
  }

  handlePointerUp(event) {
    event.preventDefault()
    this.isPointerDown = false
  }

  handleClick(event) {
    event.preventDefault()
    this.gameController.handleTap()
  }

  handleKeyDown(event) {
    // Пробел для прыжка
    if (event.code === 'Space' || event.key === ' ') {
      event.preventDefault()
      this.gameController.handleTap()
    }
  }

  handleKeyUp(event) {
    // ...
  }
}
```

---

## Обработка в GameController

### Метод `handleTap()`

```javascript
handleTap() {
  const state = this._state

  switch (state) {
    case ge.INTRO:
      // Запуск игры
      this.start()
      break

    case ge.PAUSED:
      // Возобновление после туториала
      this.resumeFromTutorial()
      break

    case ge.RUNNING:
      // Прыжок (если разрешено и не финиш)
      if (this.jumpingEnabled && !this.isDecelerating) {
        this.player.jump()
        this.emit('jump')
      }
      break

    case ge.END_WIN:
    case ge.END_LOSE:
      // CTA клик или рестарт
      this.handleEndScreenTap()
      break
  }
}
```

---

## Предотвращение множественных кликов

### Debouncing

```javascript
let lastTapTime = 0
const TAP_DELAY = 300 // мс

handleTap() {
  const now = Date.now()
  if (now - lastTapTime < TAP_DELAY) {
    return // Игнорируем слишком частые клики
  }
  lastTapTime = now
  
  // Обработка тапа
  this.gameController.handleTap()
}
```

---

## Обработка жестов

### Swipe (опционально)

```javascript
let touchStartX = 0
let touchStartY = 0

handleTouchStart(event) {
  const touch = event.touches[0]
  touchStartX = touch.clientX
  touchStartY = touch.clientY
}

handleTouchEnd(event) {
  const touch = event.changedTouches[0]
  const deltaX = touch.clientX - touchStartX
  const deltaY = touch.clientY - touchStartY
  
  // Определение направления свайпа
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    if (Math.abs(deltaX) > 50) {
      // Горизонтальный свайп
      if (deltaX > 0) {
        // Свайп вправо
      } else {
        // Свайп влево
      }
    }
  } else {
    if (Math.abs(deltaY) > 50) {
      // Вертикальный свайп
      if (deltaY < 0) {
        // Свайп вверх (прыжок)
        this.gameController.handleTap()
      }
    }
  }
}
```

---

## Оптимизации

### 1. Passive listeners

Использование `{ passive: true }` для touch событий:
```javascript
window.addEventListener('touchstart', handler, { passive: true })
```

**Преимущества**: Браузер не ждёт обработчика перед прокруткой, улучшает производительность.

### 2. Предотвращение двойного клика

```javascript
let lastClickTime = 0
const DOUBLE_CLICK_DELAY = 300

handleClick(event) {
  const now = Date.now()
  if (now - lastClickTime < DOUBLE_CLICK_DELAY) {
    return
  }
  lastClickTime = now
  // Обработка клика
}
```

### 3. Отмена стандартного поведения

```javascript
event.preventDefault() // Предотвращает прокрутку/выделение текста
event.stopPropagation() // Останавливает всплытие события
```

---

## Интеграция с UI

### Клики по UI элементам

```javascript
// CTA кнопка
ctaButton.addEventListener('click', (event) => {
  event.stopPropagation() // Предотвращает обработку игрой
  handleCTA()
})

// Оверлеи
overlay.addEventListener('click', (event) => {
  if (event.target === overlay) {
    // Клик по фону оверлея
    handleOverlayClick()
  }
})
```

---

## Примечания

- Все события обрабатываются через единый интерфейс
- Поддержка как touch, так и mouse событий
- Используется passive listeners для оптимизации
- Предотвращение множественных кликов через debouncing
- Обработка зависит от текущего состояния игры
