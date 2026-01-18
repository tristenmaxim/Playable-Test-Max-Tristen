# Враги и препятствия - Детальный анализ

## Обзор

Враги (`sq`) и препятствия (`oq`) - игровые сущности, с которыми игрок не должен сталкиваться. Столкновение наносит урон игроку.

---

## Enemy (sq)

### Обзор

Враги движутся по дороге и атакуют игрока при столкновении.

### Структура класса

#### Свойства
- `sprite` - спрайт врага (AnimatedSprite)
- `x` - позиция по X
- `y` - позиция по Y (обычно `oe.GROUND_Y`)
- `speed` - скорость движения (отрицательная, движется влево)
- `width` - ширина для коллизий
- `height` - высота для коллизий
- `isActive` - флаг активности
- `zIndex` - порядок отрисовки (`me.ENEMIES`)

#### Анимации
- `idle` - покой (циклическая)
- `run` - бег (циклическая)
- `attack` - атака (одноразовая)

### Методы

#### `async init()`
Инициализирует врага:
```javascript
// Загрузка текстур из spritesheet
const textures = await loadEnemyTextures()

// Создание AnimatedSprite
this.sprite = new AnimatedSprite(textures.run)
this.sprite.animationSpeed = 0.1
this.sprite.play()

// Позиционирование
this.x = spawnX
this.y = oe.GROUND_Y
this.sprite.x = this.x
this.sprite.y = this.y

// Размеры для коллизий
this.width = this.sprite.width
this.height = this.sprite.height

// Z-index
this.sprite.zIndex = me.ENEMIES
```

#### `update(deltaMS, gameSpeed)`
Обновляет позицию врага:
```javascript
if (this.isActive) {
  // Движение влево
  const deltaX = (this.speed + gameSpeed) * deltaMS / 1000
  this.x -= deltaX
  this.sprite.x = this.x
  
  // Деактивация при выходе за экран
  if (this.x + this.width < 0) {
    this.destroy()
  }
}
```

#### `play()`
Запускает анимацию бега:
```javascript
this.sprite.textures = this.animations.run
this.sprite.play()
```

#### `attack()`
Запускает анимацию атаки:
```javascript
this.sprite.textures = this.animations.attack
this.sprite.play()
this.sprite.loop = false
this.sprite.onComplete = () => {
  this.sprite.textures = this.animations.run
  this.sprite.loop = true
  this.sprite.play()
}
```

#### `destroy()`
Удаляет врага:
```javascript
this.isActive = false
this.sprite.destroy()
```

---

## Obstacle (oq)

### Обзор

Препятствия - статичные объекты на дороге, которые игрок должен обходить или перепрыгивать.

### Структура класса

#### Свойства
- `sprite` - спрайт препятствия (Sprite)
- `x` - позиция по X
- `y` - позиция по Y (обычно `oe.GROUND_Y`)
- `width` - ширина для коллизий
- `height` - высота для коллизий
- `isActive` - флаг активности
- `zIndex` - порядок отрисовки (`me.OBSTACLES`)

#### Типы препятствий
- Камни
- Барьеры
- Ямы (визуально, но коллизия на уровне земли)

### Методы

#### `async init()`
Инициализирует препятствие:
```javascript
// Загрузка текстуры
const texture = await te.load(obstacleTexturePath)

// Создание спрайта
this.sprite = new Sprite(texture)
this.sprite.anchor.set(0.5, 1) // Привязка к низу

// Позиционирование
this.x = spawnX
this.y = oe.GROUND_Y
this.sprite.x = this.x
this.sprite.y = this.y

// Размеры для коллизий
this.width = this.sprite.width
this.height = this.sprite.height

// Z-index
this.sprite.zIndex = me.OBSTACLES
```

#### `update(deltaMS, gameSpeed)`
Обновляет позицию препятствия:
```javascript
if (this.isActive) {
  // Движение влево (препятствие статично относительно дороги)
  const deltaX = gameSpeed * deltaMS / 1000
  this.x -= deltaX
  this.sprite.x = this.x
  
  // Деактивация при выходе за экран
  if (this.x + this.width < 0) {
    this.destroy()
  }
}
```

#### `destroy()`
Удаляет препятствие:
```javascript
this.isActive = false
this.sprite.destroy()
```

---

## Система спавна

### Данные спавна (Gl)

Массив объектов с информацией о спавне сущностей:
```javascript
const Gl = [
  { type: "enemy", distance: 500, x: 0 },
  { type: "obstacle", distance: 800, x: 0 },
  { type: "enemy", distance: 1200, x: 0 },
  { type: "collectible", distance: 1500, x: 0 },
  // ...
]
```

### Спавн в GameController

#### `checkSpawns()`
Проверяет необходимость спавна сущностей:
```javascript
checkSpawns() {
  if (this.spawnIndex >= Gl.length) return
  
  const nextSpawn = Gl[this.spawnIndex]
  const spawnDistance = nextSpawn.distance
  
  if (this.distanceTraveled >= spawnDistance) {
    this.spawnEntity(nextSpawn)
    this.spawnIndex++
  }
}
```

#### `spawnEntity(spawnData)`
Создаёт сущность по данным спавна:
```javascript
async spawnEntity(spawnData) {
  const spawnX = window.innerWidth + 100 // За правым краем экрана
  
  if (spawnData.type === "enemy") {
    const enemy = new sq() // Enemy
    await enemy.init()
    enemy.x = spawnX
    enemy.y = oe.GROUND_Y
    this.entityContainer.addChild(enemy.sprite)
    this.enemies.push(enemy)
  } else if (spawnData.type === "obstacle") {
    const obstacle = new oq() // Obstacle
    await obstacle.init()
    obstacle.x = spawnX
    obstacle.y = oe.GROUND_Y
    this.entityContainer.addChild(obstacle.sprite)
    this.obstacles.push(obstacle)
  }
}
```

---

## Коллизии

### Проверка столкновений

#### AABB (Axis-Aligned Bounding Box)

Прямоугольная коллизия для простоты и производительности:
```javascript
function checkCollision(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  )
}
```

#### В GameController

```javascript
checkCollisions() {
  const playerRect = {
    x: this.player.x - this.player.width / 2,
    y: this.player.y - this.player.height,
    width: this.player.width,
    height: this.player.height
  }
  
  // Проверка столкновений с врагами
  for (const enemy of this.enemies) {
    if (!enemy.isActive) continue
    
    const enemyRect = {
      x: enemy.x - enemy.width / 2,
      y: enemy.y - enemy.height,
      width: enemy.width,
      height: enemy.height
    }
    
    if (checkCollision(playerRect, enemyRect)) {
      this.handlePlayerHit(enemy)
      break
    }
  }
  
  // Проверка столкновений с препятствиями
  for (const obstacle of this.obstacles) {
    if (!obstacle.isActive) continue
    
    const obstacleRect = {
      x: obstacle.x - obstacle.width / 2,
      y: obstacle.y - obstacle.height,
      width: obstacle.width,
      height: obstacle.height
    }
    
    if (checkCollision(playerRect, obstacleRect)) {
      this.handlePlayerHit(obstacle)
      break
    }
  }
}
```

---

## Обработка столкновений

### `handlePlayerHit(entity)`

Обрабатывает столкновение игрока с врагом/препятствием:

```javascript
handlePlayerHit(entity) {
  // Проверка неуязвимости
  if (this.player.isInvincible) return
  
  // Нанесение урона
  this._hp -= 1
  this.updateHP(this._hp)
  
  // Анимация получения урона
  this.player.hurt()
  
  // Включение неуязвимости
  this.player.isInvincible = true
  setTimeout(() => {
    this.player.isInvincible = false
  }, 1000) // 1 секунда неуязвимости
  
  // Анимация врага/препятствия
  if (entity instanceof sq) { // Enemy
    entity.attack()
  }
  
  // Проверка поражения
  if (this._hp <= 0) {
    this.handleLose()
  }
  
  // Эмит события
  this.emit("hit", { entity, hp: this._hp })
}
```

---

## Предупреждающие метки

### WarningLabel

Метки предупреждения появляются перед врагами/препятствиями для предупреждения игрока.

#### Структура
```javascript
class WarningLabel {
  constructor(x, y, type) {
    this.container = new Container()
    this.x = x
    this.y = y
    this.type = type // "enemy" или "obstacle"
    
    // Создание спрайта метки
    const sprite = new Sprite(warningTexture)
    sprite.anchor.set(0.5, 0.5)
    this.container.addChild(sprite)
    
    // Текст предупреждения
    const text = new Text(type === "enemy" ? "!" : "!", {
      fontSize: 24,
      fill: 0xFF0000
    })
    text.anchor.set(0.5, 0.5)
    this.container.addChild(text)
    
    this.container.zIndex = me.WARNING_LABEL
  }
  
  update(deltaMS, gameSpeed) {
    // Движение вместе с игрой
    const deltaX = gameSpeed * deltaMS / 1000
    this.x -= deltaX
    this.container.x = this.x
    
    // Анимация пульсации
    const scale = 1 + Math.sin(Date.now() * 0.008) * 0.1
    this.container.scale.set(scale)
    
    // Удаление при выходе за экран
    if (this.x + 50 < 0) {
      this.destroy()
    }
  }
}
```

---

## Оптимизации

### 1. Object Pooling

Переиспользование врагов и препятствий:
- Не создаются/удаляются каждый кадр
- Деактивируются при выходе за экран
- Переиспользуются при новом спавне

### 2. Условная проверка коллизий

Проверка только активных сущностей:
```javascript
if (!enemy.isActive) continue
```

### 3. Ранний выход

Прерывание проверки после первого столкновения:
```javascript
if (checkCollision(...)) {
  this.handlePlayerHit(enemy)
  break // Прерываем цикл
}
```

### 4. Деактивация вне экрана

Сущности деактивируются при выходе за левый край:
```javascript
if (this.x + this.width < 0) {
  this.destroy()
}
```

---

## Примечания

- Враги используют AnimatedSprite для анимации
- Препятствия используют обычный Sprite (статичные)
- Коллизии используют простую AABB проверку
- Система спавна основана на пройденном расстоянии
- Предупреждающие метки помогают игроку подготовиться
- Неуязвимость после получения урона предотвращает множественные попадания
- Object pooling для оптимизации производительности
