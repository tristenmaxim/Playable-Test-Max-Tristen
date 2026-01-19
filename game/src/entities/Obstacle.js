/**
 * Obstacle - класс препятствия (конус)
 * Основано на анализе из ../анализ/05_enemies_obstacles.md
 * Этап 9: Препятствия появляются и движутся
 * 
 * Конус - статичный враг, движется вместе с фоном (как монетка)
 * asset_0006.webp - спокойное состояние
 * asset_0007.webp - при столкновении
 */

import { Sprite, Graphics, Container } from 'pixi.js'
import { CONSTANTS } from '../core/Constants.js'

export class Obstacle {
  constructor(app, assetLoader, x = 0, y = 0) {
    this.app = app
    this.assetLoader = assetLoader
    
    // Позиция
    this.x = x
    this.y = y
    
    // Контейнер для спрайтов (обычный и красный)
    this.container = null
    // Спрайты
    this.sprite = null // Обычный конус (спереди)
    this.redSprite = null // Красный конус (сзади, пульсирует)
    this.normalTexture = null
    this.hitTexture = null
    
    // Состояние
    this.isActive = true
    this.isHit = false // Флаг столкновения
    
    // Пульсация красного конуса
    this.pulseTime = 0 // Время для пульсации
    
    // Размеры (будут установлены после загрузки текстуры)
    this.width = 0
    this.height = 0
    
    // Z-Index
    this.zIndex = CONSTANTS.Z_INDEX.OBSTACLES
  }

  /**
   * Инициализация препятствия
   */
  async init() {
    try {
      // Загрузка текстур
      await this.loadTextures()
      
      // Создание спрайта
      this.createSprite()
      
      // Настройка позиции
      this.setupPosition()
    } catch (error) {
      console.error('Failed to initialize Obstacle:', error)
      // Fallback - создаём простой спрайт-заглушку
      this.createFallbackSprite()
    }
  }

  /**
   * Загрузка текстур препятствия
   * asset_0006.webp - спокойное состояние
   * asset_0007.webp - при столкновении
   */
  async loadTextures() {
    // Путь относительно game/index.html (один уровень вверх)
    const normalPath = '../reference/reference_assets/data_uri_assets/asset_0006.webp'
    const hitPath = '../reference/reference_assets/data_uri_assets/asset_0007.webp'
    
    console.log('Loading obstacle textures:', { normalPath, hitPath })
    
    try {
      this.normalTexture = await this.assetLoader.loadTexture(normalPath)
      this.hitTexture = await this.assetLoader.loadTexture(hitPath)
      
      console.log('✅ Текстуры препятствия загружены:', {
        normal: `${this.normalTexture.width}x${this.normalTexture.height}`,
        hit: `${this.hitTexture.width}x${this.hitTexture.height}`
      })
    } catch (error) {
      console.error('❌ Ошибка загрузки текстур препятствия:', error)
      throw error
    }
  }

  /**
   * Создание спрайта препятствия
   * Красный конус сзади, обычный спереди - красный пульсирует
   */
  createSprite() {
    if (!this.normalTexture || !this.hitTexture) {
      console.error('Obstacle textures not loaded')
      return
    }

    // Создаём контейнер для обоих спрайтов
    this.container = new Container()
    
    // Масштабирование из оригинала: Mt.BASE_SCALE = 0.8
    // Референс: this.sprite.scale.set(Mt.BASE_SCALE)
    // Уменьшаем масштаб для правильного размера препятствия
    const OBSTACLE_SCALE = 0.4 // Уменьшено с 0.8 для правильного размера
    
    // Логируем размеры ДО масштабирования
    const normalOriginalWidth = this.normalTexture.width
    const normalOriginalHeight = this.normalTexture.height
    const hitOriginalWidth = this.hitTexture.width
    const hitOriginalHeight = this.hitTexture.height
    
    // Красный конус (сзади, пульсирует)
    this.redSprite = new Sprite(this.hitTexture)
    this.redSprite.anchor.set(0.5, 1)
    this.redSprite.scale.set(OBSTACLE_SCALE, OBSTACLE_SCALE)
    this.redSprite.alpha = 0.8 // Из референса: this.glowSprite.alpha = 0.8
    this.redSprite.zIndex = this.zIndex - 1 // Сзади обычного конуса
    
    // Обычный конус (спереди)
    this.sprite = new Sprite(this.normalTexture)
    this.sprite.anchor.set(0.5, 1)
    this.sprite.scale.set(OBSTACLE_SCALE, OBSTACLE_SCALE)
    this.sprite.zIndex = this.zIndex
    
    // Добавляем спрайты в контейнер (красный сзади, обычный спереди)
    this.container.addChild(this.redSprite)
    this.container.addChild(this.sprite)
    
    // Z-Index для контейнера
    this.container.zIndex = this.zIndex
    
    // Сохраняем размеры для коллизий (после масштабирования)
    this.width = this.sprite.width
    this.height = this.sprite.height
    
    console.log(`✅ Спрайт препятствия создан (с пульсацией):`, {
      normalOriginalSize: `${normalOriginalWidth}x${normalOriginalHeight}`,
      hitOriginalSize: `${hitOriginalWidth}x${hitOriginalHeight}`,
      finalSize: `${this.width.toFixed(1)}x${this.height.toFixed(1)}`,
      scale: OBSTACLE_SCALE,
      expectedSize: `${(normalOriginalWidth * OBSTACLE_SCALE).toFixed(1)}x${(normalOriginalHeight * OBSTACLE_SCALE).toFixed(1)}`
    })
  }

  /**
   * Настройка позиции препятствия
   */
  setupPosition() {
    if (!this.container) {
      return
    }

    // Позиция контейнера по X и Y
    this.container.x = this.x
    this.container.y = this.y
    
    console.log(`Obstacle positioned at:`, { x: this.container.x, y: this.container.y })
  }

  /**
   * Создание fallback спрайта при ошибке загрузки
   */
  createFallbackSprite() {
    this.container = new Container()
    
    const width = 40
    const height = 60
    
    // Красный конус (сзади)
    const redGraphics = new Graphics()
    redGraphics.poly([
      -width / 2, 0,
      width / 2, 0,
      0, -height
    ])
    redGraphics.fill(0xFF0000) // Красный цвет
    redGraphics.zIndex = this.zIndex - 1
    
    // Оранжевый конус (спереди)
    const normalGraphics = new Graphics()
    normalGraphics.poly([
      -width / 2, 0,
      width / 2, 0,
      0, -height
    ])
    normalGraphics.fill(0xFFA500) // Оранжевый цвет
    normalGraphics.zIndex = this.zIndex
    
    this.container.addChild(redGraphics)
    this.container.addChild(normalGraphics)
    this.container.zIndex = this.zIndex
    
    this.sprite = normalGraphics
    this.redSprite = redGraphics
    this.width = width
    this.height = height
    this.setupPosition()
    
    console.warn('Используется fallback спрайт препятствия')
  }

  /**
   * Обновление препятствия
   * Препятствия движутся влево синхронно с фоном (как коллектблы)
   * Красный конус пульсирует (изменяется alpha)
   * @param {number} deltaMS - Время с последнего кадра в миллисекундах
   * @param {number} backgroundSpeed - Скорость фона (пикселей/сек)
   */
  update(deltaMS, backgroundSpeed = 0) {
    if (!this.container || !this.isActive) return
    
    // Движение влево синхронно с фоном
    const deltaSeconds = deltaMS / 1000
    const deltaX = backgroundSpeed * deltaSeconds
    this.x -= deltaX
    this.container.x = this.x
    
    // Пульсация красного конуса (мягкое мерцание)
    if (this.redSprite) {
      this.pulseTime += deltaMS
      // Синусоидальная пульсация: alpha от 0.3 до 0.7
      // Период: 1000ms (1 секунда)
      const pulsePeriod = 1000 // мс
      const pulseAlpha = 0.3 + 0.4 * (Math.sin(this.pulseTime / pulsePeriod * Math.PI * 2) * 0.5 + 0.5)
      this.redSprite.alpha = pulseAlpha
    }
  }

  /**
   * Остановка препятствия (пауза анимации и движения)
   * Используется при проигрыше
   */
  stop() {
    if (!this.container) return
    
    // Помечаем как остановленного
    this.isActive = false
    
    // Останавливаем пульсацию красного конуса
    if (this.redSprite) {
      this.redSprite.alpha = 0.5 // Фиксированная прозрачность
    }
    
    console.log('⏸️ Препятствие остановлено')
  }

  /**
   * Получение хитбокса для коллизий
   * @returns {Object} Прямоугольник хитбокса
   */
  getHitbox() {
    if (!this.container || !this.isActive) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }

    // Anchor (0.5, 1) означает, что низ спрайта в точке (x, y)
    return {
      x: this.container.x - this.width / 2,
      y: this.container.y - this.height,
      width: this.width,
      height: this.height
    }
  }

  /**
   * Обработка столкновения
   * Переключает текстуру на "hit" состояние
   */
  hit() {
    if (this.isHit || !this.sprite || !this.hitTexture) return
    
    this.isHit = true
    this.sprite.texture = this.hitTexture
    
    console.log('Obstacle hit!')
  }

  /**
   * Уничтожение препятствия
   */
  destroy() {
    this.isActive = false
    if (this.container) {
      this.container.destroy({ children: true })
      this.container = null
    }
    this.sprite = null
    this.redSprite = null
  }
}
