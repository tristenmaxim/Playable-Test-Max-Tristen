/**
 * Константы игры
 * Основано на анализе из ../анализ/12_constants.md
 */

export const CONSTANTS = {
  // Скорость игры
  SPEED: {
    BASE: 200,              // Базовая скорость (будет уточнено при тестировании)
    DECELERATION_RATE: 0.9,  // Коэффициент замедления перед финишем
    MIN: 10                  // Минимальная скорость
  },

  // Здоровье игрока
  HEALTH: {
    MAX: 3                   // Максимальное здоровье (будет уточнено)
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
  Z_INDEX: {
    FAR_BACKGROUND: 0,
    MID_BACKGROUND: 1,
    NEAR_BACKGROUND: 2,
    GROUND: 10,
    PLAYER: 20,
    ENEMIES: 21,
    OBSTACLES: 22,
    COLLECTIBLES: 23,
    FINISH_LINE: 24,
    WARNING_LABEL: 25,
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
    PAUSE_DISTANCE: 300      // Расстояние до врага для паузы туториала (px)
  },

  // Физика прыжков
  PHYSICS: {
    GRAVITY: 800,            // Сила гравитации (пикселей/сек²)
    JUMP_HEIGHT: 147,        // Максимальная высота прыжка в пикселях (220 / 1.5 ≈ 147px)
    // Формула: h = v0² / (2*g), где h = JUMP_HEIGHT = 147px, g = 800
    // v0 = sqrt(147 * 2 * 800) = sqrt(235200) ≈ 485
    JUMP_POWER: 485          // Сила прыжка (пикселей/сек) - рассчитано для JUMP_HEIGHT = 147px
  },

  // Параллакс
  PARALLAX: {
    GROUND: 1.0,             // Множитель для земли
    MID_BACKGROUND: 0.7,     // Множитель для среднего фона
    NEAR_BACKGROUND: 0.9     // Множитель для ближнего фона
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
