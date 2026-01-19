/**
 * Данные спавна всех сущностей из референса (массив Gl)
 * Структура: { type: 'collectible' | 'enemy' | 'obstacle' | 'finish', distance: число, yOffset?: число, ... }
 * 
 * В референсе используется система где:
 * - distance - расстояние в единицах (1 единица = yt = window.innerWidth пикселей, обычно 720px)
 * - yOffset - смещение по Y в пикселях (положительное = выше, отрицательное = ниже)
 * - pauseForTutorial - для врагов: пауза игры для показа туториала
 * - warningLabel - для препятствий: показывать ли предупреждающую метку
 * 
 * ВАЖНО: 
 * - Тип коллекции (dollar/paypalCard) определяется случайно в GameController (60% dollar, 40% paypalCard)
 * - Данные отсортированы по distance для последовательного спавна
 * - Все позиции фиксированы из референса (массив Gl)
 */

export const SPAWN_DATA = [
  // Коллекции
  { type: 'collectible', distance: 1.0 },
  { type: 'collectible', distance: 2.0 },
  
  // Первый враг (с туториалом)
  { type: 'enemy', distance: 3.0, pauseForTutorial: false },
  
  // Группа коллекций с разными высотами
  { type: 'collectible', distance: 4.0, yOffset: 50 },
  { type: 'collectible', distance: 4.2, yOffset: 150 },
  { type: 'collectible', distance: 4.4, yOffset: 250 },
  { type: 'collectible', distance: 4.6, yOffset: 150 },
  { type: 'collectible', distance: 4.8, yOffset: 50 },
  
  // Первое препятствие
  { type: 'obstacle', distance: 5.6, warningLabel: false },
  
  // Коллекции
  { type: 'collectible', distance: 6.4 },
  
  // Второй враг
  { type: 'enemy', distance: 7.0 },
  
  // Коллекции
  { type: 'collectible', distance: 7.6 },
  { type: 'collectible', distance: 7.8, yOffset: 100 },
  { type: 'collectible', distance: 8.0, yOffset: 200 },
  { type: 'collectible', distance: 8.2, yOffset: 280 },
  { type: 'collectible', distance: 8.4, yOffset: 200 },
  { type: 'collectible', distance: 8.6, yOffset: 100 },
  
  // Второе препятствие
  { type: 'obstacle', distance: 9.0, warningLabel: false },
  
  // Коллекции
  { type: 'collectible', distance: 9.6 },
  
  // Третий враг
  { type: 'enemy', distance: 10.0 },
  
  // Коллекции
  { type: 'collectible', distance: 10.6 },
  { type: 'collectible', distance: 11.0, yOffset: 80 },
  { type: 'collectible', distance: 11.2, yOffset: 180 },
  { type: 'collectible', distance: 11.4, yOffset: 80 },
  
  // Третье препятствие
  { type: 'obstacle', distance: 12.0 },
  
  // Четвертый враг
  { type: 'enemy', distance: 12.6 },
  
  // Коллекции
  { type: 'collectible', distance: 13.0 },
  { type: 'collectible', distance: 13.2, yOffset: 100 },
  { type: 'collectible', distance: 13.4, yOffset: 200 },
  { type: 'collectible', distance: 13.6, yOffset: 100 },
  
  // Четвертое препятствие
  { type: 'obstacle', distance: 14.0, warningLabel: false },
  
  // Коллекции
  { type: 'collectible', distance: 14.5 },
  
  // Пятый враг
  { type: 'enemy', distance: 15.0 },
  
  // Группа коллекций
  { type: 'collectible', distance: 15.4, yOffset: 80 },
  { type: 'collectible', distance: 15.6, yOffset: 180 },
  { type: 'collectible', distance: 15.8, yOffset: 260 },
  { type: 'collectible', distance: 16.0, yOffset: 180 },
  { type: 'collectible', distance: 16.2, yOffset: 80 },
  
  // Пятое препятствие
  { type: 'obstacle', distance: 16.5 },
  
  // Финиш
  { type: 'finish', distance: 18.0 }
]

/**
 * Данные спавна только коллекций (для обратной совместимости)
 * @deprecated Используйте SPAWN_DATA вместо этого
 */
export const COLLECTIBLE_SPAWN_DATA = SPAWN_DATA
  .filter(item => item.type === 'collectible')
  .map(({ type, ...rest }) => rest) // Удаляем type, оставляем только distance и yOffset
