# FinishLine (pq) - Детальный анализ

## Обзор

`pq` (FinishLine) - класс финишной линии, которая появляется в конце уровня и запускает анимацию завершения игры.

---

## Структура класса

### Конструктор

```javascript
constructor() {
  // Инициализация свойств
  this.sprite = null
  this.tapeSprite = null // Лента финиша
  this.x = 0
  this.y = oe.GROUND_Y
  this.tapeBreakX = 0 // X координата разрыва ленты
  this.isActive = false
  this.isBroken = false
  this.zIndex = me.FINISH_LINE
}
```

---

## Методы

### Инициализация

#### `async init()`

Инициализирует финишную линию:

```javascript
async init() {
  // Загрузка текстур
  const finishTexture = await te.load("data:image/png;base64,...")
  const tapeTexture = await te.load("data:image/png;base64,...")

  // Создание спрайта финиша
  this.sprite = new Sprite(finishTexture)
  this.sprite.anchor.set(0.5, 1) // Привязка к низу
  this.sprite.zIndex = me.FINISH_LINE

  // Создание спрайта ленты
  this.tapeSprite = new Sprite(tapeTexture)
  this.tapeSprite.anchor.set(0.5, 0.5)
  this.tapeSprite.zIndex = me.FINISH_LINE + 1

  // Позиционирование
  this.x = spawnX // Справа от экрана
  this.y = oe.GROUND_Y
  this.sprite.x = this.x
  this.sprite.y = this.y
  
  // Позиция ленты (выше финиша)
  this.tapeSprite.x = this.x
  this.tapeSprite.y = this.y - 100 // Примерная высота

  // X координата разрыва ленты (относительно игрока)
  this.tapeBreakX = this.x - 50 // Примерное значение
}
```

---

### Обновление

#### `update(deltaMS, gameSpeed)`

Обновляет позицию финишной линии:

```javascript
update(deltaMS, gameSpeed) {
  if (!this.isActive) return

  // Движение влево вместе с игрой
  const deltaX = gameSpeed * deltaMS / 1000
  this.x -= deltaX
  this.sprite.x = this.x
  this.tapeSprite.x = this.x
  this.tapeBreakX -= deltaX

  // Проверка достижения игроком ленты
  if (!this.isBroken && this.player.x >= this.tapeBreakX) {
    this.breakTape()
  }

  // Деактивация при выходе за экран
  if (this.x + this.sprite.width < 0) {
    this.destroy()
  }
}
```

---

### Разрыв ленты

#### `breakTape()`

Запускает анимацию разрыва ленты:

```javascript
breakTape() {
  if (this.isBroken) return
  
  this.isBroken = true

  // Анимация разрыва через GSAP
  gsap.to(this.tapeSprite, {
    rotation: Math.random() * 20 - 10, // Случайный поворот
    y: this.tapeSprite.y - 50, // Подъём вверх
    alpha: 0,
    duration: 0.5,
    ease: "power2.out",
    onComplete: () => {
      this.tapeSprite.visible = false
    }
  })

  // Эмит события для GameController
  this.emit('tapeBroken')
}
```

---

### Уничтожение

#### `destroy()`

Удаляет финишную линию:

```javascript
destroy() {
  this.isActive = false
  this.sprite.destroy()
  this.tapeSprite.destroy()
}
```

---

## Интеграция с GameController

### Спавн финишной линии

```javascript
// В GameController.spawnEntity()
if (entityData.type === "finish") {
  this.finishLine = new pq()
  await this.finishLine.init()
  this.finishLine.x = spawnX
  this.entityContainer.addChild(this.finishLine.sprite)
  this.entityContainer.addChild(this.finishLine.tapeSprite)
  this.finishLine.isActive = true
  this.finishLineSpawned = true
}
```

### Проверка достижения финиша

```javascript
// В GameController.update()
if (this.finishLine && this.finishLine.isActive) {
  // Обновление финишной линии
  this.finishLine.update(deltaMS, this.currentSpeed)

  // Проверка разрыва ленты
  if (this.finishLine.isBroken && !this.isDecelerating) {
    this.startDeceleration()
  }
}
```

### Запуск замедления

```javascript
startDeceleration() {
  this.isDecelerating = true
  this.finishLine.breakTape()
  this.emit('crossedFinish')
}
```

---

## Визуальные эффекты

### Анимация ленты

1. **Нормальное состояние**: Лента висит между столбами финиша
2. **Разрыв**: Лента разрывается при достижении игроком
3. **Падение**: Лента падает вниз с вращением

### Частицы (опционально)

При разрыве могут создаваться частицы:

```javascript
breakTape() {
  // Создание частиц разрыва
  for (let i = 0; i < 10; i++) {
    const particle = createParticle({
      x: this.tapeBreakX,
      y: this.tapeSprite.y,
      velocity: {
        x: (Math.random() - 0.5) * 100,
        y: -Math.random() * 50
      },
      lifetime: 500
    })
  }
}
```

---

## Константы

### Позиционирование

- `tapeBreakX`: X координата разрыва ленты (относительно игрока)
- Высота ленты: обычно `oe.GROUND_Y - 100` (примерно)

### Анимация

- Длительность разрыва: `0.5` секунды
- Угол поворота: случайный от `-10` до `+10` градусов
- Смещение по Y: `-50` пикселей

---

## Примечания

- Финишная линия спавнится один раз в конце уровня
- Разрыв ленты запускает замедление игры
- После разрыва ленты игра переходит в состояние `END_WIN`
- Финишная линия удаляется при выходе за экран
