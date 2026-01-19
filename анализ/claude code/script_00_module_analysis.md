# Анализ оригинального файла `script_00_module.js`

**Источник:** `/Users/maximtristen/Desktop/Playable-Test-4/reference/extracted_code/scripts/script_00_module.js`

---

## 1. ИГРОК (Player) - Константы `oe`

| Параметр | Значение | Описание |
|----------|----------|----------|
| `X_POSITION` | 0.18 | Позиция игрока по X (18% от ширины экрана) |
| `GROUND_Y` | 280 | Y-координата земли |
| `JUMP_HEIGHT` | 300 | Высота прыжка (пиксели) |
| `JUMP_DURATION` | 800 | Длительность прыжка (мс) |
| `INVINCIBILITY_TIME` | 500 | Время неуязвимости после урона (мс) |
| `SCALE` | **0.54** | Визуальный масштаб игрока |
| `ANIMATION_SPEED` | 0.15 | Скорость анимации |

**Хитбокс игрока** (из `Te`):
- `PLAYER_SCALE.X`: 0.25 (25% ширины спрайта)
- `PLAYER_SCALE.Y`: 0.7 (70% высоты спрайта)
- `PLAYER_OFFSET.X`: 0
- `PLAYER_OFFSET.Y`: -0.15

---

## 2. ВРАГИ (Enemy) - Константы `jS` и `Te`

| Параметр | Значение | Описание |
|----------|----------|----------|
| `CHASE_SPEED` | 300 | Скорость преследования врага (px/s) |
| `ENEMY_SCALE.X` | 0.3 | Масштаб хитбокса по X |
| `ENEMY_SCALE.Y` | 0.5 | Масштаб хитбокса по Y |
| `ENEMY_OFFSET.X` | 0 | Смещение хитбокса по X |
| `ENEMY_OFFSET.Y` | 0.2 | Смещение хитбокса по Y |

---

## 3. КОЛЛЕКТАБЛЫ И ПРЕПЯТСТВИЯ

| Параметр | Значение | Описание |
|----------|----------|----------|
| `COLLECTIBLE_RADIUS` | 60 | Радиус подбора коллектабла |
| `OBSTACLE_SHRINK` | 10 | Сжатие хитбокса препятствия |
| `OBSTACLE_OFFSET.X` | 0 | Смещение препятствия по X |
| `OBSTACLE_OFFSET.Y` | 0 | Смещение препятствия по Y |
| `DOLLAR_VALUE` | 20 | Стоимость доллара |
| `PAYPAL_CARD_MIN` | 5 | Мин. сумма PayPal карты |
| `PAYPAL_CARD_MAX` | 50 | Макс. сумма PayPal карты |

---

## 4. СКОРОСТИ И ФИЗИКА - Константы `Ye`

| Параметр | Значение | Описание |
|----------|----------|----------|
| `BASE_SPEED` | **600** | Базовая скорость игры (px/s) |
| `PARALLAX.GROUND` | 1 | Множитель параллакса земли |

**Дополнительные физические параметры:**
- `GRAVITY`: 0.05 (слабая) / 0.3 (сильная для частиц)
- `DAMPING`: 0.95
- `AIR_RESISTANCE`: 0.998
- `MIN_VELOCITY_THRESHOLD`: 0.1

---

## 5. АНИМАЦИИ ИГРОКА

**Состояния анимации (enum `pe`):**
- `IDLE` - idle (18 фреймов: idle_0...idle_17)
- `RUN` - run (8 фреймов: run_0...run_7)
- `JUMP` - jump (10 фреймов: jump_0...jump_9)
- `HURT` - hurt (5 фреймов: hurt_0...hurt_4)

**Скорости анимации:**
- IDLE/RUN: `0.15`
- JUMP: `0.15 × 1.5 = 0.225`
- HURT: `0.15 × 2 = 0.30`

**Спрайтшит:** `player-woman.png` (932×1506 px, scale 0.5)

---

## 6. Z-INDEX СЛОЁВ (Константы `me`)

| Слой | Z-Index |
|------|---------|
| FAR_BACKGROUND | 0 |
| MID_BACKGROUND | 5 |
| NEAR_BACKGROUND | 8 |
| GROUND | 10 |
| COLLECTIBLES | 20 |
| OBSTACLES | 30 |
| FINISH_LINE | 35 |
| ENEMIES | 40 |
| WARNING_LABEL | 50 |
| PLAYER | 70 |
| OVERLAY | 85 |
| CONFETTI | 90 |

---

## 7. ПАРАЛЛАКС ФОН - Класс `Tq`

| Параметр | Значение |
|----------|----------|
| `LAMP_SPACING` | 800 |
| `TREE_MIN_SPACING` | 300 |
| `TREE_MAX_SPACING` | 500 |
| `SCREEN_BUFFER` | 1200 |

**Масштабы элементов:**
- Лампы: `scale.set(1.8)`
- Деревья: `scale.set(1.81)`
- Кусты: `scale.set(0.45 + random * 0.15)`

---

## 8. ПОЛНАЯ СТРУКТУРА СПАВНА УРОВНЯ (40 объектов)

```javascript
[
  {type:"collectible", distance:1},
  {type:"collectible", distance:2},
  {type:"enemy", distance:3, pauseForTutorial:false},
  {type:"collectible", distance:4, yOffset:50},
  {type:"collectible", distance:4.2, yOffset:150},
  {type:"collectible", distance:4.4, yOffset:250},
  {type:"collectible", distance:4.6, yOffset:150},
  {type:"collectible", distance:4.8, yOffset:50},
  {type:"obstacle", distance:5.6, warningLabel:false},
  {type:"collectible", distance:6.4},
  {type:"enemy", distance:7},
  {type:"collectible", distance:7.6},
  {type:"collectible", distance:7.8, yOffset:100},
  {type:"collectible", distance:8, yOffset:200},
  {type:"collectible", distance:8.2, yOffset:280},
  {type:"collectible", distance:8.4, yOffset:200},
  {type:"collectible", distance:8.6, yOffset:100},
  {type:"obstacle", distance:9, warningLabel:false},
  {type:"collectible", distance:9.6},
  {type:"enemy", distance:10},
  {type:"collectible", distance:10.6},
  {type:"collectible", distance:11, yOffset:80},
  {type:"collectible", distance:11.2, yOffset:180},
  {type:"collectible", distance:11.4, yOffset:80},
  {type:"obstacle", distance:12},
  {type:"enemy", distance:12.6},
  {type:"collectible", distance:13},
  {type:"collectible", distance:13.2, yOffset:100},
  {type:"collectible", distance:13.4, yOffset:200},
  {type:"collectible", distance:13.6, yOffset:100},
  {type:"obstacle", distance:14, warningLabel:false},
  {type:"collectible", distance:14.5},
  {type:"enemy", distance:15},
  {type:"collectible", distance:15.4, yOffset:80},
  {type:"collectible", distance:15.6, yOffset:180},
  {type:"collectible", distance:15.8, yOffset:260},
  {type:"collectible", distance:16, yOffset:180},
  {type:"collectible", distance:16.2, yOffset:80},
  {type:"obstacle", distance:16.5},
  {type:"finish", distance:18}
]
```

**Статистика:**
- Collectibles: 29
- Enemies: 5
- Obstacles: 5
- Finish: 1

---

## 9. ЗДОРОВЬЕ И ОЧКИ

| Параметр | Значение |
|----------|----------|
| `MAX_HP` | 3 |
| `START_BALANCE` | 0 |

---

## 10. ЭФФЕКТЫ ЧАСТИЦ - Константы `G`

| Параметр | Значение |
|----------|----------|
| `PARTICLE_COUNT` | 50 |
| `LIFETIME` | 5 (сек) |
| `FADE_START` | 0.7 |
| `SCALE_MIN` | 0.8 |
| `SCALE_MAX` | 1.5 |
| `BURST_SPEED_MIN` | 12 |
| `BURST_SPEED_MAX` | 20 |
| `BURST_ANGLE_SPREAD` | 30° |
| `ROTATION_SPEED_MIN` | 0.02 |
| `ROTATION_SPEED_MAX` | 0.1 |
| `PULSE_SPEED` | 0.003 |

---

## 11. КЛЮЧЕВЫЕ ФОРМУЛЫ

### Позиция игрока:
```javascript
x = window.innerWidth * 0.18
y = groundY (динамически вычисляется)
```

### Прыжок (синусоидальная траектория):
```javascript
y = jumpStartY - Math.sin(jumpProgress * Math.PI) * JUMP_HEIGHT
jumpProgress += deltaTime / JUMP_DURATION
```

### Масштабирование фона:
```javascript
bgScale = Math.max(screenWidth / bgTexture.width, screenHeight / bgTexture.height)
```

### Расчёт позиции спавна:
```javascript
spawnX = distance * screenWidth  // distance в условных единицах (0-18)
spawnY = groundY - yOffset       // yOffset в пикселях
```
