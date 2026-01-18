# Игровые константы

## Обзор

В игре используются несколько объектов с константами, которые минифицированы до коротких имён. Ниже описаны все найденные константы и их использование.

---

## Константы скорости (Ye)

Используются для управления скоростью игры и параллаксом.

### Основные константы:
- `Ye.BASE_SPEED` - базовая скорость игры (используется в `GameController.currentSpeed`)
- `Ye.PARALLAX.GROUND` - множитель параллакса для земли

### Использование:
```javascript
// В GameController
this.currentSpeed = Ye.BASE_SPEED

// В ParallaxBackground
parallax.update(deltaMS, currentSpeed)
// Использует Ye.PARALLAX.GROUND для расчёта скорости слоёв
```

---

## Константы здоровья (Yi)

Управление здоровьем игрока.

### Основные константы:
- `Yi.MAX_HP` - максимальное здоровье игрока

### Использование:
```javascript
// В GameController
this._hp = Yi.MAX_HP

// В App (Zq)
this.renderHearts(Yi.MAX_HP)
```

---

## Константы счёта и валюты (Gt)

Управление балансом и валютными значениями.

### Основные константы:
- `Gt.START_BALANCE` - начальный баланс игрока
- `Gt.DOLLAR_VALUE` - стоимость одного доллара
- `Gt.PAYPAL_CARD_MIN` - минимальная стоимость PayPal карты
- `Gt.PAYPAL_CARD_MAX` - максимальная стоимость PayPal карты

### Использование:
```javascript
// В GameController
this._score = Gt.START_BALANCE

// При сборе предметов
if (collectibleType === "paypalCard") {
  value = random(Gt.PAYPAL_CARD_MIN, Gt.PAYPAL_CARD_MAX)
} else if (collectibleType === "dollar") {
  value = Gt.DOLLAR_VALUE
}
```

---

## Константы позиций (oe)

Геометрические константы для позиционирования.

### Основные константы:
- `oe.GROUND_Y` - Y координата земли (где стоят сущности)

### Использование:
```javascript
// При создании сущностей
entity.y = oe.GROUND_Y
```

---

## Константы zIndex (me)

Управление порядком отрисовки слоёв.

### Основные константы:
- `me.FAR_BACKGROUND` - zIndex для дальнего фона (ParallaxBackground)
- `me.GROUND` - zIndex для земли (entityContainer)
- `me.PLAYER` - zIndex для игрока
- `me.WARNING_LABEL` - zIndex для предупреждающих меток
- `me.OVERLAY` - zIndex для оверлеев
- `me.CONFETTI` - zIndex для конфетти

### Использование:
```javascript
// В GameController
this.parallax.zIndex = me.FAR_BACKGROUND
this.entityContainer.zIndex = me.GROUND
this.player.zIndex = me.PLAYER

// В App
this.overlayContainer.zIndex = me.OVERLAY
this.confettiEmitter.zIndex = me.CONFETTI
```

---

## Константы состояний игры (ge)

Перечисление состояний игры.

### Состояния:
- `ge.LOADING` - загрузка игры
- `ge.INTRO` - начальный экран
- `ge.RUNNING` - игра запущена
- `ge.PAUSED` - игра на паузе (туториал)
- `ge.END_WIN` - победа
- `ge.END_LOSE` - поражение

### Использование:
```javascript
// В GameController
this.setState(ge.INTRO)
this.setState(ge.RUNNING)
this.setState(ge.END_WIN)

// В App
switch (state) {
  case ge.RUNNING:
    this.hideTutorial()
    xe.play("music")
    break
}
```

---

## Константы спавна (Gl)

Массив данных для спавна сущностей.

### Структура:
```javascript
Gl = [
  {
    type: "enemy" | "obstacle" | "collectible" | "finish",
    distance: number, // расстояние от начала в единицах экрана
    pauseForTutorial?: boolean, // пауза для туториала
    warningLabel?: boolean, // показывать предупреждение
    yOffset?: number, // смещение по Y для коллекций
    // ... другие параметры
  },
  // ...
]
```

### Использование:
```javascript
// В GameController.checkSpawns()
const entityData = Gl[this.spawnIndex]
if (distanceTraveled >= entityData.distance * yt - yt) {
  await this.spawnEntity(entityData)
  this.spawnIndex++
}
```

---

## Константы экрана (yt, Me)

Размеры экрана.

### Константы:
- `yt` - ширина экрана (используется для позиционирования)
- `Me` - высота экрана

### Использование:
```javascript
// Позиционирование сущностей
const spawnX = yt + yt * 0.5 // справа от экрана

// Размеры оверлея
overlay.rect(-2000, 0, 5000, Me)
```

---

## Константы текстов и UI (ae)

Текстовые константы для UI и сообщений.

### Основные константы:
- `ae.currencySymbol` - символ валюты (например, "$")
- `ae.tutorial.tapToStart` - текст туториала "Нажмите для старта"
- `ae.tutorial.tapToJump` - текст туториала "Нажмите для прыжка"
- `ae.warnings.avoid` - текст предупреждения "Избегайте!"
- `ae.winScreen.title` - заголовок экрана победы
- `ae.winScreen.subtitle` - подзаголовок экрана победы
- `ae.endScreen.nextPayment` - текст "Следующий платёж"
- `ae.endScreen.ctaButton` - текст кнопки CTA
- `ae.buttons.download` - текст кнопки загрузки
- `ae.praise` - массив текстов похвалы (показываются при сборе предметов)

### Использование:
```javascript
// В App
this.scoreDisplay.textContent = `${ae.currencySymbol}0`
this.tutorialText.textContent = ae.tutorial.tapToStart
this.endTitle.textContent = ae.winScreen.title

// В GameController
warningLabel.textContent = ae.warnings.avoid
```

---

## Примечания

- Все константы минифицированы, поэтому их имена короткие (Ye, Yi, Gt, etc.)
- Константы используются через точечную нотацию (например, `Ye.BASE_SPEED`)
- Некоторые константы являются объектами с вложенными свойствами (например, `Ye.PARALLAX.GROUND`)
- Точные значения констант можно определить только через анализ использования в коде или деобфускацию

---

## Методология поиска констант

1. Поиск использования через grep: `Ye\.|Yi\.|Gt\.|oe\.|me\.|ge\.|ae\.`
2. Анализ контекста использования в классах
3. Вывод значений через логику игры (например, `Yi.MAX_HP` используется для отрисовки сердец)
4. Анализ структуры данных (например, `Gl` - массив объектов с определённой структурой)
