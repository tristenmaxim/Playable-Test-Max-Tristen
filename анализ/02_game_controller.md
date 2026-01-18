# GameController (Iq) - Детальный анализ

## Обзор

`Iq` (GameController) - основной контроллер игрового процесса, управляющий всеми игровыми системами, состояниями, сущностями и коллизиями.

## Структура класса

### Конструктор
```javascript
constructor(e) {
  // e - PixiJS Application instance
  this.app = e
  // Инициализация всех свойств через V() helper
}
```

### Основные свойства

#### Состояния игры
- `_state` - текущее состояние игры (`ge.LOADING`, `ge.INTRO`, `ge.RUNNING`, `ge.PAUSED`, `ge.END_WIN`, `ge.END_LOSE`)
- `isRunning` - флаг активности игрового цикла
- `isDecelerating` - флаг замедления перед финишем
- `currentSpeed` - текущая скорость игры (начинается с `Ye.BASE_SPEED`)

#### Игровые сущности
- `player` - экземпляр класса `$S` (Player)
- `parallax` - экземпляр класса `Tq` (ParallaxBackground)
- `enemies` - массив врагов (`sq`)
- `obstacles` - массив препятствий (`oq`)
- `collectibles` - массив собираемых предметов (`lq`)
- `finishLine` - финишная линия (`pq`)
- `warningLabels` - массив предупреждающих меток

#### Игровые метрики
- `_score` - текущий счёт (начинается с `Gt.START_BALANCE`)
- `_hp` - здоровье игрока (начинается с `Yi.MAX_HP`)
- `distanceTraveled` - пройденное расстояние
- `spawnIndex` - индекс текущего спавна из массива `Gl`

#### Туториал
- `tutorialEnemy` - враг для туториала
- `tutorialTriggered` - флаг срабатывания туториала
- `jumpingEnabled` - разрешены ли прыжки
- `TUTORIAL_PAUSE_DISTANCE` - расстояние до врага для паузы туториала (300)

#### Замедление
- `DECELERATION_RATE` - коэффициент замедления (0.9)
- `MIN_SPEED` - минимальная скорость перед остановкой (10)

#### Контейнеры
- `gameContainer` - главный контейнер игры
- `entityContainer` - контейнер для игровых сущностей
- `events` - Map для событийной системы

---

## Методы

### Инициализация

#### `async init()`
Создаёт структуру игры:
1. Создаёт `gameContainer` и добавляет в stage
2. Инициализирует `parallax` (ParallaxBackground)
3. Создаёт `entityContainer` для сущностей
4. Инициализирует `player` (Player)
5. Устанавливает начальное состояние `ge.INTRO`

### Управление состоянием

#### `start()`
Запускает игру из состояния `INTRO`:
- Устанавливает `isRunning = true`
- Запускает анимацию бега игрока (`player.run()`)
- Переводит в состояние `ge.RUNNING`
- Эмитит событие `"start"`

#### `handleTap()`
Обрабатывает тап/клик в зависимости от состояния:
- `INTRO` → запускает игру (`start()`)
- `PAUSED` → возобновляет после туториала (`resumeFromTutorial()`)
- `RUNNING` → прыжок игрока (если разрешено и не финиш)

#### `resumeFromTutorial()`
Возобновляет игру после туториала:
- Включает `isRunning` и `jumpingEnabled`
- Запускает игрока (`player.run()`)
- Возобновляет параллакс (`parallax.resume()`)
- Запускает всех врагов (`enemies.forEach(e => e.play())`)
- Переводит в `RUNNING`
- Выполняет прыжок и эмитит события `"jump"` и `"tutorialComplete"`

#### `setState(newState)`
Изменяет состояние игры:
- Сохраняет старое состояние
- Устанавливает новое
- Эмитит событие `"stateChange"` с `{from, to}`

### Игровой цикл

#### `update(deltaMS)`
Основной метод обновления игры (вызывается каждый кадр):

**Всегда:**
- Обновляет игрока (`player.update(deltaMS)`)

**Если игра запущена (`isRunning`):**

1. **Замедление перед финишем:**
   - Если `isDecelerating`:
     - Уменьшает скорость (`currentSpeed *= DECELERATION_RATE`)
     - Если скорость < `MIN_SPEED` → останавливает и вызывает `handleWin()` через 500ms

2. **Обновление параллакса:**
   - `parallax.update(deltaMS, currentSpeed)`

3. **Расчёт пройденного расстояния:**
   - `distanceTraveled += currentSpeed * deltaMS / 1000`

4. **Спавн сущностей:**
   - `checkSpawns()` - проверяет и спавнит новые сущности

5. **Обновление сущностей:**
   - `updateEntities(deltaMS)` - обновляет всех врагов, препятствия, коллекции, финиш

6. **Обновление предупреждений:**
   - `updateWarningLabels(deltaMS)` - анимирует и перемещает метки предупреждений

7. **Проверка туториала:**
   - `checkTutorialTrigger()` - проверяет необходимость паузы для туториала

8. **Проверка финиша:**
   - Если игрок достиг `finishLine.tapeBreakX` → запускает замедление

9. **Проверка коллизий:**
   - `checkCollisions()` - проверяет столкновения с врагами, препятствиями, коллекциями

10. **Очистка:**
    - `cleanupEntities()` - удаляет сущности за экраном

### Спавн сущностей

#### `checkSpawns()`
Проверяет массив `Gl` (спавн-данные) и создаёт сущности по мере продвижения:
- Проходит по `Gl[spawnIndex]`
- Вычисляет позицию: `e.distance * yt`
- Если `distanceTraveled >= t - yt` → спавнит сущность и увеличивает `spawnIndex`

#### `async spawnEntity(entityData)`
Создаёт сущность по типу из `entityData`:

**Типы сущностей:**
- `"enemy"` → создаёт `sq` (Enemy)
  - Если `pauseForTutorial` и туториал не сработал → помечает как `tutorialEnemy`
- `"obstacle"` → создаёт `oq` (Obstacle)
  - Если есть `warningLabel` → создаёт предупреждающую метку
- `"collectible"` → создаёт `lq` (Collectible)
  - Случайный тип: 60% "dollar", 40% "paypalCard"
  - Может иметь `yOffset` для вертикальной позиции
- `"finish"` → создаёт `pq` (FinishLine)
  - Устанавливает `finishLineSpawned = true`

**Позиционирование:**
- Все сущности спавнятся на позиции `yt + yt * 0.5` (справа от экрана)

### Туториал

#### `checkTutorialTrigger()`
Проверяет расстояние до `tutorialEnemy`:
- Если враг ближе `TUTORIAL_PAUSE_DISTANCE` (300px) → вызывает `triggerTutorialPause("enemy")`

#### `triggerTutorialPause(type)`
Паузит игру для показа туториала:
- Устанавливает `tutorialTriggered = true`
- Останавливает игру (`isRunning = false`)
- Останавливает игрока (`player.idle()`)
- Паузит параллакс (`parallax.pause()`)
- Останавливает всех врагов (`enemies.forEach(t => t.stop())`)
- Переводит в состояние `ge.PAUSED`
- Эмитит событие `"showTutorial"` с типом

### Коллизии

#### `checkCollisions()`
Проверяет все коллизии:

1. **Враги:**
   - Для каждого врага проверяет пересечение с хитбоксом игрока
   - Если игрок неуязвим → пропускает
   - При столкновении → вызывает `handlePlayerHit()` и прерывает цикл

2. **Препятствия:**
   - Аналогично врагам

3. **Коллекции:**
   - Для каждой не собранной коллекции проверяет `checkCollectionWithHitbox()`
   - При сборе → вызывает `collectItem()`

#### `rectanglesIntersect(rect1, rect2)`
Проверяет пересечение двух прямоугольников:
```javascript
return rect1.x < rect2.x + rect2.width &&
       rect1.x + rect1.width > rect2.x &&
       rect1.y < rect2.y + rect2.height &&
       rect1.y + rect1.height > rect2.y
```

#### `handlePlayerHit()`
Обрабатывает попадание:
- Уменьшает HP (`_hp--`)
- Вызывает `player.hurt()` (анимация урона)
- Эмитит событие `"hit"` с текущим HP
- Если HP <= 0 → вызывает `handleLose()`

#### `collectItem(collectible)`
Обрабатывает сбор предмета:
- Получает позицию на экране (`getScreenPosition()`)
- Определяет тип (`collectibleType`)
- Вычисляет значение:
  - `"paypalCard"` → случайное от `Gt.PAYPAL_CARD_MIN` до `Gt.PAYPAL_CARD_MAX`
  - `"dollar"` → `Gt.DOLLAR_VALUE`
- Увеличивает счёт (`_score += value`)
- Вызывает `collectible.collect()` (анимация сбора)
- Эмитит событие `"collect"` с данными

### Завершение игры

#### `startDeceleration()`
Запускает замедление перед финишем:
- Устанавливает `isDecelerating = true`
- Вызывает `finishLine.breakTape()` (анимация разрыва ленты)
- Эмитит событие `"crossedFinish"`

#### `handleWin()`
Обрабатывает победу:
- Останавливает игру (`isRunning = false`)
- Останавливает игрока (`player.idle()`)
- Паузит параллакс
- Останавливает всех врагов
- Переводит в состояние `ge.END_WIN`
- Эмитит событие `"win"` с финальным счётом

#### `handleLose()`
Обрабатывает поражение:
- Аналогично `handleWin()`, но:
  - `player.idle(true)` - возможно с параметром для анимации смерти
  - Состояние `ge.END_LOSE`
  - Событие `"lose"`

### Обновление сущностей

#### `updateEntities(deltaMS)`
Обновляет все игровые сущности:
- Враги: устанавливает `speed = currentSpeed`, вызывает `update(deltaMS)`
- Препятствия: аналогично
- Коллекции: аналогично
- Финиш: аналогично

### Предупреждающие метки

#### `createWarningLabel(x, y)`
Создаёт предупреждающую метку:
- Контейнер с `zIndex = me.WARNING_LABEL`
- Текст из `ae.warnings.avoid`
- Стиль: красный текст, чёрная обводка, жёлтый фон
- Пульсирующая анимация через `scale`
- Добавляет в `warningLabels` с `gameX` для отслеживания

#### `updateWarningLabels(deltaMS)`
Обновляет метки:
- Двигает по X с учётом `currentSpeed`
- Применяет пульсирующую анимацию (`scale = 1 + sin(time) * 0.1`)
- Удаляет метки за экраном (`gameX < -200`)

### Очистка

#### `cleanupEntities()`
Удаляет сущности за экраном:
- Враги: фильтрует через `isOffScreen()`, удаляет из контейнера
- Препятствия: аналогично
- Коллекции: удаляет если `isOffScreen()` ИЛИ `collected`
- Финиш: удаляет если `isOffScreen()`

### Управление паузой

#### `pause()`
Паузит игру (если состояние `RUNNING`):
- Останавливает `isRunning`
- Паузит параллакс

#### `resume()`
Возобновляет игру (если состояние `RUNNING`):
- Запускает `isRunning`
- Возобновляет параллакс

### Сброс

#### `reset()`
Полный сброс игры:
- Состояние → `ge.INTRO`
- Счёт → `Gt.START_BALANCE`
- HP → `Yi.MAX_HP`
- Сбрасывает все флаги и индексы
- Сбрасывает параллакс и игрока
- Удаляет все сущности из контейнеров
- Очищает массивы
- Эмитит событие `"reset"`

### Событийная система

#### `on(event, callback)`
Подписывается на событие

#### `off(event, callback)`
Отписывается от события

#### `emit(event, data)`
Эмитит событие всем подписчикам

**События:**
- `"start"` - игра запущена
- `"stateChange"` - изменение состояния `{from, to}`
- `"hit"` - попадание `{hp}`
- `"collect"` - сбор предмета `{score, from, collectibleType}`
- `"win"` - победа `{score}`
- `"lose"` - поражение `{score}`
- `"jump"` - прыжок
- `"crossedFinish"` - пересечение финиша
- `"showTutorial"` - показ туториала `{type}`
- `"tutorialComplete"` - завершение туториала
- `"reset"` - сброс игры

---

## Константы (используемые)

- `Ye.BASE_SPEED` - базовая скорость игры
- `Ye.PARALLAX.GROUND` - множитель параллакса для земли
- `Yi.MAX_HP` - максимальное здоровье
- `Gt.START_BALANCE` - начальный баланс
- `Gt.DOLLAR_VALUE` - стоимость доллара
- `Gt.PAYPAL_CARD_MIN` - минимальная стоимость PayPal карты
- `Gt.PAYPAL_CARD_MAX` - максимальная стоимость PayPal карты
- `oe.GROUND_Y` - Y координата земли
- `me.*` - zIndex значения для слоёв
- `ge.*` - состояния игры
- `Gl` - массив данных спавна сущностей
- `yt` - ширина экрана (используется для позиционирования)
- `Me` - высота экрана
- `ae.warnings.avoid` - текст предупреждения
- `ae.currencySymbol` - символ валюты

---

## Зависимости

- `$S` (Player) - игрок
- `Tq` (ParallaxBackground) - фон
- `sq` (Enemy) - враги
- `oq` (Obstacle) - препятствия
- `lq` (Collectible) - коллекции
- `pq` (FinishLine) - финиш
- PixiJS Application, Container, Sprite

---

## Примечания

- Все сущности обновляются с одинаковой `currentSpeed` для синхронизации
- Система туториала работает только с первым врагом, помеченным `pauseForTutorial`
- Замедление перед финишем создаёт плавный переход к экрану победы
- Коллизии проверяются через простые прямоугольники (AABB)
- Система событий позволяет слабую связанность между компонентами
