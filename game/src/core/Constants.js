/**
 * Константы игры
 * Основано на анализе из ../анализ/12_constants.md
 */

export const CONSTANTS = {
  // Скорость игры
  SPEED: {
    // Референс: Ye.BASE_SPEED = 600 (из script_00_module.js)
    // Но для достижения первой монетки (720px) за 2.85 секунды нужна скорость 252.63 px/s
    // Формула в оригинале: distanceTraveled += currentSpeed * deltaMS / 1000
    // Фон и сущности движутся с той же скоростью: deltaX = speed * deltaMS / 1000
    BASE: 252.63,            // Скорость для достижения первой монетки за 2.85 секунды (720px / 2.85s ≈ 252.63px/s)
    DECELERATION_RATE: 0.9,  // Коэффициент замедления перед финишем
    MIN: 10                  // Минимальная скорость
  },

  // Здоровье игрока
  HEALTH: {
    MAX: 3,                  // Максимальное здоровье (будет уточнено)
    INVINCIBILITY_DURATION: 1000  // Длительность неуязвимости после получения урона (мс)
  },

  // Счёт и валюта
  SCORE: {
    START_BALANCE: 0,        // Начальный баланс
    DOLLAR_VALUE: 1,         // Стоимость доллара
    PAYPAL_CARD_MIN: 5,      // Минимальная стоимость PayPal карты
    PAYPAL_CARD_MAX: 10      // Максимальная стоимость PayPal карты
  },

  // Позиции (вычисляются динамически)
  POSITIONS: {
    GROUND_Y: 0,              // Будет вычисляться динамически
    // Референсные значения для расчета пропорций:
    // В референсе: Me=1280, oe.GROUND_Y=280
    // roadY = Me - oe.GROUND_Y = 1280 - 280 = 1000
    REFERENCE_SCREEN_HEIGHT: 1280,  // Высота экрана в референсе
    REFERENCE_GROUND_Y: 280         // GROUND_Y в референсе
  },

  // Z-Index слоёв
  // Референс: FINISH_LINE = 35, PLAYER = 70 (финиш ПОД игроком!)
  Z_INDEX: {
    FAR_BACKGROUND: 0,
    MID_BACKGROUND: 1,
    NEAR_BACKGROUND: 2,
    GROUND: 10,
    FINISH_LINE_GROUND: 15,  // Шахматная доска финиша должна быть под игроком
    COLLECTIBLES: 20,
    OBSTACLES: 22,
    FINISH_LINE: 24,  // Столбы и лента финиша (но все равно под игроком)
    ENEMIES: 21,
    PLAYER: 30,  // Игрок должен быть ВЫШЕ финиша
    WARNING_LABEL: 25,
    FOOTER: 50,      // Footer внизу экрана (выше игровых элементов, но ниже UI элементов)
    UI_SCORE: 90,    // Score Display должен быть выше Footer
    UI_HP: 91,       // HP Display должен быть выше Footer
    OVERLAY: 100,
    CONFETTI: 101
  },

  // Состояния игры
  STATES: {
    LOADING: 'loading',
    INTRO: 'intro',
    RUNNING: 'running',
    PAUSED: 'paused',
    END_WIN: 'end_win',
    END_LOSE: 'end_lose'
  },

  // Туториал
  TUTORIAL: {
    PAUSE_DISTANCE: 150      // Расстояние до врага для паузы туториала (px) - среднее значение между слишком рано и слишком поздно
  },

  // Физика прыжков (синусоидальная траектория как в референсе)
  PHYSICS: {
    GRAVITY: 800,            // Сила гравитации (пикселей/сек²) - не используется для прыжка, только для совместимости
    JUMP_HEIGHT: 200,        // Максимальная высота прыжка в пикселях (уменьшено с 300px для более реалистичного прыжка)
    JUMP_DURATION: 800,      // Длительность прыжка в миллисекундах (из референса: oe.JUMP_DURATION = 800)
    // Референс использует синусоидальную траекторию: y = jumpStartY - sin(jumpProgress * PI) * JUMP_HEIGHT
    // где jumpProgress увеличивается от 0 до 1 за JUMP_DURATION (800ms)
    JUMP_POWER: 0            // Не используется (для совместимости)
  },

  // Параллакс
  PARALLAX: {
    GROUND: 1.0,             // Множитель для земли
    MID_BACKGROUND: 0.7,     // Множитель для среднего фона
    NEAR_BACKGROUND: 0.9     // Множитель для ближнего фона
  },

  // Масштабы и смещения для хитбоксов (из референса)
  // ВАЖНО: Эти значения используются ТОЛЬКО для расчета хитбоксов, не для визуального масштабирования!
  HITBOX: {
    PLAYER_SCALE: {
      X: 0.25,   // Хитбокс игрока составляет 25% ширины спрайта
      Y: 0.7     // Хитбокс игрока составляет 70% высоты спрайта
    },
    PLAYER_OFFSET: {
      X: 0,      // Смещение по X
      Y: -0.15   // Смещение по Y (относительное, отрицательное = вверх на 15% высоты)
    },
    ENEMY_SCALE: {
      X: 0.3,    // Хитбокс врага составляет 30% ширины спрайта
      Y: 0.5     // Хитбокс врага составляет 50% высоты спрайта
    },
    ENEMY_OFFSET: {
      X: 0,      // Смещение по X
      Y: 0.2     // Смещение по Y (относительное, положительное = вниз на 20% высоты)
    }
  }
}

// Вычисляемые константы
export function initDynamicConstants() {
  // В референсе используется фиксированное значение oe.GROUND_Y = 280
  // Но для адаптации к разным размерам экрана используем пропорциональное вычисление
  // Референс: Me=1280, oe.GROUND_Y=280 (это примерно 21.875% от высоты экрана)
  // Но для правильного позиционирования используем фиксированное значение как базовое
  const referenceHeight = CONSTANTS.POSITIONS.REFERENCE_SCREEN_HEIGHT
  const referenceGroundY = CONSTANTS.POSITIONS.REFERENCE_GROUND_Y
  const scale = window.innerHeight / referenceHeight
  
  // Масштабируем GROUND_Y пропорционально высоте экрана
  CONSTANTS.POSITIONS.GROUND_Y = referenceGroundY * scale
}
