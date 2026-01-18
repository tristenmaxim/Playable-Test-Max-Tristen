# Система ассетов и загрузки

## Обзор

Игра использует систему загрузки ассетов с поддержкой Web Workers для обработки изображений и кэширования текстур.

---

## Система загрузки (te)

### Основной интерфейс

```javascript
const texture = await te.load(path)
```

### Типы ассетов

- **Изображения**: PNG, JPG, WebP
- **Spritesheets**: JSON с описанием кадров
- **Data URIs**: Встроенные base64 изображения

---

## Web Workers для обработки изображений

### ImageBitmap Worker (ks)

Используется для проверки поддержки ImageBitmap API.

#### Структура
```javascript
class ImageBitmapWorker {
  constructor() {
    // Создаёт Worker из Blob с кодом
    const blob = new Blob([workerCode], {type: "application/javascript"})
    const url = URL.createObjectURL(blob)
    this.worker = new Worker(url)
  }
}
```

#### Функционал
- Проверяет поддержку `createImageBitmap`
- Возвращает результат проверки

### Image Loading Worker (Nu)

Используется для загрузки и обработки изображений в фоновом потоке.

#### Структура
```javascript
class ImageLoadingWorker {
  constructor() {
    const blob = new Blob([workerCode], {type: "application/javascript"})
    const url = URL.createObjectURL(blob)
    this.worker = new Worker(url)
  }
}
```

#### Функционал
- Загружает изображения через `fetch`
- Обрабатывает в `createImageBitmap`
- Поддерживает `premultiplied-alpha` режим

#### Worker код
```javascript
async function loadImageBitmap(url, alphaMode) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`)
  }
  const imageBlob = await response.blob()
  return alphaMode === "premultiplied-alpha" 
    ? createImageBitmap(imageBlob, { premultiplyAlpha: "none" })
    : createImageBitmap(imageBlob)
}
```

---

## Worker Pool Manager (Om)

### Обзор

Менеджер пула воркеров для параллельной загрузки изображений.

### Структура

#### Свойства
- `_initialized` - флаг инициализации
- `_createdWorkers` - количество созданных воркеров
- `_workerPool` - пул доступных воркеров
- `_queue` - очередь задач
- `_resolveHash` - хэш промисов для разрешения

#### Константы
- `Or` - максимальное количество воркеров (по умолчанию `navigator.hardwareConcurrency || 4`)

### Методы

#### `isImageBitmapSupported()`
Проверяет поддержку ImageBitmap API:
- Создаёт временный воркер
- Отправляет запрос на проверку
- Возвращает Promise с результатом

#### `loadImageBitmap(url, options)`
Загружает изображение через воркер:
- Добавляет задачу в очередь
- Использует воркер из пула
- Возвращает Promise с ImageBitmap

#### `_initWorkers()`
Инициализирует пул воркеров:
- Создаёт воркеры до лимита `Or`
- Добавляет их в пул

#### `_getWorker()`
Получает воркер из пула:
- Если пул пуст и не достигнут лимит → создаёт новый
- Возвращает доступный воркер

#### `_complete(data)`
Обрабатывает завершение задачи:
- Разрешает соответствующий Promise
- Возвращает воркер в пул
- Обрабатывает следующую задачу из очереди

---

## Кэширование

### Система кэша текстур

Текстуры кэшируются после загрузки для предотвращения повторных загрузок.

#### Механизм
```javascript
// При загрузке
if (cache.has(url)) {
  return cache.get(url)
}
const texture = await loadTexture(url)
cache.set(url, texture)
return texture
```

### Оптимизации

1. **Предзагрузка**: Критические ассеты загружаются заранее
2. **Ленивая загрузка**: Неиспользуемые ассеты загружаются по требованию
3. **Пул воркеров**: Параллельная загрузка нескольких ассетов

---

## Spritesheets

### Формат

Spritesheets используют JSON формат с описанием кадров:

```json
{
  "frames": {
    "frame1": {
      "x": 0,
      "y": 0,
      "width": 100,
      "height": 100
    },
    "frame2": {
      "x": 100,
      "y": 0,
      "width": 100,
      "height": 100
    }
  },
  "meta": {
    "image": "spritesheet.png",
    "format": "RGBA8888"
  }
}
```

### Загрузка

```javascript
// Загрузка spritesheet
const spritesheet = await Assets.load({
  src: "spritesheet.json",
  data: {
    imageFilename: "spritesheet.png"
  }
})

// Получение кадров
const frames = spritesheet.animations.run
const sprite = new AnimatedSprite(frames)
```

---

## Data URIs

### Использование

Многие ассеты встроены как data URIs (base64) для уменьшения количества HTTP запросов.

#### Пример
```javascript
const texture = "data:image/png;base64,iVBORw0KGgo..."
const sprite = new Sprite(Texture.from(texture))
```

### Преимущества

- Нет дополнительных HTTP запросов
- Все ассеты в одном файле
- Быстрая загрузка (если файл уже загружен)

### Недостатки

- Увеличение размера JS файла
- Нет кэширования браузером отдельно

---

## Процесс загрузки

### Последовательность

1. **Инициализация**
   - Проверка поддержки ImageBitmap
   - Создание пула воркеров

2. **Загрузка критических ассетов**
   - Фон
   - Игрок
   - Основные текстуры

3. **Загрузка по требованию**
   - Враги (при спавне)
   - Препятствия (при спавне)
   - Коллекции (при спавне)

### Обработка ошибок

```javascript
try {
  await loadTextures()
} catch (error) {
  // Fallback на простой фон
  await createFallbackBackground()
}
```

---

## Оптимизации

### 1. Параллельная загрузка

Использование пула воркеров для параллельной загрузки нескольких ассетов.

### 2. Предзагрузка

Критические ассеты загружаются заранее в `init()` методах классов.

### 3. Ленивая загрузка

Декоративные элементы загружаются по мере необходимости.

### 4. Кэширование

Все загруженные текстуры кэшируются для повторного использования.

### 5. Оптимизация размера

- Использование data URIs для мелких ассетов
- Spritesheets для анимаций
- Сжатие изображений

---

## Примечания

- Web Workers используются для неблокирующей загрузки изображений
- ImageBitmap API используется для эффективной обработки
- Пул воркеров ограничен количеством ядер процессора
- Система кэширования предотвращает повторные загрузки
- Data URIs используются для встраивания мелких ассетов
