/**
 * Утилиты для UI
 */

/**
 * Адаптирует размер текста к контейнеру
 * @param {HTMLElement} element - Элемент с текстом
 * @param {number} maxSize - Максимальный размер шрифта
 * @param {number} minSize - Минимальный размер шрифта
 */
export function fitTextToContainer(element, maxSize, minSize) {
  let fontSize = maxSize
  element.style.fontSize = `${fontSize}px`
  const containerWidth = element.offsetWidth || element.parentElement.offsetWidth
  
  while (element.scrollWidth > containerWidth && fontSize > minSize) {
    fontSize -= 1
    element.style.fontSize = `${fontSize}px`
  }
}

/**
 * Создаёт элемент с базовыми стилями
 * @param {string} tag - Тег элемента
 * @param {Object} styles - Объект со стилями
 * @param {string} className - CSS класс
 * @returns {HTMLElement} Созданный элемент
 */
export function createElement(tag, styles = {}, className = '') {
  const element = document.createElement(tag)
  if (className) {
    element.className = className
  }
  Object.assign(element.style, styles)
  return element
}
