# Система физики и коллизий

## Обзор

Игра использует простую 2D физику с гравитацией для прыжков и систему коллизий на основе прямоугольников (AABB - Axis-Aligned Bounding Box).

---

## Физика

### Гравитация

Применяется только к игроку во время прыжков.

#### Параметры
- `gravity` - ускорение свободного падения (положительное значение, например 0.5)
- `jumpPower` - начальная скорость прыжка (отрицательное значение, например -15)

#### Механика
```javascript
// При прыжке
velocityY = -jumpPower  // Игрок движется вверх

// В update()
velocityY += gravity * deltaMS / 1000  // Применяется гравитация
y += velocityY * deltaMS / 1000        // Обновляется позиция

// При приземлении
if (y >= GROUND_Y) {
  y = GROUND_Y
  velocityY = 0
  isOnGround = true
}
```

### Движение

#### Горизонтальное движение
- Игрок не двигается горизонтально (фиксированная X позиция)
- Все сущности двигаются влево с одинаковой скоростью (`currentSpeed`)

#### Вертикальное движение
- Только игрок может двигаться вертикально (прыжки)
- Все остальные сущности имеют фиксированную Y позицию

---

## Коллизии

### Тип коллизий

Используется **AABB (Axis-Aligned Bounding Box)** - пересечение прямоугольников.

### Метод проверки

#### `rectanglesIntersect(rect1, rect2)`
```javascript
function rectanglesIntersect(rect1, rect2) {
  return rect1.x < rect2.x + rect2.width &&
         rect1.x + rect1.width > rect2.x &&
         rect1.y < rect2.y + rect2.height &&
         rect1.y + rect1.height > rect2.y
}
```

### Хитбоксы

#### Игрок
```javascript
getHitbox() {
  return {
    x: this.sprite.x - this.sprite.width / 2,
    y: this.sprite.y - this.sprite.height / 2,
    width: this.sprite.width,
    height: this.sprite.height
  }
}
```

#### Враги/Препятствия
Аналогично игроку, относительно центра спрайта.

#### Коллекции
Могут иметь специальный хитбокс для более точного определения сбора.

---

## Проверка коллизий

### Порядок проверки

В `GameController.checkCollisions()`:

1. **Враги**
   - Проверяются первыми
   - Если игрок неуязвим → пропускается
   - При столкновении → `handlePlayerHit()` и прерывание цикла

2. **Препятствия**
   - Аналогично врагам
   - Если игрок неуязвим → пропускается
   - При столкновении → `handlePlayerHit()` и прерывание цикла

3. **Коллекции**
   - Проверяются для всех не собранных коллекций
   - При сборе → `collectItem()`

### Оптимизации

1. **Ранний выход**: При первом столкновении цикл прерывается
2. **Неуязвимость**: Пропуск проверок во время неуязвимости
3. **Фильтрация**: Проверяются только активные сущности

---

## Обработка столкновений

### С врагами/препятствиями

#### `handlePlayerHit()`
```javascript
handlePlayerHit() {
  this._hp--                    // Уменьшение HP
  this.player.hurt()            // Анимация урона
  this.emit("hit", {hp: this._hp})  // Событие
  
  if (this._hp <= 0) {
    this.handleLose()           // Поражение
  }
}
```

### С коллекциями

#### `collectItem(collectible)`
```javascript
collectItem(collectible) {
  const screenPos = collectible.getScreenPosition()
  const type = collectible.collectibleType
  
  // Вычисление значения
  let value
  if (type === "paypalCard") {
    value = random(PAYPAL_CARD_MIN, PAYPAL_CARD_MAX)
  } else {
    value = DOLLAR_VALUE
  }
  
  // Обновление счёта
  this._score += value
  collectible.collect()  // Анимация сбора
  
  // Событие
  this.emit("collect", {
    score: this._score,
    from: screenPos,
    collectibleType: type
  })
}
```

---

## Неуязвимость

### Механизм

После получения урона игрок становится неуязвимым на некоторое время.

#### Реализация
```javascript
// В Player
hurt() {
  this.isInvincible = true
  this.invincibilityTimer = INVINCIBILITY_DURATION  // Например, 1000ms
  this.playHurtAnimation()
}

// В update()
if (this.isInvincible) {
  this.invincibilityTimer -= deltaMS
  if (this.invincibilityTimer <= 0) {
    this.isInvincible = false
  }
}
```

#### Визуальная индикация
- Мигание спрайта (alpha)
- Анимация hurt

---

## Проверка выхода за экран

### Метод

#### `isOffScreen()`
```javascript
isOffScreen() {
  return this.x + this.width < -200  // За левым краем экрана
}
```

### Использование

В `cleanupEntities()`:
- Удаляются сущности за экраном
- Освобождается память
- Улучшается производительность

---

## Примечания

- Физика упрощена для производительности
- Используется только гравитация для прыжков
- Коллизии основаны на простых прямоугольниках
- Система неуязвимости предотвращает множественные попадания
- Оптимизации через ранний выход и фильтрацию
