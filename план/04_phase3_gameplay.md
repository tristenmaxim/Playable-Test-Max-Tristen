# Фаза 3: Игровой процесс

## Цель

Реализовать игровую механику: коллизии, систему спавна, туториал, систему счёта и здоровья, завершение игры.

---

## Задачи

### 1. Система коллизий

#### Задача 1.1: Утилита для коллизий
```javascript
const Utils = {
  rectanglesIntersect(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    )
  },
  
  getHitbox(sprite) {
    return {
      x: sprite.x - sprite.width * sprite.anchor.x,
      y: sprite.y - sprite.height * sprite.anchor.y,
      width: sprite.width,
      height: sprite.height
    }
  }
}
```

**Чеклист:**
- [ ] Функция коллизий работает корректно
- [ ] Hitbox вычисляется правильно
- [ ] Тесты проходят

#### Задача 1.2: Проверка коллизий в GameController
```javascript
class GameController {
  checkCollisions() {
    const playerRect = Utils.getHitbox(this.player.sprite)
    
    // Коллизии с врагами
    for (const enemy of this.enemies) {
      if (!enemy.isActive || this.player.isInvincible) continue
      
      const enemyRect = Utils.getHitbox(enemy.sprite)
      if (Utils.rectanglesIntersect(playerRect, enemyRect)) {
        this.handlePlayerHit(enemy)
        break
      }
    }
    
    // Коллизии с препятствиями
    for (const obstacle of this.obstacles) {
      if (!obstacle.isActive || this.player.isInvincible) continue
      
      const obstacleRect = Utils.getHitbox(obstacle.sprite)
      if (Utils.rectanglesIntersect(playerRect, obstacleRect)) {
        this.handlePlayerHit(obstacle)
        break
      }
    }
    
    // Коллизии с коллекциями
    for (const collectible of this.collectibles) {
      if (!collectible.isActive || collectible.collected) continue
      
      const collectibleRect = Utils.getHitbox(collectible.sprite)
      if (Utils.rectanglesIntersect(playerRect, collectibleRect)) {
        this.collectItem(collectible)
      }
    }
  }
}
```

**Чеклист:**
- [ ] Коллизии с врагами работают
- [ ] Коллизии с препятствиями работают
- [ ] Коллизии с коллекциями работают
- [ ] Неуязвимость работает
- [ ] Производительность приемлемая

#### Задача 1.3: Обработка попаданий
```javascript
handlePlayerHit(entity) {
  this._hp--
  this.player.hurt()
  this.emit('hit', { hp: this._hp })
  
  if (this._hp <= 0) {
    this.handleLose()
  }
}
```

**Чеклист:**
- [ ] HP уменьшается
- [ ] Анимация hurt проигрывается
- [ ] Событие hit эмитится
- [ ] Поражение обрабатывается

#### Задача 1.4: Обработка сбора коллекций
```javascript
collectItem(collectible) {
  const value = collectible.type === 'paypalCard'
    ? CONSTANTS.SCORE.PAYPAL_MIN + 
      Math.random() * (CONSTANTS.SCORE.PAYPAL_MAX - CONSTANTS.SCORE.PAYPAL_MIN)
    : CONSTANTS.SCORE.DOLLAR_VALUE
  
  this._score += value
  collectible.collect()
  
  // Анимация летящей коллекции
  this.animateFlyingCollectible(collectible.sprite.position, collectible.type)
  
  this.emit('collect', { score: this._score, value, type: collectible.type })
}
```

**Чеклист:**
- [ ] Счёт увеличивается
- [ ] Анимация сбора работает
- [ ] Анимация летящей коллекции работает
- [ ] Событие collect эмитится

---

### 2. Система спавна

#### Задача 2.1: Данные спавна
```javascript
const SPAWN_DATA = [
  { type: 'enemy', distance: 500 },
  { type: 'obstacle', distance: 800 },
  { type: 'enemy', distance: 1200 },
  { type: 'collectible', distance: 1500 },
  { type: 'enemy', distance: 2000 },
  { type: 'obstacle', distance: 2500 },
  { type: 'collectible', distance: 3000 },
  { type: 'finish', distance: 5000 }
]
```

**Чеклист:**
- [ ] Данные спавна определены
- [ ] Структура корректная

#### Задача 2.2: Проверка спавна
```javascript
class GameController {
  checkSpawns() {
    if (this.spawnIndex >= SPAWN_DATA.length) return
    
    const nextSpawn = SPAWN_DATA[this.spawnIndex]
    const spawnDistance = nextSpawn.distance * window.innerWidth
    
    if (this.distanceTraveled >= spawnDistance - window.innerWidth) {
      this.spawnEntity(nextSpawn)
      this.spawnIndex++
    }
  }
  
  async spawnEntity(spawnData) {
    const spawnX = window.innerWidth + window.innerWidth * 0.5
    
    switch (spawnData.type) {
      case 'enemy':
        const enemy = new Enemy()
        await enemy.init()
        enemy.x = spawnX
        enemy.y = CONSTANTS.POSITIONS.GROUND_Y
        enemy.sprite.x = enemy.x
        enemy.sprite.y = enemy.y
        enemy.isActive = true
        this.enemies.push(enemy)
        this.app.stage.addChild(enemy.sprite)
        break
        
      case 'obstacle':
        const obstacle = new Obstacle()
        await obstacle.init()
        obstacle.x = spawnX
        obstacle.y = CONSTANTS.POSITIONS.GROUND_Y
        obstacle.sprite.x = obstacle.x
        obstacle.sprite.y = obstacle.y
        obstacle.isActive = true
        this.obstacles.push(obstacle)
        this.app.stage.addChild(obstacle.sprite)
        break
        
      case 'collectible':
        const type = Math.random() < 0.6 ? 'dollar' : 'paypalCard'
        const collectible = new Collectible(type)
        await collectible.init()
        collectible.x = spawnX
        collectible.y = CONSTANTS.POSITIONS.GROUND_Y - (spawnData.yOffset || 0)
        collectible.sprite.x = collectible.x
        collectible.sprite.y = collectible.y
        this.collectibles.push(collectible)
        this.app.stage.addChild(collectible.sprite)
        break
        
      case 'finish':
        this.finishLine = new FinishLine()
        await this.finishLine.init()
        this.finishLine.x = spawnX
        this.finishLine.y = CONSTANTS.POSITIONS.GROUND_Y
        this.finishLine.sprite.x = this.finishLine.x
        this.finishLine.sprite.y = this.finishLine.y
        this.finishLine.tapeSprite.x = this.finishLine.x
        this.finishLine.tapeSprite.y = this.finishLine.y - 100
        this.finishLine.tapeBreakX = this.finishLine.x - 50
        this.finishLine.isActive = true
        this.app.stage.addChild(this.finishLine.sprite)
        this.app.stage.addChild(this.finishLine.tapeSprite)
        break
    }
  }
}
```

**Чеклист:**
- [ ] Спавн проверяется каждый кадр
- [ ] Сущности спавнятся в правильное время
- [ ] Позиционирование корректное
- [ ] Все типы сущностей спавнятся

#### Задача 2.3: Очистка сущностей
```javascript
cleanupEntities() {
  // Враги
  this.enemies = this.enemies.filter(enemy => {
    if (enemy.x + enemy.sprite.width < 0) {
      enemy.destroy()
      this.app.stage.removeChild(enemy.sprite)
      return false
    }
    return true
  })
  
  // Препятствия
  this.obstacles = this.obstacles.filter(obstacle => {
    if (obstacle.x + obstacle.sprite.width < 0) {
      obstacle.destroy()
      this.app.stage.removeChild(obstacle.sprite)
      return false
    }
    return true
  })
  
  // Коллекции
  this.collectibles = this.collectibles.filter(collectible => {
    if (collectible.x + collectible.sprite.width < 0 || collectible.collected) {
      collectible.destroy()
      this.app.stage.removeChild(collectible.sprite)
      return false
    }
    return true
  })
}
```

**Чеклист:**
- [ ] Сущности удаляются за экраном
- [ ] Память освобождается
- [ ] Производительность не падает

---

### 3. Туториал

#### Задача 3.1: Система туториала
```javascript
class GameController {
  checkTutorialTrigger() {
    if (this.tutorialTriggered || !this.tutorialEnemy) return
    
    const distance = this.tutorialEnemy.x - this.player.x
    
    if (distance < TUTORIAL_PAUSE_DISTANCE && distance > 0) {
      this.triggerTutorialPause('enemy')
    }
  }
  
  triggerTutorialPause(type) {
    this.tutorialTriggered = true
    this.isRunning = false
    this.player.idle()
    this.parallax.pause()
    this.enemies.forEach(e => e.stop())
    this.setState(CONSTANTS.STATES.PAUSED)
    this.emit('showTutorial', { type })
  }
  
  resumeFromTutorial() {
    this.isRunning = true
    this.jumpingEnabled = true
    this.player.run()
    this.parallax.resume()
    this.enemies.forEach(e => e.play())
    this.setState(CONSTANTS.STATES.RUNNING)
    this.player.jump()
    this.emit('tutorialComplete')
  }
}
```

**Чеклист:**
- [ ] Туториал срабатывает в нужный момент
- [ ] Игра паузится
- [ ] UI туториала показывается
- [ ] Возобновление работает
- [ ] Прыжок выполняется автоматически

---

### 4. Система счёта и здоровья

#### Задача 4.1: Обновление HP и Score
```javascript
class GameController {
  constructor() {
    this._hp = CONSTANTS.HEALTH.MAX
    this._score = CONSTANTS.SCORE.START_BALANCE
  }
  
  // В handlePlayerHit уже реализовано уменьшение HP
  // В collectItem уже реализовано увеличение счёта
}
```

**Чеклист:**
- [ ] HP инициализируется правильно
- [ ] Score инициализируется правильно
- [ ] Обновления работают

---

### 5. Завершение игры

#### Задача 5.1: Замедление перед финишем
```javascript
class GameController {
  startDeceleration() {
    this.isDecelerating = true
    if (this.finishLine) {
      this.finishLine.breakTape()
    }
    this.emit('crossedFinish')
  }
  
  update(deltaMS) {
    // ...
    
    if (this.isDecelerating) {
      this.currentSpeed *= CONSTANTS.SPEED.DECELERATION_RATE
      
      if (this.currentSpeed < CONSTANTS.SPEED.MIN) {
        this.currentSpeed = 0
        setTimeout(() => {
          this.handleWin()
        }, 500)
      }
    }
    
    // Проверка финиша
    if (this.finishLine && this.finishLine.isActive && 
        this.player.x >= this.finishLine.tapeBreakX && 
        !this.isDecelerating) {
      this.startDeceleration()
    }
  }
}
```

**Чеклист:**
- [ ] Замедление запускается
- [ ] Скорость уменьшается
- [ ] Лента разрывается
- [ ] Победа обрабатывается

#### Задача 5.2: Обработка победы и поражения
```javascript
handleWin() {
  this.isRunning = false
  this.player.idle()
  this.parallax.pause()
  this.enemies.forEach(e => e.stop())
  this.setState(CONSTANTS.STATES.END_WIN)
  this.emit('win', { score: this._score })
}

handleLose() {
  this.isRunning = false
  this.player.idle(true) // Возможно с параметром для анимации смерти
  this.parallax.pause()
  this.enemies.forEach(e => e.stop())
  this.setState(CONSTANTS.STATES.END_LOSE)
  this.emit('lose', { score: this._score })
}
```

**Чеклист:**
- [ ] Победа обрабатывается
- [ ] Поражение обрабатывается
- [ ] Игра останавливается
- [ ] События эмитятся

---

## Интеграция в игровой цикл

```javascript
class GameController {
  update(deltaMS) {
    // Обновление игрока
    this.player.update(deltaMS)
    
    if (this.isRunning) {
      // Обновление фона
      this.parallax.update(deltaMS, this.currentSpeed)
      
      // Расчёт пройденного расстояния
      this.distanceTraveled += this.currentSpeed * deltaMS / 1000
      
      // Замедление перед финишем
      if (this.isDecelerating) {
        this.currentSpeed *= CONSTANTS.SPEED.DECELERATION_RATE
        if (this.currentSpeed < CONSTANTS.SPEED.MIN) {
          this.currentSpeed = 0
          setTimeout(() => this.handleWin(), 500)
        }
      }
      
      // Спавн сущностей
      this.checkSpawns()
      
      // Обновление сущностей
      this.updateEntities(deltaMS)
      
      // Проверка туториала
      this.checkTutorialTrigger()
      
      // Проверка финиша
      if (this.finishLine && this.finishLine.isActive && 
          this.player.x >= this.finishLine.tapeBreakX && 
          !this.isDecelerating) {
        this.startDeceleration()
      }
      
      // Проверка коллизий
      this.checkCollisions()
      
      // Очистка сущностей
      this.cleanupEntities()
    }
  }
}
```

---

## Результат фазы 3

После завершения фазы 3:
- ✅ Коллизии работают корректно
- ✅ Система спавна работает
- ✅ Туториал работает
- ✅ Счёт и здоровье обновляются
- ✅ Игра завершается корректно

---

## Тестирование

1. Проверить коллизии со всеми типами сущностей
2. Проверить спавн сущностей
3. Проверить туториал
4. Проверить завершение игры
5. Проверить производительность

---

## Следующие шаги

После завершения Фазы 3 перейти к:
- **Фаза 4**: UI система
