# Система рендеринга и спрайтов

## Обзор

Игра использует PixiJS для рендеринга через WebGL. Все игровые объекты представлены как спрайты или контейнеры спрайтов.

---

## PixiJS Application

### Инициализация
```javascript
this.app = new Application()
await this.app.init({
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: 0xFCFCF6, // 16573654 в десятичном
  resolution: Math.min(window.devicePixelRatio || 1, 2),
  autoDensity: true,
  antialias: true,
  resizeTo: window
})
```

### Основные параметры
- **resolution**: Ограничена до 2 для производительности
- **autoDensity**: Автоматическая адаптация к pixel ratio
- **antialias**: Сглаживание для лучшего качества
- **resizeTo**: Автоматическое изменение размера при изменении окна

---

## Структура слоёв (zIndex)

Используется система zIndex для управления порядком отрисовки:

- `me.FAR_BACKGROUND` - дальний фон (ParallaxBackground)
- `me.MID_BACKGROUND` - средний фон (деревья)
- `me.NEAR_BACKGROUND` - ближний фон (лампы, кусты)
- `me.GROUND` - земля (entityContainer)
- `me.PLAYER` - игрок
- `me.ENEMIES` - враги
- `me.OBSTACLES` - препятствия
- `me.COLLECTIBLES` - коллекции
- `me.FINISH_LINE` - финишная линия
- `me.WARNING_LABEL` - предупреждающие метки
- `me.OVERLAY` - оверлеи
- `me.CONFETTI` - конфетти

### Использование
```javascript
container.sortableChildren = true
sprite.zIndex = me.PLAYER
```

---

## ParallaxBackground (Tq)

### Обзор

Класс для создания параллакс-фона с прокруткой и декоративными элементами.

### Структура

#### Свойства
- `backgroundTiles` - массив тайлов фона
- `bgTexture` - текстура фона
- `bgScale` - масштаб фона
- `treesPool` - пул деревьев
- `lampsPool` - пул ламп
- `bushesPool` - пул кустов
- `isPaused` - флаг паузы
- `scrollOffset` - смещение прокрутки
- `roadY` - Y координата дороги (`Me - oe.GROUND_Y`)

#### Константы
- `LAMP_SPACING` - расстояние между лампами (800)
- `TREE_MIN_SPACING` - минимальное расстояние между деревьями (300)
- `TREE_MAX_SPACING` - максимальное расстояние между деревьями (500)
- `SCREEN_BUFFER` - буфер за экраном (1200)

### Методы

#### `async init()`
Инициализирует фон:
1. Загружает текстуры (`loadTextures()`)
2. Создаёт тайловый фон (`createTiledBackground()`)
3. Создаёт пулы декораций (`createPropPools()`)
4. При ошибке → создаёт fallback фон (`createFallbackBackground()`)

#### `async loadTextures()`
Загружает все текстуры:
- Фон (`bgTexture`)
- Деревья (`treeTextures` - массив из 2 текстур)
- Лампы (`lampTexture`)
- Кусты (`bushTextures` - массив из 3 текстур)

#### `createTiledBackground()`
Создаёт тайловый фон:
1. Вычисляет масштаб для покрытия экрана
2. Создаёт 6 тайлов фона
3. Чередует масштаб по X для зеркального эффекта
4. Позиционирует тайлы для бесшовной прокрутки

#### `createPropPools()`
Создаёт пулы декоративных элементов:

**Лампы:**
- Расстояние между лампами: `LAMP_SPACING` (800)
- Позиция Y: 50
- Масштаб: 1.8
- zIndex: `me.NEAR_BACKGROUND`

**Деревья:**
- Случайное расстояние между `TREE_MIN_SPACING` и `TREE_MAX_SPACING`
- Случайная текстура из `treeTextures`
- Масштаб: 1.81
- zIndex: `me.MID_BACKGROUND`

**Кусты:**
- Группы по 2-3 куста
- Случайная текстура из `bushTextures`
- Масштаб: 0.45 + random(0.15)
- Позиция Y: `roadY - 305`
- zIndex: `me.NEAR_BACKGROUND`

#### `createBushGroups(totalWidth)`
Создаёт группы кустов:
- Группы каждые 500-600px
- В группе 2-3 куста
- Случайное расстояние между кустами в группе

#### `update(deltaMS, speed = Ye.BASE_SPEED)`
Обновляет прокрутку фона:

1. **Если не на паузе:**
   - Вычисляет смещение: `scrollOffset += speed * deltaMS / 1000`
   - Обновляет тайлы фона (бесшовная прокрутка)
   - Обновляет пулы декораций (`updatePool()`)

2. **Бесшовная прокрутка тайлов:**
   - Двигает тайлы влево
   - Когда тайл уходит за левый край → перемещает вправо

#### `updatePool(pool, deltaX, wrapDistance)`
Обновляет пул декораций:
- Двигает все элементы влево на `deltaX`
- Когда элемент уходит за левый край → перемещает вправо на `wrapDistance`

#### `pause()`
Паузит прокрутку фона

#### `resume()`
Возобновляет прокрутку фона

#### `reset()`
Сбрасывает фон в начальное состояние:
- `scrollOffset = 0`
- Возвращает все тайлы и декорации в начальные позиции

---

## Спрайты

### Типы спрайтов

#### Sprite (re)
Обычный спрайт с одной текстурой:
```javascript
const sprite = new Sprite(texture)
sprite.anchor.set(0.5, 0.5) // центр
sprite.scale.set(1.0)
sprite.x = 100
sprite.y = 200
```

#### AnimatedSprite
Спрайт с анимацией (последовательность кадров):
```javascript
const animatedSprite = new AnimatedSprite(frames)
animatedSprite.animationSpeed = 0.1
animatedSprite.play()
```

### Свойства спрайтов

- `anchor` - точка привязки (0-1, где 0.5 = центр)
- `scale` - масштаб (x, y)
- `x`, `y` - позиция
- `zIndex` - порядок отрисовки
- `alpha` - прозрачность (0-1)
- `visible` - видимость

---

## Система текстур

### Загрузка текстур

```javascript
// Через систему загрузки
const texture = await te.load(texturePath)

// Или через PixiJS Assets
const texture = await Assets.load(texturePath)
```

### Типы текстур

- **Изображения**: PNG, JPG, WebP
- **Spritesheets**: JSON с описанием кадров
- **Data URIs**: Встроенные base64 изображения

### Оптимизация

- **Кэширование**: Текстуры кэшируются после загрузки
- **Пул спрайтов**: Переиспользование спрайтов для декораций
- **Масштабирование**: Ограничение resolution до 2

---

## Рендеринг

### Основной цикл

```javascript
app.ticker.add(() => {
  // Обновление игры
  gameController.update(app.ticker.deltaMS)
  
  // PixiJS автоматически рендерит stage
})
```

### Оптимизации

1. **Object pooling**: Переиспользование спрайтов для декораций
2. **Culling**: Удаление объектов за экраном
3. **Batch rendering**: Группировка спрайтов для одного draw call
4. **Texture atlas**: Объединение текстур в атласы

---

## Responsive Scaling

### Адаптация к размеру экрана

```javascript
setupResponsiveScaling() {
  const scale = Math.min(
    window.innerWidth / designWidth,
    window.innerHeight / designHeight
  )
  app.stage.scale.set(scale)
  app.stage.position.set(
    (window.innerWidth - designWidth * scale) / 2,
    (window.innerHeight - designHeight * scale) / 2
  )
}
```

### Обработка изменений

```javascript
window.addEventListener("resize", () => {
  setupResponsiveScaling()
})

window.addEventListener("orientationchange", () => {
  setTimeout(setupResponsiveScaling, 100)
})
```

---

## Примечания

- Все игровые объекты наследуются от PixiJS Container или Sprite
- Используется система zIndex для управления слоями
- ParallaxBackground создаёт бесшовную прокрутку через тайлы
- Декорации используют пулы для оптимизации
- Рендеринг происходит автоматически через PixiJS ticker
