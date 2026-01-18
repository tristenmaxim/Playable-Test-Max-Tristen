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
    GROUND_Y: 0              // Будет вычисляться как window.innerHeight * 0.8
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
    JUMP_POWER: 400          // Сила прыжка (пикселей/сек)
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
  CONSTANTS.POSITIONS.GROUND_Y = window.innerHeight * 0.8
}
