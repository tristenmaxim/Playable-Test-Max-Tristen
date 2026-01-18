/**
 * Математические утилиты
 */

/**
 * Ограничивает значение между min и max
 * @param {number} value - Значение
 * @param {number} min - Минимум
 * @param {number} max - Максимум
 * @returns {number} Ограниченное значение
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

/**
 * Линейная интерполяция
 * @param {number} a - Начальное значение
 * @param {number} b - Конечное значение
 * @param {number} t - Параметр интерполяции (0-1)
 * @returns {number} Интерполированное значение
 */
export function lerp(a, b, t) {
  return a + (b - a) * t
}

/**
 * Случайное число между min и max
 * @param {number} min - Минимум
 * @param {number} max - Максимум
 * @returns {number} Случайное число
 */
export function random(min, max) {
  return Math.random() * (max - min) + min
}

/**
 * Случайное целое число между min и max (включительно)
 * @param {number} min - Минимум
 * @param {number} max - Максимум
 * @returns {number} Случайное целое число
 */
export function randomInt(min, max) {
  return Math.floor(random(min, max + 1))
}
