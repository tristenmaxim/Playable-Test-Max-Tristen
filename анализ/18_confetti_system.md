# ConfettiEmitter (kq) - Детальный анализ

## Обзор

`kq` (ConfettiEmitter) - класс для создания эффекта конфетти при победе. Создаёт частицы, которые разлетаются в разные стороны.

---

## Структура класса

### Конструктор

```javascript
constructor() {
  this.particles = []
  this.textures = [] // Текстуры для частиц (6 различных)
  this.isActive = false
  this.container = new Container()
  this.container.zIndex = me.CONFETTI
}
```

---

## Константы

### Параметры частиц

```javascript
const CONFETTI_CONFIG = {
  PARTICLE_COUNT: 50,        // Количество частиц
  LIFETIME: 5000,            // Время жизни (мс)
  FADE_START: 0.7,           // Начало затухания (0-1)
  BURST_SPEED_MIN: 12,       // Минимальная скорость
  BURST_SPEED_MAX: 20,       // Максимальная скорость
  GRAVITY: 0.05,             // Гравитация
  AIR_RESISTANCE: 0.998,     // Сопротивление воздуха
  BURST_ANGLE_SPREAD: 60     // Разброс угла (градусы)
}
```

---

## Методы

### Инициализация

#### `async init()`

Загружает текстуры для частиц:

```javascript
async init() {
  // Загрузка 6 различных текстур конфетти
  for (let i = 0; i < 6; i++) {
    const texture = await te.load(`data:image/png;base64,...`)
    this.textures.push(texture)
  }

  // Добавление контейнера в stage
  this.app.stage.addChild(this.container)
}
```

---

### Взрыв конфетти

#### `burst(x, y, angle = -90)`

Создаёт взрыв конфетти в точке:

```javascript
burst(x, y, angle = -90) {
  this.isActive = true

  for (let i = 0; i < CONFETTI_CONFIG.PARTICLE_COUNT; i++) {
    // Случайная текстура
    const texture = this.textures[
      Math.floor(Math.random() * this.textures.length)
    ]

    // Случайный угол разброса
    const spreadAngle = angle + 
      (Math.random() - 0.5) * CONFETTI_CONFIG.BURST_ANGLE_SPREAD
    const radians = spreadAngle * Math.PI / 180

    // Случайная скорость
    const speed = CONFETTI_CONFIG.BURST_SPEED_MIN + 
      Math.random() * (CONFETTI_CONFIG.BURST_SPEED_MAX - CONFETTI_CONFIG.BURST_SPEED_MIN)

    // Создание частицы
    const particle = {
      sprite: new Sprite(texture),
      x: x,
      y: y,
      velocityX: Math.cos(radians) * speed,
      velocityY: Math.sin(radians) * speed,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      lifetime: CONFETTI_CONFIG.LIFETIME,
      age: 0,
      scale: 0.5 + Math.random() * 0.5
    }

    // Настройка спрайта
    particle.sprite.anchor.set(0.5, 0.5)
    particle.sprite.x = particle.x
    particle.sprite.y = particle.y
    particle.sprite.scale.set(particle.scale)
    particle.sprite.rotation = particle.rotation

    this.particles.push(particle)
    this.container.addChild(particle.sprite)
  }
}
```

---

### Взрыв с боков экрана

#### `burstFromSides(width, height)`

Создаёт конфетти с боков экрана:

```javascript
burstFromSides(width, height) {
  // Левая сторона
  this.burst(0, height * 0.3, -45)
  
  // Правая сторона
  this.burst(width, height * 0.3, -135)
  
  // Верхняя сторона (опционально)
  this.burst(width * 0.5, 0, -90)
}
```

---

### Обновление

#### `update(deltaMS)`

Обновляет все частицы:

```javascript
update(deltaMS) {
  if (!this.isActive) return

  for (let i = this.particles.length - 1; i >= 0; i--) {
    const particle = this.particles[i]

    // Обновление физики
    particle.velocityY += CONFETTI_CONFIG.GRAVITY * deltaMS
    particle.velocityX *= CONFETTI_CONFIG.AIR_RESISTANCE
    particle.velocityY *= CONFETTI_CONFIG.AIR_RESISTANCE

    // Обновление позиции
    particle.x += particle.velocityX * deltaMS / 1000
    particle.y += particle.velocityY * deltaMS / 1000

    // Обновление вращения
    particle.rotation += particle.rotationSpeed * deltaMS / 1000

    // Обновление возраста
    particle.age += deltaMS

    // Обновление спрайта
    particle.sprite.x = particle.x
    particle.sprite.y = particle.y
    particle.sprite.rotation = particle.rotation

    // Затухание
    const lifeProgress = particle.age / particle.lifetime
    if (lifeProgress > CONFETTI_CONFIG.FADE_START) {
      const fadeProgress = (lifeProgress - CONFETTI_CONFIG.FADE_START) / 
        (1 - CONFETTI_CONFIG.FADE_START)
      particle.sprite.alpha = 1 - fadeProgress
    }

    // Удаление мёртвых частиц
    if (particle.age >= particle.lifetime) {
      this.container.removeChild(particle.sprite)
      particle.sprite.destroy()
      this.particles.splice(i, 1)
    }
  }

  // Деактивация если нет частиц
  if (this.particles.length === 0) {
    this.isActive = false
  }
}
```

---

## Интеграция с GameController

### Запуск конфетти при победе

```javascript
// В GameController.handleWin()
handleWin() {
  // ...
  
  // Запуск конфетти
  if (this.confettiEmitter) {
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    
    // Взрыв из центра экрана
    this.confettiEmitter.burst(
      screenWidth * 0.5,
      screenHeight * 0.3,
      -90
    )
    
    // Или с боков
    // this.confettiEmitter.burstFromSides(screenWidth, screenHeight)
  }
}
```

### Обновление в игровом цикле

```javascript
// В GameController.update()
if (this.confettiEmitter && this.confettiEmitter.isActive) {
  this.confettiEmitter.update(deltaMS)
}
```

---

## Визуальные эффекты

### Типы частиц

Частицы могут иметь разные формы:
- Квадраты
- Круги
- Треугольники
- Звёзды
- Полоски

### Цвета

Частицы могут быть разных цветов:
- Яркие цвета (красный, синий, зелёный, жёлтый)
- Случайные цвета для каждой частицы

---

## Оптимизации

### 1. Object Pooling

Переиспользование частиц:

```javascript
const particlePool = []

function getParticle() {
  if (particlePool.length > 0) {
    return particlePool.pop()
  }
  return createNewParticle()
}

function recycleParticle(particle) {
  particlePool.push(particle)
}
```

### 2. Ограничение количества

Максимальное количество частиц на экране:

```javascript
const MAX_PARTICLES = 100

if (this.particles.length >= MAX_PARTICLES) {
  return // Не создавать новые частицы
}
```

### 3. Раннее удаление

Удаление частиц за экраном:

```javascript
if (particle.x < -100 || 
    particle.x > screenWidth + 100 ||
    particle.y > screenHeight + 100) {
  // Удалить частицу раньше времени
  this.removeParticle(particle)
}
```

---

## Примечания

- Конфетти запускается только при победе
- Частицы имеют физику (гравитация, сопротивление воздуха)
- Частицы затухают перед исчезновением
- Система оптимизирована для производительности
- Поддерживается несколько взрывов одновременно
