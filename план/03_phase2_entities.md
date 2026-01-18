# Фаза 2: Игровые сущности

## Цель

Реализовать все игровые сущности: Player, ParallaxBackground, Enemies, Obstacles, Collectibles, FinishLine.

---

## Порядок реализации

### 1. ParallaxBackground (фон)

**Приоритет**: Высокий (нужен для визуального контекста)

#### Задача 1.1: Базовый класс
```javascript
class ParallaxBackground {
  constructor() {
    this.container = null
    this.backgroundTiles = []
    this.treesPool = []
    this.lampsPool = []
    this.bushesPool = []
    this.scrollOffset = 0
    this.isPaused = false
  }
  
  async init() {
    this.container = new Container()
    this.container.zIndex = CONSTANTS.Z_INDEX.FAR_BACKGROUND
    
    // Загрузка текстур
    await this.loadTextures()
    
    // Создание фона
    this.createTiledBackground()
    
    // Создание декораций
    this.createPropPools()
  }
}
```

**Чеклист:**
- [ ] Контейнер создаётся
- [ ] Текстуры загружаются
- [ ] Тайлы фона создаются
- [ ] Декорации создаются

#### Задача 1.2: Тайловый фон
```javascript
createTiledBackground() {
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight
  const textureWidth = this.bgTexture.width
  const textureHeight = this.bgTexture.height
  
  // Масштаб
  this.bgScale = Math.max(
    screenWidth / textureWidth,
    screenHeight / textureHeight
  ) * 1.1
  
  // Создание 6 тайлов
  for (let i = 0; i < 6; i++) {
    const tile = new Sprite(this.bgTexture)
    tile.scale.set(this.bgScale)
    tile.x = i * textureWidth * this.bgScale
    tile.y = 0
    tile.zIndex = CONSTANTS.Z_INDEX.FAR_BACKGROUND
    this.backgroundTiles.push(tile)
    this.container.addChild(tile)
  }
}
```

**Чеклист:**
- [ ] Тайлы создаются корректно
- [ ] Масштаб вычисляется правильно
- [ ] Тайлы покрывают экран
- [ ] Бесшовная прокрутка работает

#### Задача 1.3: Декорации (деревья, лампы, кусты)
```javascript
createPropPools() {
  // Деревья
  this.createTrees()
  
  // Лампы
  this.createLamps()
  
  // Кусты
  this.createBushes()
}

createTrees() {
  const screenWidth = window.innerWidth
  let x = 0
  
  while (x < screenWidth + SCREEN_BUFFER) {
    const spacing = TREE_MIN_SPACING + 
      Math.random() * (TREE_MAX_SPACING - TREE_MIN_SPACING)
    
    const tree = new Sprite(
      this.treeTextures[Math.floor(Math.random() * this.treeTextures.length)]
    )
    tree.x = x
    tree.y = 0
    tree.scale.set(1.81)
    tree.zIndex = CONSTANTS.Z_INDEX.MID_BACKGROUND
    
    this.treesPool.push(tree)
    this.container.addChild(tree)
    x += spacing
  }
}
```

**Чеклист:**
- [ ] Деревья создаются с правильными интервалами
- [ ] Лампы создаются с правильными интервалами
- [ ] Кусты создаются группами
- [ ] Декорации используют пулы

#### Задача 1.4: Обновление и параллакс
```javascript
update(deltaMS, speed) {
  if (this.isPaused) return
  
  const deltaX = speed * deltaMS / 1000
  this.scrollOffset += deltaX
  
  // Обновление тайлов
  this.updateTiles(deltaX)
  
  // Обновление декораций с параллаксом
  this.updatePool(this.treesPool, deltaX * 0.7, wrapDistance)
  this.updatePool(this.lampsPool, deltaX * 0.9, wrapDistance)
  this.updatePool(this.bushesPool, deltaX * 0.9, wrapDistance)
}
```

**Чеклист:**
- [ ] Прокрутка работает плавно
- [ ] Параллакс эффект виден
- [ ] Бесшовная прокрутка работает
- [ ] Пауза работает корректно

---

### 2. Player (игрок)

**Приоритет**: Критический

#### Задача 2.1: Базовый класс
```javascript
class Player {
  constructor() {
    this.sprite = null
    this.x = 0
    this.y = 0
    this.velocityY = 0
    this.isOnGround = true
    this.isInvincible = false
    this.currentAnimation = 'idle'
    this.animations = {}
  }
  
  async init() {
    // Загрузка spritesheet
    const spritesheet = await assetLoader.loadSpritesheet(...)
    
    // Создание анимаций
    this.animations = {
      idle: spritesheet.animations.idle,
      run: spritesheet.animations.run,
      jump: spritesheet.animations.jump,
      hurt: spritesheet.animations.hurt
    }
    
    // Создание спрайта
    this.sprite = new AnimatedSprite(this.animations.idle)
    this.sprite.anchor.set(0.5, 1)
    this.sprite.animationSpeed = 0.1
    this.sprite.play()
    
    // Позиционирование
    this.x = window.innerWidth * 0.2
    this.y = CONSTANTS.POSITIONS.GROUND_Y
    this.sprite.x = this.x
    this.sprite.y = this.y
    this.sprite.zIndex = CONSTANTS.Z_INDEX.PLAYER
  }
}
```

**Чеклист:**
- [ ] Спрайт создаётся
- [ ] Анимации загружаются
- [ ] Позиционирование корректное
- [ ] Анимация idle проигрывается

#### Задача 2.2: Физика прыжков
```javascript
jump() {
  if (!this.isOnGround) return
  
  this.velocityY = -JUMP_POWER
  this.isOnGround = false
  this.playAnimation('jump')
}

update(deltaMS) {
  // Гравитация
  if (!this.isOnGround) {
    this.velocityY += GRAVITY * deltaMS / 1000
    this.y += this.velocityY * deltaMS / 1000
    
    // Приземление
    if (this.y >= CONSTANTS.POSITIONS.GROUND_Y) {
      this.y = CONSTANTS.POSITIONS.GROUND_Y
      this.velocityY = 0
      this.isOnGround = true
      this.playAnimation('run')
    }
  }
  
  // Обновление спрайта
  this.sprite.x = this.x
  this.sprite.y = this.y
}
```

**Чеклист:**
- [ ] Прыжок работает
- [ ] Гравитация применяется
- [ ] Приземление работает
- [ ] Анимации переключаются

#### Задача 2.3: Состояния и анимации
```javascript
playAnimation(name) {
  if (this.currentAnimation === name) return
  
  this.currentAnimation = name
  this.sprite.textures = this.animations[name]
  this.sprite.play()
}

run() {
  this.playAnimation('run')
}

idle() {
  this.playAnimation('idle')
}

hurt() {
  this.playAnimation('hurt')
  this.isInvincible = true
  
  setTimeout(() => {
    this.isInvincible = false
    this.playAnimation('run')
  }, INVINCIBILITY_DURATION)
}
```

**Чеклист:**
- [ ] Все анимации работают
- [ ] Переключение плавное
- [ ] Неуязвимость работает
- [ ] Анимация hurt проигрывается

---

### 3. Enemies (враги)

#### Задача 3.1: Базовый класс
```javascript
class Enemy {
  constructor() {
    this.sprite = null
    this.x = 0
    this.y = 0
    this.speed = 0
    this.isActive = false
    this.animations = {}
  }
  
  async init() {
    // Загрузка spritesheet
    const spritesheet = await assetLoader.loadSpritesheet(...)
    
    this.animations = {
      idle: spritesheet.animations.idle,
      run: spritesheet.animations.run,
      attack: spritesheet.animations.attack
    }
    
    this.sprite = new AnimatedSprite(this.animations.run)
    this.sprite.anchor.set(0.5, 1)
    this.sprite.animationSpeed = 0.1
    this.sprite.play()
    this.sprite.zIndex = CONSTANTS.Z_INDEX.ENEMIES
  }
}
```

**Чеклист:**
- [ ] Враг создаётся
- [ ] Анимация проигрывается
- [ ] Позиционирование корректное

#### Задача 3.2: Движение и обновление
```javascript
update(deltaMS, gameSpeed) {
  if (!this.isActive) return
  
  const deltaX = (this.speed + gameSpeed) * deltaMS / 1000
  this.x -= deltaX
  this.sprite.x = this.x
  
  // Деактивация при выходе за экран
  if (this.x + this.sprite.width < 0) {
    this.destroy()
  }
}

destroy() {
  this.isActive = false
  this.sprite.destroy()
}
```

**Чеклист:**
- [ ] Движение работает
- [ ] Деактивация работает
- [ ] Производительность приемлемая

---

### 4. Obstacles (препятствия)

#### Задача 4.1: Базовый класс
```javascript
class Obstacle {
  constructor() {
    this.sprite = null
    this.x = 0
    this.y = 0
    this.isActive = false
  }
  
  async init(texturePath) {
    const texture = await assetLoader.load(texturePath)
    this.sprite = new Sprite(texture)
    this.sprite.anchor.set(0.5, 1)
    this.sprite.zIndex = CONSTANTS.Z_INDEX.OBSTACLES
  }
  
  update(deltaMS, gameSpeed) {
    if (!this.isActive) return
    
    const deltaX = gameSpeed * deltaMS / 1000
    this.x -= deltaX
    this.sprite.x = this.x
    
    if (this.x + this.sprite.width < 0) {
      this.destroy()
    }
  }
}
```

**Чеклист:**
- [ ] Препятствие создаётся
- [ ] Движение работает
- [ ] Деактивация работает

---

### 5. Collectibles (коллекции)

#### Задача 5.1: Базовый класс
```javascript
class Collectible {
  constructor(type) {
    this.type = type // 'dollar' или 'paypalCard'
    this.sprite = null
    this.x = 0
    this.y = 0
    this.isActive = true
    this.collected = false
    this.rotation = 0
  }
  
  async init() {
    const texturePath = this.type === 'dollar' 
      ? ASSETS.images.dollar 
      : ASSETS.images.paypalCard
    
    const texture = await assetLoader.load(texturePath)
    this.sprite = new Sprite(texture)
    this.sprite.anchor.set(0.5, 0.5)
    this.sprite.zIndex = CONSTANTS.Z_INDEX.COLLECTIBLES
  }
  
  update(deltaMS, gameSpeed) {
    if (!this.isActive || this.collected) return
    
    // Движение
    const deltaX = gameSpeed * deltaMS / 1000
    this.x -= deltaX
    this.sprite.x = this.x
    
    // Вращение
    this.rotation += deltaMS * 0.002
    this.sprite.rotation = this.rotation
    
    if (this.x + this.sprite.width < 0) {
      this.destroy()
    }
  }
  
  collect() {
    this.collected = true
    // Анимация сбора
    gsap.to(this.sprite, {
      alpha: 0,
      scale: 0,
      duration: 0.3,
      onComplete: () => this.destroy()
    })
  }
}
```

**Чеклист:**
- [ ] Коллекция создаётся
- [ ] Вращение работает
- [ ] Анимация сбора работает
- [ ] Деактивация работает

---

### 6. FinishLine (финиш)

#### Задача 6.1: Базовый класс
```javascript
class FinishLine {
  constructor() {
    this.sprite = null
    this.tapeSprite = null
    this.x = 0
    this.y = 0
    this.tapeBreakX = 0
    this.isActive = false
    this.isBroken = false
  }
  
  async init() {
    const finishTexture = await assetLoader.load(ASSETS.images.finish)
    const tapeTexture = await assetLoader.load(ASSETS.images.tape)
    
    this.sprite = new Sprite(finishTexture)
    this.sprite.anchor.set(0.5, 1)
    this.sprite.zIndex = CONSTANTS.Z_INDEX.FINISH_LINE
    
    this.tapeSprite = new Sprite(tapeTexture)
    this.tapeSprite.anchor.set(0.5, 0.5)
    this.tapeSprite.zIndex = CONSTANTS.Z_INDEX.FINISH_LINE + 1
  }
  
  update(deltaMS, gameSpeed) {
    if (!this.isActive) return
    
    const deltaX = gameSpeed * deltaMS / 1000
    this.x -= deltaX
    this.sprite.x = this.x
    this.tapeSprite.x = this.x
    this.tapeBreakX -= deltaX
  }
  
  breakTape() {
    if (this.isBroken) return
    
    this.isBroken = true
    gsap.to(this.tapeSprite, {
      rotation: Math.random() * 20 - 10,
      y: this.tapeSprite.y - 50,
      alpha: 0,
      duration: 0.5,
      ease: "power2.out"
    })
  }
}
```

**Чеклист:**
- [ ] Финиш создаётся
- [ ] Лента отображается
- [ ] Разрыв ленты работает
- [ ] Анимация работает

---

## Интеграция в GameController

### Добавление сущностей
```javascript
class GameController {
  async init() {
    // ...
    
    // Фон
    this.parallax = new ParallaxBackground()
    await this.parallax.init()
    this.app.stage.addChild(this.parallax.container)
    
    // Игрок
    this.player = new Player()
    await this.player.init()
    this.app.stage.addChild(this.player.sprite)
    
    // Массивы сущностей
    this.enemies = []
    this.obstacles = []
    this.collectibles = []
    this.finishLine = null
  }
  
  update(deltaMS) {
    // Обновление фона
    if (this.isRunning) {
      this.parallax.update(deltaMS, this.currentSpeed)
    }
    
    // Обновление игрока
    this.player.update(deltaMS)
    
    // Обновление сущностей
    this.enemies.forEach(e => e.update(deltaMS, this.currentSpeed))
    this.obstacles.forEach(o => o.update(deltaMS, this.currentSpeed))
    this.collectibles.forEach(c => c.update(deltaMS, this.currentSpeed))
    if (this.finishLine) {
      this.finishLine.update(deltaMS, this.currentSpeed)
    }
  }
}
```

---

## Результат фазы 2

После завершения фазы 2:
- ✅ Фон отображается и прокручивается
- ✅ Игрок отображается и может прыгать
- ✅ Враги создаются и движутся
- ✅ Препятствия создаются и движутся
- ✅ Коллекции создаются и вращаются
- ✅ Финиш создаётся и работает

---

## Тестирование

1. Проверить отображение всех сущностей
2. Проверить движение и анимации
3. Проверить производительность
4. Проверить деактивацию сущностей

---

## Следующие шаги

После завершения Фазы 2 перейти к:
- **Фаза 3**: Игровой процесс (коллизии, спавн, туториал)
