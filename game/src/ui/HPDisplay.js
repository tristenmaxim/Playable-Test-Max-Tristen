/**
 * HP Display - отображение здоровья игрока
 * Этап 14: UI - HP Display
 */

import { Container, Text, TextStyle } from 'pixi.js'
import { CONSTANTS } from '../core/Constants.js'

export class HPDisplay extends Container {
  constructor(app, assetLoader) {
    super()
    
    this.app = app
    this.assetLoader = assetLoader
    
    // Текущее HP
    this.currentHP = CONSTANTS.HEALTH.MAX
    
    // Массив текстовых спрайтов сердечек
    this.hearts = []
    
    // Параметры отображения (как в оригинале)
    this.heartSize = 28 // Размер сердечка в пикселях
    this.spacing = 6 // Расстояние между сердечками (как в оригинале: 5-8px)
    this.padding = 15 // Отступ от края экрана (как в оригинале: ~15px)
    
    // Z-Index
    this.zIndex = CONSTANTS.Z_INDEX.OVERLAY
  }

  /**
   * Инициализация HP Display
   */
  async init() {
    try {
      // Создание сердечек (используем эмодзи ❤️)
      this.createHearts()
      
      // Позиционирование (опускаем вниз, чтобы эмодзи были на той же высоте, что и число "$0")
      // Число "$0" находится по центру PayPal подложки по вертикали
      // В ScoreDisplay: контейнер в (screenWidth - padding, padding)
      // Текст в y = scaledHeight / 2 - textHeight / 2 относительно контейнера
      // Центр числа на экране: padding + scaledHeight / 2
      // 
      // Эмодзи имеют anchor (0, 0), значит их верхний край в y позиции
      // Центр эмодзи: y + heartSize / 2
      // Чтобы центр эмодзи был на той же высоте, что и центр числа:
      // padding + y + heartSize / 2 = padding + scaledHeight / 2
      // y = scaledHeight / 2 - heartSize / 2
      //
      // PayPal подложка: asset_0042.webp имеет размер 808x551, масштабируется до 140px ширины
      // Масштаб = 140 / 808 ≈ 0.173
      // Высота после масштабирования = 551 * 0.173 ≈ 95.4px
      const paypalBoxHeight = 95.4 // Реальная высота PayPal подложки после масштабирования
      
      // Центр числа "$0" на экране (относительно padding контейнера ScoreDisplay)
      // Это же значение используется в ScoreDisplay: scaledHeight / 2
      const numberCenterY = paypalBoxHeight / 2
      
      // Позиция Y для эмодзи относительно padding, чтобы их центр был на той же высоте
      const emojiY = numberCenterY - this.heartSize / 2
      
      this.position.set(this.padding, this.padding + emojiY)
      
      console.log(`✅ HP Display инициализирован (эмодзи ❤️), позиция Y: ${emojiY.toFixed(1)}px (центр на высоте ${numberCenterY.toFixed(1)}px, как "$0")`)
    } catch (error) {
      console.error('❌ Ошибка инициализации HP Display:', error)
      throw error
    }
  }

  /**
   * Создание текстовых спрайтов сердечек с эмодзи
   */
  createHearts() {
    // Очищаем существующие сердечки
    this.hearts.forEach(heart => {
      if (heart.parent) {
        heart.parent.removeChild(heart)
      }
    })
    this.hearts = []
    
    // Стиль для текста с эмодзи
    const textStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: this.heartSize,
      fill: 0xFF0000, // Красный цвет
      align: 'left'
    })
    
    // Создаем сердечки
    for (let i = 0; i < CONSTANTS.HEALTH.MAX; i++) {
      const heart = new Text('❤️', textStyle)
      
      // Позиционирование
      heart.x = i * (this.heartSize + this.spacing)
      heart.y = 0
      
      // Якорь (верхний левый угол)
      heart.anchor.set(0, 0)
      
      // Добавляем в контейнер
      this.addChild(heart)
      this.hearts.push(heart)
    }
  }

  /**
   * Обновление отображения HP
   * @param {number} hp - Текущее здоровье (0-MAX)
   */
  updateHP(hp) {
    const previousHP = this.currentHP
    this.currentHP = Math.max(0, Math.min(hp, CONSTANTS.HEALTH.MAX))
    
    // Обновляем видимость сердечек
    this.hearts.forEach((heart, index) => {
      if (index < this.currentHP) {
        // Сердечко заполнено - красное и яркое
        heart.alpha = 1.0
        heart.style.fill = 0xFF0000 // Красный цвет
      } else {
        // Сердечко пустое - серое и полупрозрачное
        heart.alpha = 0.3
        heart.style.fill = 0x666666 // Серый цвет
      }
    })
    
    // Анимация пульсации при потере HP
    if (this.currentHP < previousHP && this.currentHP > 0) {
      this.animateHPChange()
    }
  }

  /**
   * Анимация изменения HP (пульсация)
   */
  animateHPChange() {
    // Пульсация всех сердечек
    this.hearts.forEach((heart, index) => {
      if (index < this.currentHP) {
        // Анимация пульсации для активных сердечек
        const originalScale = heart.scale.x
        const pulseScale = originalScale * 1.3
        
        // Простая анимация через ticker
        let elapsed = 0
        const duration = 200 // 200ms
        
        const animate = (deltaMS) => {
          elapsed += deltaMS
          
          if (elapsed < duration) {
            const progress = elapsed / duration
            // Синусоидальная пульсация
            const scale = originalScale + (pulseScale - originalScale) * Math.sin(progress * Math.PI)
            heart.scale.set(scale)
          } else {
            heart.scale.set(originalScale)
            this.app.ticker.remove(animate)
          }
        }
        
        this.app.ticker.add(animate)
      }
    })
  }

  /**
   * Уничтожение HP Display
   */
  destroy() {
    // Удаляем все сердечки
    this.hearts.forEach(heart => {
      if (heart.parent) {
        heart.parent.removeChild(heart)
      }
      heart.destroy()
    })
    this.hearts = []
    
    super.destroy()
  }
}
