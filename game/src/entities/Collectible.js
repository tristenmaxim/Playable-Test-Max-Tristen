/**
 * Collectible - класс собираемых предметов (монетки, PayPal карты)
 * Основано на анализе из ../анализ/06_collectibles.md
 * Этап 6: Статичные монетки (без движения и сбора)
 */

import { Sprite, Graphics } from 'pixi.js'
import { CONSTANTS } from '../core/Constants.js'

export class Collectible {
  constructor(app, assetLoader, type = 'dollar', x = 0, y = 0) {
    this.app = app
    this.assetLoader = assetLoader
    
    // Тип коллекции: 'dollar' или 'paypalCard' (как в референсе)
    this.type = type
    
    // Позиция
    this.x = x
    this.y = y
    
    // Спрайт
    this.sprite = null
    
    // Состояние
    this.isActive = true
    this.isCollected = false
    
    // Значение (для будущих этапов)
    this.value = type === 'paypalCard' 
      ? CONSTANTS.SCORE.PAYPAL_CARD_MIN + Math.random() * (CONSTANTS.SCORE.PAYPAL_CARD_MAX - CONSTANTS.SCORE.PAYPAL_CARD_MIN)
      : CONSTANTS.SCORE.DOLLAR_VALUE
    
    // Размеры (будут установлены после загрузки текстуры)
    this.width = 0
    this.height = 0
    
    // Z-Index
    this.zIndex = CONSTANTS.Z_INDEX.COLLECTIBLES
  }

  /**
   * Инициализация коллекции
   */
  async init() {
    try {
      // Загрузка текстуры
      await this.loadTexture()
      
      // Создание спрайта
      this.createSprite()
      
      // Настройка позиции
      this.setupPosition()
    } catch (error) {
      console.error('Failed to initialize Collectible:', error)
      // Fallback - создаём простой спрайт-заглушку
      this.createFallbackSprite()
    }
  }

  /**
   * Загрузка текстуры коллекции
   */
  async loadTexture() {
    // Правильные ассеты из референса:
    // asset_0008.png - деньги (dollar)
    // asset_0009.webp - PayPal (paypalCard)
    let texturePath
    
    if (this.type === 'paypalCard') {
      // PayPal карта
      texturePath = '../reference/reference_assets/data_uri_assets/asset_0009.webp'
    } else {
      // Доллар
      texturePath = '../reference/reference_assets/data_uri_assets/asset_0008.png'
    }
    
    console.log(`Loading collectible texture (${this.type}):`, texturePath)
    
    try {
      this.texture = await this.assetLoader.loadTexture(texturePath)
      console.log(`✅ Текстура коллекции (${this.type}) загружена:`, this.texture.width, 'x', this.texture.height)
    } catch (error) {
      console.warn(`⚠️ Не удалось загрузить текстуру ${texturePath}, используем fallback`)
      throw error
    }
  }

  /**
   * Создание спрайта коллекции
   */
  createSprite() {
    if (!this.texture) {
      console.error('Collectible texture not loaded')
      return
    }

    this.sprite = new Sprite(this.texture)
    
    // Anchor: центр (0.5, 0.5) для вращения вокруг центра
    this.sprite.anchor.set(0.5, 0.5)
    
    // Масштабирование для правильного размера
    // Референс: Te.COLLECTIBLE_RADIUS = 60px - это радиус для хитбокса (диаметр = 120px)
    // Но визуальный размер должен быть меньше - примерно 40-45px в диаметре
    // (как было изначально, до увеличения)
    const targetSize = 42  // Визуальный размер коллектбла (диаметр) - изначальный размер
    const currentSize = Math.max(this.sprite.width, this.sprite.height)
    const scale = targetSize / currentSize
    this.sprite.scale.set(scale, scale)
    
    // Сохраняем размеры для коллизий
    this.width = this.sprite.width
    this.height = this.sprite.height
    
    // Z-Index для правильного порядка отрисовки
    this.sprite.zIndex = this.zIndex
    
    console.log(`✅ Спрайт коллекции (${this.type}) создан:`, {
      width: this.sprite.width,
      height: this.sprite.height,
      scale
    })
  }

  /**
   * Настройка позиции коллекции
   */
  setupPosition() {
    if (!this.sprite) {
      return
    }

    // Позиция по X и Y
    this.sprite.x = this.x
    this.sprite.y = this.y
    
    console.log(`Collectible (${this.type}) positioned at:`, { x: this.sprite.x, y: this.sprite.y })
  }

  /**
   * Создание fallback спрайта при ошибке загрузки
   */
  createFallbackSprite() {
    const graphics = new Graphics()
    const radius = 20
    
    // Рисуем круг (монетку)
    graphics.circle(0, 0, radius)
    
    // Цвет в зависимости от типа
    if (this.type === 'paypalCard') {
      graphics.fill(0x0070BA) // PayPal синий
    } else {
      graphics.fill(0xFFD700) // Золотой для доллара
    }
    
    graphics.zIndex = this.zIndex
    
    this.sprite = graphics
    this.width = radius * 2
    this.height = radius * 2
    this.setupPosition()
    
    console.warn(`Используется fallback спрайт коллекции (${this.type})`)
  }

  /**
   * Обновление коллекции
   * Коллекции двигаются синхронно с фоном (та же скорость)
   * @param {number} deltaMS - Время с последнего кадра в миллисекундах
   * @param {number} backgroundSpeed - Скорость фона (пикселей/сек), должна быть такой же как у ParallaxBackground
   */
  update(deltaMS, backgroundSpeed = 0) {
    if (!this.sprite || !this.isActive || this.isCollected) return
    
    // Движение влево синхронно с фоном
    // Используем ту же формулу, что и фон: speed * deltaMS / 1000
    const deltaSeconds = deltaMS / 1000
    const deltaX = backgroundSpeed * deltaSeconds
    this.x -= deltaX
    this.sprite.x = this.x
    
    // Анимация вращения
    this.sprite.rotation += 0.05 * deltaSeconds
  }

  /**
   * Получение хитбокса для коллизий
   * @returns {Object} Прямоугольник хитбокса
   */
  getHitbox() {
    if (!this.sprite || !this.isActive) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }

    // Anchor (0.5, 0.5) означает, что центр спрайта в точке (x, y)
    return {
      x: this.sprite.x - this.width / 2,
      y: this.sprite.y - this.height / 2,
      width: this.width,
      height: this.height
    }
  }

  /**
   * Обработка сбора коллекции
   */
  collect() {
    if (this.isCollected) return

    this.isCollected = true
    this.isActive = false

    // Анимация исчезновения (для будущих этапов можно добавить GSAP)
    if (this.sprite) {
      // Простое исчезновение
      this.sprite.alpha = 0
      // В будущем можно добавить анимацию масштаба и движения к счёту
    }

    console.log(`Collectible (${this.type}) collected!`)
  }

  /**
   * Уничтожение коллекции
   */
  destroy() {
    this.isActive = false
    if (this.sprite) {
      this.sprite.destroy()
      this.sprite = null
    }
  }
}
