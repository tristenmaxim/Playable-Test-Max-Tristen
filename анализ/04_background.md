# ParallaxBackground (Tq) - Детальный анализ

## Обзор

`Tq` (ParallaxBackground) - класс для создания параллакс-фона с прокруткой и декоративными элементами (деревья, лампы, кусты).

---

## Структура класса

### Конструктор
```javascript
constructor() {
  // Инициализация всех свойств через V() helper
}
```

### Основные свойства

#### Текстуры
- `bgTexture` - текстура фона
- `treeTextures` - массив текстур деревьев (2 текстуры)
- `lampTexture` - текстура лампы
- `bushTextures` - массив текстур кустов (3 текстуры)

#### Тайлы фона
- `backgroundTiles` - массив тайлов фона (6 тайлов)
- `bgScale` - масштаб фона

#### Пул декораций
- `treesPool` - пул деревьев (массив спрайтов)
- `lampsPool` - пул ламп (массив спрайтов)
- `bushesPool` - пул кустов (массив спрайтов)

#### Состояние
- `isPaused` - флаг паузы
- `scrollOffset` - смещение прокрутки
- `roadY` - Y координата дороги (`Me - oe.GROUND_Y`)

---

## Константы

- `LAMP_SPACING` - расстояние между лампами (800px)
- `TREE_MIN_SPACING` - минимальное расстояние между деревьями (300px)
- `TREE_MAX_SPACING` - максимальное расстояние между деревьями (500px)
- `SCREEN_BUFFER` - буфер за экраном для декораций (1200px)
- `BUSH_GROUP_SPACING` - расстояние между группами кустов (500-600px)
- `BUSHES_PER_GROUP` - количество кустов в группе (2-3)

---

## Методы

### Инициализация

#### `async init()`
Инициализирует фон:
1. Загружает текстуры (`loadTextures()`)
2. Создаёт тайловый фон (`createTiledBackground()`)
3. Создаёт пулы декораций (`createPropPools()`)
4. При ошибке → создаёт fallback фон (`createFallbackBackground()`)

#### `async loadTextures()`
Загружает все текстуры через систему загрузки ассетов:
```javascript
this.bgTexture = await te.load("data:image/png;base64,...")
this.treeTextures = [
  await te.load("data:image/png;base64,..."),
  await te.load("data:image/png;base64,...")
]
this.lampTexture = await te.load("data:image/png;base64,...")
this.bushTextures = [
  await te.load("data:image/png;base64,..."),
  await te.load("data:image/png;base64,..."),
  await te.load("data:image/png;base64,...")
]
```

---

### Создание фона

#### `createTiledBackground()`
Создаёт тайловый фон для бесшовной прокрутки:

1. **Вычисление масштаба:**
   ```javascript
   const screenWidth = window.innerWidth
   const screenHeight = window.innerHeight
   const textureWidth = this.bgTexture.width
   const textureHeight = this.bgTexture.height
   
   // Масштаб для покрытия экрана
   this.bgScale = Math.max(
     screenWidth / textureWidth,
     screenHeight / textureHeight
   ) * 1.1 // Небольшой запас
   ```

2. **Создание тайлов:**
   - Создаёт 6 тайлов для покрытия экрана и буфера
   - Чередует масштаб по X для зеркального эффекта
   - Позиционирует тайлы для бесшовной прокрутки

3. **Позиционирование:**
   ```javascript
   for (let i = 0; i < 6; i++) {
     const tile = new Sprite(this.bgTexture)
     tile.scale.set(this.bgScale)
     tile.x = i * textureWidth * this.bgScale
     tile.y = 0
     tile.zIndex = me.FAR_BACKGROUND
     this.backgroundTiles.push(tile)
     this.addChild(tile)
   }
   ```

---

### Создание декораций

#### `createPropPools()`
Создаёт пулы декоративных элементов:

**Лампы:**
```javascript
const lampCount = Math.ceil((screenWidth + SCREEN_BUFFER) / LAMP_SPACING)
for (let i = 0; i < lampCount; i++) {
  const lamp = new Sprite(this.lampTexture)
  lamp.x = i * LAMP_SPACING
  lamp.y = 50
  lamp.scale.set(1.8)
  lamp.zIndex = me.NEAR_BACKGROUND
  this.lampsPool.push(lamp)
  this.addChild(lamp)
}
```

**Деревья:**
```javascript
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
  tree.zIndex = me.MID_BACKGROUND
  this.treesPool.push(tree)
  this.addChild(tree)
  x += spacing
}
```

**Кусты:**
```javascript
this.createBushGroups(screenWidth + SCREEN_BUFFER)
```

#### `createBushGroups(totalWidth)`
Создаёт группы кустов:
```javascript
let x = 0
while (x < totalWidth) {
  const groupSpacing = BUSH_GROUP_SPACING + Math.random() * 100
  const bushesInGroup = 2 + Math.floor(Math.random() * 2) // 2-3 куста
  
  for (let i = 0; i < bushesInGroup; i++) {
    const bush = new Sprite(
      this.bushTextures[Math.floor(Math.random() * this.bushTextures.length)]
    )
    bush.x = x + i * (100 + Math.random() * 50)
    bush.y = this.roadY - 305
    bush.scale.set(0.45 + Math.random() * 0.15)
    bush.zIndex = me.NEAR_BACKGROUND
    this.bushesPool.push(bush)
    this.addChild(bush)
  }
  
  x += groupSpacing
}
```

---

### Обновление

#### `update(deltaMS, speed = Ye.BASE_SPEED)`
Обновляет прокрутку фона каждый кадр:

```javascript
if (!this.isPaused) {
  // Вычисление смещения
  const deltaX = speed * deltaMS / 1000
  this.scrollOffset += deltaX
  
  // Обновление тайлов фона
  this.updateBackgroundTiles(deltaX)
  
  // Обновление пулов декораций
  this.updatePool(this.lampsPool, deltaX, LAMP_SPACING * this.lampsPool.length)
  this.updatePool(this.treesPool, deltaX, totalTreesWidth)
  this.updatePool(this.bushesPool, deltaX, totalBushesWidth)
}
```

#### `updateBackgroundTiles(deltaX)`
Обновляет тайлы фона для бесшовной прокрутки:
```javascript
const tileWidth = this.bgTexture.width * this.bgScale

this.backgroundTiles.forEach(tile => {
  tile.x -= deltaX
  
  // Если тайл ушёл за левый край → перемещаем вправо
  if (tile.x + tileWidth < 0) {
    const rightmostTile = Math.max(...this.backgroundTiles.map(t => t.x))
    tile.x = rightmostTile + tileWidth
  }
})
```

#### `updatePool(pool, deltaX, wrapDistance)`
Обновляет пул декораций:
```javascript
pool.forEach(sprite => {
  sprite.x -= deltaX
  
  // Если элемент ушёл за левый край → перемещаем вправо
  if (sprite.x + sprite.width < 0) {
    const rightmost = Math.max(...pool.map(s => s.x))
    sprite.x = rightmost + wrapDistance / pool.length
  }
})
```

---

### Управление состоянием

#### `pause()`
Паузит прокрутку фона:
```javascript
this.isPaused = true
```

#### `resume()`
Возобновляет прокрутку фона:
```javascript
this.isPaused = false
```

#### `reset()`
Сбрасывает фон в начальное состояние:
```javascript
this.scrollOffset = 0

// Возвращаем тайлы в начальные позиции
this.backgroundTiles.forEach((tile, i) => {
  tile.x = i * this.bgTexture.width * this.bgScale
})

// Возвращаем декорации в начальные позиции
this.resetPool(this.lampsPool, LAMP_SPACING)
this.resetPool(this.treesPool, TREE_SPACING)
this.resetPool(this.bushesPool, BUSH_SPACING)
```

---

### Fallback фон

#### `createFallbackBackground()`
Создаёт простой цветной фон при ошибке загрузки текстур:
```javascript
const graphics = new Graphics()
graphics.rect(0, 0, window.innerWidth, window.innerHeight)
graphics.fill(0xFCFCF6) // Цвет фона
this.addChild(graphics)
```

---

## Параллакс эффект

### Скорости слоёв

Разные слои движутся с разной скоростью для создания эффекта глубины:

- **Фон (backgroundTiles)**: Базовая скорость (`speed`)
- **Деревья (MID_BACKGROUND)**: `speed * 0.7` (медленнее)
- **Лампы/Кусты (NEAR_BACKGROUND)**: `speed * 0.9` (чуть медленнее)
- **Дорога (GROUND)**: Базовая скорость (`speed`)

### Реализация

Параллакс достигается через разные коэффициенты скорости в `update()`:
```javascript
// Деревья движутся медленнее
this.updatePool(this.treesPool, deltaX * 0.7, wrapDistance)

// Лампы и кусты движутся чуть медленнее
this.updatePool(this.lampsPool, deltaX * 0.9, wrapDistance)
this.updatePool(this.bushesPool, deltaX * 0.9, wrapDistance)
```

---

## Оптимизации

### 1. Object Pooling

Переиспользование спрайтов декораций:
- Элементы не создаются/удаляются каждый кадр
- Перемещаются вправо при выходе за левый край
- Минимальные аллокации памяти

### 2. Бесшовная прокрутка

Тайлы фона перемещаются циклически:
- Когда тайл уходит за левый край → перемещается вправо
- Создаёт иллюзию бесконечного фона
- Минимальные вычисления

### 3. Условное обновление

Обновление только при активной игре:
- Проверка `isPaused` перед обновлением
- Экономия ресурсов при паузе

### 4. Предзагрузка текстур

Все текстуры загружаются заранее:
- Нет задержек во время игры
- Плавная прокрутка с первого кадра

---

## Z-Index слоёв

- `me.FAR_BACKGROUND` - фон (backgroundTiles)
- `me.MID_BACKGROUND` - деревья
- `me.NEAR_BACKGROUND` - лампы и кусты
- `me.GROUND` - дорога (в entityContainer)

---

## Примечания

- ParallaxBackground является контейнером PixiJS (`Container`)
- Все декорации добавляются как дочерние элементы
- Используется система пулов для оптимизации
- Бесшовная прокрутка через циклическое перемещение элементов
- Параллакс эффект через разные скорости слоёв
- Fallback фон при ошибке загрузки текстур
