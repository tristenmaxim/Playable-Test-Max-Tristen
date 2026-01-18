/**
 * Утилиты для коллизий
 * Основано на анализе из ../анализ/10_physics_collisions.md
 */

/**
 * Проверяет пересечение двух прямоугольников (AABB)
 * @param {Object} rect1 - Первый прямоугольник {x, y, width, height}
 * @param {Object} rect2 - Второй прямоугольник {x, y, width, height}
 * @returns {boolean} true если прямоугольники пересекаются
 */
export function rectanglesIntersect(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  )
}

/**
 * Получает хитбокс спрайта
 * @param {PIXI.Sprite} sprite - Спрайт PixiJS
 * @returns {Object} Хитбокс {x, y, width, height}
 */
export function getHitbox(sprite) {
  const anchorX = sprite.anchor?.x || 0.5
  const anchorY = sprite.anchor?.y || 0.5
  
  return {
    x: sprite.x - sprite.width * anchorX,
    y: sprite.y - sprite.height * anchorY,
    width: sprite.width,
    height: sprite.height
  }
}

/**
 * Проверяет коллизию между двумя спрайтами
 * @param {PIXI.Sprite} sprite1 - Первый спрайт
 * @param {PIXI.Sprite} sprite2 - Второй спрайт
 * @returns {boolean} true если спрайты пересекаются
 */
export function spritesIntersect(sprite1, sprite2) {
  const rect1 = getHitbox(sprite1)
  const rect2 = getHitbox(sprite2)
  return rectanglesIntersect(rect1, rect2)
}
