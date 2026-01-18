/**
 * Данные спавна collectibles из референса
 * Структура: { distance: число (в единицах расстояния, где 1 единица = window.innerWidth), yOffset: число }
 * 
 * ВАЖНО: Тип коллекции (dollar/paypalCard) определяется случайно в GameController (60% dollar, 40% paypalCard)
 * Здесь указываются только позиции (distance и yOffset)
 * 
 * В референсе используется система где:
 * - distance - расстояние в единицах (1 единица = yt = window.innerWidth пикселей)
 * - yOffset - смещение по Y в пикселях (положительное = выше, отрицательное = ниже)
 * - Несколько предметов могут иметь близкие расстояния для создания групп (вертикальных колонок)
 */

export const COLLECTIBLE_SPAWN_DATA = [
  // Начало игры - первые предметы (из референса)
  { distance: 1, yOffset: 0 },
  { distance: 2, yOffset: 0 },
  
  // Группа с разными высотами (из референса: distance 4-4.8)
  { distance: 4, yOffset: 50 },
  { distance: 4.2, yOffset: 150 },
  { distance: 4.4, yOffset: 250 },
  { distance: 4.6, yOffset: 150 },
  { distance: 4.8, yOffset: 50 },
  
  // Одиночные предметы (из референса)
  { distance: 6.4, yOffset: 0 },
  { distance: 7.6, yOffset: 0 },
  
  // Группа с разными высотами (из референса: distance 7.8-8.6)
  { distance: 7.8, yOffset: 100 },
  { distance: 8, yOffset: 200 },
  { distance: 8.2, yOffset: 280 },
  { distance: 8.4, yOffset: 200 },
  { distance: 8.6, yOffset: 100 },
  
  // Продолжаем паттерн (из референса)
  { distance: 9.6, yOffset: 0 },
  { distance: 10.6, yOffset: 0 },
  
  // Группа (из референса: distance 11-11.4)
  { distance: 11, yOffset: 80 },
  { distance: 11.2, yOffset: 180 },
  { distance: 11.4, yOffset: 80 },
  
  // Одиночный предмет (из референса)
  { distance: 13, yOffset: 0 },
  
  // Группа (из референса: distance 13.2-13.6)
  { distance: 13.2, yOffset: 100 },
  { distance: 13.4, yOffset: 200 },
  { distance: 13.6, yOffset: 100 },
  
  // Одиночный предмет (из референса)
  { distance: 14.5, yOffset: 0 },
  
  // Группа (из референса: distance 15.4-16.2)
  { distance: 15.4, yOffset: 80 },
  { distance: 15.6, yOffset: 180 },
  { distance: 15.8, yOffset: 260 },
  { distance: 16, yOffset: 180 },
  { distance: 16.2, yOffset: 80 },
]
