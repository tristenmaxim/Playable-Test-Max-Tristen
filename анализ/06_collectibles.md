# Collectibles - Детальный анализ

## Обзор

Collectibles (`lq`) - собираемые предметы, которые игрок может собирать для увеличения счёта. В игре представлены долларами и PayPal картами.

---

## Collectible (lq)

### Обзор

Коллекции движутся по дороге и могут быть собраны игроком при столкновении.

### Структура класса

#### Свойства
- `sprite` - спрайт коллекции (AnimatedSprite)
- `x` - позиция по X
- `y` - позиция по Y (обычно `oe.GROUND_Y` или выше для прыжка)
- `width` - ширина для коллизий
- `height` - высота для коллизий
- `value` - стоимость коллекции (в долларах)
- `type` - тип коллекции (`"dollar"` или `"paypal"`)
- `isActive` - флаг активности
- `isCollected` - флаг сбора
- `zIndex` - порядок отрисовки (`me.COLLECTIBLES`)

#### Типы коллекций

1. **Dollar** (`"dollar"`)
   - Обычные доллары
   - Значение: `Gt.DOLLAR_VALUE` (например, 1-5 долларов)
   - Анимация: вращение

2. **PayPal Card** (`"paypal"`)
   - Специальные карты PayPal
   - Значение: случайное между `Gt.PAYPAL_CARD_MIN` и `Gt.PAYPAL_CARD_MAX`
   - Анимация: вращение + пульсация

#### Анимации
- `idle` - покой (циклическая, вращение)
- `collect` - сбор (одноразовая)

### Методы

#### `async init()`
Инициализирует коллекцию:
```javascript
// Определение типа и значения
this.type = type || "dollar"
this.value = this.type === "paypal" 
  ? Gt.PAYPAL_CARD_MIN + Math.random() * (Gt.PAYPAL_CARD_MAX - Gt.PAYPAL_CARD_MIN)
  : Gt.DOLLAR_VALUE

// Загрузка текстур
const textures = await this.loadTextures()

// Создание AnimatedSprite
this.sprite = new AnimatedSprite(textures.idle)
this.sprite.animationSpeed = 0.1
this.sprite.play()

// Позиционирование
this.x = spawnX
this.y = spawnY || oe.GROUND_Y
this.sprite.x = this.x
this.sprite.y = this.y

// Размеры для коллизий
this.width = this.sprite.width
this.height = this.sprite.height

// Z-index
this.sprite.zIndex = me.COLLECTIBLES
```

#### `async loadTextures()`
Загружает текстуры коллекции:
```javascript
if (this.type === "paypal") {
  return {
    idle: [paypalCardTexture1, paypalCardTexture2, ...],
    collect: [collectTexture1, collectTexture2, ...]
  }
} else {
  return {
    idle: [dollarTexture1, dollarTexture2, ...],
    collect: [collectTexture1, collectTexture2, ...]
  }
}
```

#### `update(deltaMS, gameSpeed)`
Обновляет позицию и анимацию коллекции:
```javascript
if (this.isActive && !this.isCollected) {
  // Движение влево
  const deltaX = gameSpeed * deltaMS / 1000
  this.x -= deltaX
  this.sprite.x = this.x
  
  // Анимация вращения (через масштаб)
  const rotationSpeed = 0.05
  this.sprite.rotation += rotationSpeed * deltaMS / 1000
  
  // Анимация пульсации для PayPal карт
  if (this.type === "paypal") {
    const scale = 1 + Math.sin(Date.now() * 0.01) * 0.1
    this.sprite.scale.set(scale)
  }
  
  // Деактивация при выходе за экран
  if (this.x + this.width < 0) {
    this.destroy()
  }
}
```

#### `collect()`
Обрабатывает сбор коллекции:
```javascript
if (this.isCollected) return

this.isCollected = true

// Анимация сбора
this.sprite.textures = this.animations.collect
this.sprite.play()
this.sprite.loop = false

// Анимация исчезновения
gsap.to(this.sprite, {
  alpha: 0,
  scale: 1.5,
  duration: 0.3,
  ease: "power2.out",
  onComplete: () => {
    this.destroy()
  }
})

// Эмит события
this.emit("collected", { value: this.value, type: this.type })
```

#### `destroy()`
Удаляет коллекцию:
```javascript
this.isActive = false
this.sprite.destroy()
```

---

## Система спавна

### Данные спавна (Gl)

Коллекции спавнятся вместе с другими сущностями:
```javascript
const Gl = [
  { type: "collectible", distance: 300, x: 0, y: oe.GROUND_Y },
  { type: "collectible", distance: 600, x: 0, y: oe.GROUND_Y - 100 }, // Выше для прыжка
  { type: "collectible", distance: 900, x: 0, y: oe.GROUND_Y, subtype: "paypal" },
  // ...
]
```

### Спавн в GameController

#### `spawnCollectible(spawnData)`
Создаёт коллекцию:
```javascript
async spawnCollectible(spawnData) {
  const spawnX = window.innerWidth + 100
  const spawnY = spawnData.y || oe.GROUND_Y
  
  const collectible = new lq() // Collectible
  await collectible.init(spawnData.subtype || "dollar")
  collectible.x = spawnX
  collectible.y = spawnY
  collectible.value = spawnData.value || collectible.value
  
  this.entityContainer.addChild(collectible.sprite)
  this.collectibles.push(collectible)
}
```

---

## Коллизии

### Проверка столкновений

#### В GameController

```javascript
checkCollectibles() {
  const playerRect = {
    x: this.player.x - this.player.width / 2,
    y: this.player.y - this.player.height,
    width: this.player.width,
    height: this.player.height
  }
  
  for (const collectible of this.collectibles) {
    if (!collectible.isActive || collectible.isCollected) continue
    
    const collectibleRect = {
      x: collectible.x - collectible.width / 2,
      y: collectible.y - collectible.height,
      width: collectible.width,
      height: collectible.height
    }
    
    if (checkCollision(playerRect, collectibleRect)) {
      this.collectItem(collectible)
      break
    }
  }
}
```

---

## Обработка сбора

### `collectItem(collectible)`

Обрабатывает сбор коллекции:

```javascript
collectItem(collectible) {
  // Сбор коллекции
  collectible.collect()
  
  // Увеличение счёта
  this._score += collectible.value
  this.updateScore(this._score)
  
  // Анимация летящей коллекции к счёту
  this.animateFlyingCollectible(
    { x: collectible.x, y: collectible.y },
    collectible.type
  )
  
  // Звуковой эффект
  if (collectible.type === "paypal") {
    playSound("collectPayPal")
  } else {
    playSound("collectDollar")
  }
  
  // Проверка достижений
  this.collectiblesCount++
  if (this.collectiblesCount >= this.nextPraiseAt) {
    this.showPraisePopup()
    this.nextPraiseAt += 3 // Следующая похвала через 3 коллекции
  }
  
  // Эмит события
  this.emit("collect", { 
    value: collectible.value, 
    type: collectible.type,
    totalScore: this._score 
  })
}
```

---

## Анимация летящих коллекций

### `animateFlyingCollectible(position, type)`

Создаёт анимацию летящей коллекции к счёту:

```javascript
animateFlyingCollectible(position, type) {
  const element = document.createElement("div")
  element.className = "flying-collectible"
  
  // Текст коллекции
  if (type === "paypal") {
    element.textContent = "💳"
  } else {
    element.textContent = "$"
  }
  
  // Позиционирование
  element.style.position = "absolute"
  element.style.left = `${position.x}px`
  element.style.top = `${position.y}px`
  element.style.fontSize = "24px"
  element.style.zIndex = "5000"
  
  // Вычисление целевой позиции (счёт)
  const scoreRect = this.scoreContainer.getBoundingClientRect()
  const targetX = scoreRect.left + scoreRect.width / 2
  const targetY = scoreRect.top + scoreRect.height / 2
  
  // CSS анимация
  const style = document.createElement("style")
  style.textContent = `
    @keyframes fly-to-score {
      from {
        transform: translate(0, 0) scale(1);
        opacity: 1;
      }
      to {
        transform: translate(${targetX - position.x}px, ${targetY - position.y}px) scale(0.5);
        opacity: 0;
      }
    }
  `
  document.head.appendChild(style)
  
  element.style.animation = `fly-to-score 0.4s ease-in forwards`
  document.body.appendChild(element)
  
  element.addEventListener("animationend", () => {
    this.scoreContainer.classList.remove("pulse")
    this.scoreContainer.offsetWidth // Force reflow
    this.scoreContainer.classList.add("pulse")
    element.remove()
    style.remove()
  })
}
```

---

## Группы коллекций

### Спавн групп

Коллекции могут спавниться группами для создания комбо:

```javascript
spawnCollectibleGroup(count, startX, y) {
  for (let i = 0; i < count; i++) {
    const collectible = new lq()
    await collectible.init("dollar")
    collectible.x = startX + i * 50 // Горизонтальное расстояние
    collectible.y = y
    this.collectibles.push(collectible)
  }
}
```

---

## Специальные коллекции

### PayPal Card

PayPal карты имеют особые свойства:

1. **Высокая стоимость**: Больше обычных долларов
2. **Визуальный эффект**: Пульсация и свечение
3. **Звуковой эффект**: Специальный звук сбора
4. **Редкость**: Спавнятся реже обычных долларов

### Реализация

```javascript
if (this.type === "paypal") {
  // Добавление свечения
  const glowFilter = new GlowFilter({
    distance: 10,
    outerStrength: 2,
    color: 0x0070BA // PayPal синий
  })
  this.sprite.filters = [glowFilter]
  
  // Анимация пульсации
  gsap.to(this.sprite.scale, {
    x: 1.2,
    y: 1.2,
    duration: 0.5,
    yoyo: true,
    repeat: -1,
    ease: "power2.inOut"
  })
}
```

---

## Оптимизации

### 1. Object Pooling

Переиспользование коллекций:
- Не создаются/удаляются каждый кадр
- Деактивируются при сборе или выходе за экран
- Переиспользуются при новом спавне

### 2. Условная проверка коллизий

Проверка только активных и не собранных коллекций:
```javascript
if (!collectible.isActive || collectible.isCollected) continue
```

### 3. Ранний выход

Прерывание проверки после первого столкновения:
```javascript
if (checkCollision(...)) {
  this.collectItem(collectible)
  break
}
```

### 4. Деактивация вне экрана

Коллекции деактивируются при выходе за левый край:
```javascript
if (this.x + this.width < 0) {
  this.destroy()
}
```

---

## Примечания

- Коллекции используют AnimatedSprite для анимации вращения
- PayPal карты имеют специальные визуальные эффекты
- Анимация летящих коллекций к счёту улучшает UX
- Система похвалы мотивирует игрока собирать больше
- Коллизии используют простую AABB проверку
- Object pooling для оптимизации производительности
- Звуковые эффекты различаются для разных типов коллекций
