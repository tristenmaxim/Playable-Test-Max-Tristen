/**
 * Lose Screen - экран проигрыша
 * Отображает asset_0041.png при проигрыше
 */

import { Container, Sprite, Graphics } from 'pixi.js'
import { CONSTANTS } from '../core/Constants.js'

export class LoseScreen extends Container {
  constructor(app, assetLoader) {
    super()
    
    this.app = app
    this.assetLoader = assetLoader
    
    // Затемненный фон (Graphics)
    this.darkOverlay = null
    
    // Спрайт экрана проигрыша
    this.loseSprite = null
    
    // Целевой масштаб для анимации
    this.targetScale = 1
    
    // Анимация расширения
    this.animationTicker = null
    this.animationStartTime = 0
    this.animationDuration = 500 // 500ms
    
    // Анимация затемнения
    this.darkOverlayTicker = null
    this.darkOverlayStartTime = 0
    this.darkOverlayDuration = 300 // 300ms для затемнения
    
    // Z-Index (выше всех игровых элементов)
    this.zIndex = CONSTANTS.Z_INDEX.OVERLAY
    
    // Включаем сортировку по z-index для правильного порядка отрисовки
    this.sortableChildren = true
    
    // Изначально скрыт
    this.visible = false
    this.alpha = 0
  }

  /**
   * Инициализация Lose Screen
   */
  async init() {
    try {
      // Создаем затемненный фон
      this.createDarkOverlay()
      
      // Загружаем текстуру экрана проигрыша
      await this.loadTexture()
      
      // Создаем спрайт
      this.createSprite()
      
      // Позиционирование в центре экрана
      this.updatePosition()
      
      console.log('✅ Lose Screen инициализирован')
    } catch (error) {
      console.error('❌ Ошибка инициализации Lose Screen:', error)
      throw error
    }
  }

  /**
   * Создание затемненного фона (Graphics)
   */
  createDarkOverlay() {
    const screenWidth = this.app.screen.width
    const screenHeight = this.app.screen.height
    
    // Создаем Graphics элемент для затемнения
    this.darkOverlay = new Graphics()
    
    // Рисуем черный прямоугольник на весь экран
    // Используем альфа-канал для прозрачности (0.7 = 70% непрозрачности)
    this.darkOverlay.rect(0, 0, screenWidth, screenHeight)
    this.darkOverlay.fill({ color: 0x000000, alpha: 0.7 })
    
    // Позиционируем в начале координат контейнера
    this.darkOverlay.x = -screenWidth / 2
    this.darkOverlay.y = -screenHeight / 2
    
    // Z-Index: затемнение должно быть под картинкой
    this.darkOverlay.zIndex = this.zIndex - 1
    
    // Изначально невидим
    this.darkOverlay.visible = false
    this.darkOverlay.alpha = 0
    
    // Добавляем в контейнер ПЕРВЫМ, чтобы был под картинкой
    this.addChild(this.darkOverlay)
  }

  /**
   * Загрузка текстуры экрана проигрыша (asset_0041.png)
   */
  async loadTexture() {
    const texturePath = '../reference/reference_assets/data_uri_assets/asset_0041.png'
    
    try {
      this.loseTexture = await this.assetLoader.loadTexture(texturePath)
      
      if (!this.loseTexture) {
        throw new Error('Текстура экрана проигрыша не загружена (null)')
      }
      
      console.log(`✅ Текстура экрана проигрыша загружена:`, {
        width: this.loseTexture.width,
        height: this.loseTexture.height
      })
    } catch (error) {
      console.error('❌ Ошибка загрузки текстуры экрана проигрыша:', error)
      throw error
    }
  }

  /**
   * Создание спрайта экрана проигрыша
   */
  createSprite() {
    if (!this.loseTexture) {
      console.error('Текстура экрана проигрыша не загружена')
      return
    }

    // Создаем спрайт
    this.loseSprite = new Sprite(this.loseTexture)
    
    // Вычисляем масштаб для заполнения экрана без выхода за края
    // Используем Math.min, чтобы картинка полностью вписывалась в экран
    const screenWidth = this.app.screen.width
    const screenHeight = this.app.screen.height
    const scaleX = screenWidth / this.loseTexture.width
    const scaleY = screenHeight / this.loseTexture.height
    
    // Используем минимальный масштаб, чтобы картинка не выступала за края
    this.targetScale = Math.min(scaleX, scaleY)
    
    // Начальный масштаб для анимации (0 - будет увеличиваться)
    this.loseSprite.scale.set(0, 0)
    
    // Центрируем спрайт
    this.loseSprite.anchor.set(0.5, 0.5)
    this.loseSprite.x = 0
    this.loseSprite.y = 0
    
    // Z-Index
    this.loseSprite.zIndex = this.zIndex
    
    // Убеждаемся, что спрайт видим
    this.loseSprite.visible = true
    this.loseSprite.alpha = 1.0
    
    // Добавляем в контейнер
    this.addChild(this.loseSprite)
  }

  /**
   * Обновление позиции (центр экрана)
   */
  updatePosition() {
    const screenWidth = this.app.screen.width
    const screenHeight = this.app.screen.height
    
    // Позиционируем контейнер в центре экрана
    this.position.set(screenWidth / 2, screenHeight / 2)
    
    // Обновляем затемненный фон при изменении размера экрана
    if (this.darkOverlay) {
      // Очищаем предыдущий рисунок
      this.darkOverlay.clear()
      
      // Рисуем новый прямоугольник с новыми размерами
      this.darkOverlay.rect(0, 0, screenWidth, screenHeight)
      this.darkOverlay.fill({ color: 0x000000, alpha: 0.7 })
      
      // Обновляем позицию
      this.darkOverlay.x = -screenWidth / 2
      this.darkOverlay.y = -screenHeight / 2
    }
    
    // Обновляем целевой масштаб при изменении размера экрана
    if (this.loseSprite && this.loseTexture) {
      const scaleX = screenWidth / this.loseTexture.width
      const scaleY = screenHeight / this.loseTexture.height
      // Используем минимальный масштаб, чтобы картинка не выступала за края
      this.targetScale = Math.min(scaleX, scaleY)
    }
  }

  /**
   * Показ экрана проигрыша с анимацией расширения и затемнения
   * @param {Function} onComplete - Callback, вызываемый после завершения анимации расширения
   */
  show(onComplete = null) {
    this.visible = true
    this.alpha = 1.0
    this.updatePosition()
    
    // Убеждаемся, что спрайт видим
    if (!this.loseSprite) {
      console.error('❌ LoseSprite не создан')
      return
    }
    
    this.loseSprite.visible = true
    this.loseSprite.alpha = 1.0
    
    // Показываем затемненный фон
    if (this.darkOverlay) {
      this.darkOverlay.visible = true
    }
    
    // Останавливаем предыдущие анимации, если они были
    if (this.animationTicker) {
      this.app.ticker.remove(this.animationTicker)
      this.animationTicker = null
    }
    
    if (this.darkOverlayTicker) {
      this.app.ticker.remove(this.darkOverlayTicker)
      this.darkOverlayTicker = null
    }
    
    // Анимация затемнения экрана
    this.darkOverlayStartTime = Date.now()
    this.darkOverlayTicker = (ticker) => {
      const elapsed = Date.now() - this.darkOverlayStartTime
      const progress = Math.min(elapsed / this.darkOverlayDuration, 1)
      
      // Плавное появление затемнения (ease-out)
      const easedProgress = 1 - Math.pow(1 - progress, 2) // quadratic ease-out
      
      if (this.darkOverlay) {
        this.darkOverlay.alpha = easedProgress * 1.0 // От 0 до 1.0
      }
      
      if (progress >= 1) {
        // Затемнение завершено
        if (this.darkOverlay) {
          this.darkOverlay.alpha = 1.0
        }
        this.app.ticker.remove(this.darkOverlayTicker)
        this.darkOverlayTicker = null
      }
    }
    
    // Анимация расширения от центра
    // Начинаем с масштаба 0
    this.loseSprite.scale.set(0, 0)
    
    // Запускаем анимацию через PixiJS ticker
    this.animationStartTime = Date.now()
    
    this.animationTicker = (ticker) => {
      const elapsed = Date.now() - this.animationStartTime
      const progress = Math.min(elapsed / this.animationDuration, 1)
      
      // Используем easing функцию для плавной анимации (ease-out)
      const easedProgress = 1 - Math.pow(1 - progress, 3) // cubic ease-out
      
      // Масштабируем от 0 до targetScale
      const currentScale = easedProgress * this.targetScale
      this.loseSprite.scale.set(currentScale, currentScale)
      
      if (progress >= 1) {
        // Анимация завершена, устанавливаем финальный масштаб
        this.loseSprite.scale.set(this.targetScale, this.targetScale)
        // Удаляем ticker
        this.app.ticker.remove(this.animationTicker)
        this.animationTicker = null
        
        // Вызываем callback после завершения анимации расширения
        if (onComplete) {
          onComplete()
        }
      }
    }
    
    // Добавляем анимации в ticker
    this.app.ticker.add(this.darkOverlayTicker)
    this.app.ticker.add(this.animationTicker)
    
    console.log('📺 Lose Screen показан с анимацией затемнения и расширения', {
      visible: this.visible,
      alpha: this.alpha,
      targetScale: this.targetScale.toFixed(3),
      position: `(${this.position.x.toFixed(1)}, ${this.position.y.toFixed(1)})`,
      screenSize: `${this.app.screen.width}x${this.app.screen.height}`,
      textureSize: `${this.loseTexture.width}x${this.loseTexture.height}`
    })
  }

  /**
   * Скрытие экрана проигрыша
   */
  hide() {
    // Останавливаем анимации, если они активны
    if (this.animationTicker) {
      this.app.ticker.remove(this.animationTicker)
      this.animationTicker = null
    }
    
    if (this.darkOverlayTicker) {
      this.app.ticker.remove(this.darkOverlayTicker)
      this.darkOverlayTicker = null
    }
    
    // Скрываем затемненный фон
    if (this.darkOverlay) {
      this.darkOverlay.visible = false
      this.darkOverlay.alpha = 0
    }
    
    this.visible = false
    this.alpha = 0
    console.log('📺 Lose Screen скрыт')
  }
  
  /**
   * Уничтожение компонента
   */
  destroy() {
    // Останавливаем анимации
    if (this.animationTicker) {
      this.app.ticker.remove(this.animationTicker)
      this.animationTicker = null
    }
    
    if (this.darkOverlayTicker) {
      this.app.ticker.remove(this.darkOverlayTicker)
      this.darkOverlayTicker = null
    }
    
    // Уничтожаем затемненный фон
    if (this.darkOverlay) {
      this.darkOverlay.destroy()
      this.darkOverlay = null
    }
    
    // Уничтожаем спрайт
    if (this.loseSprite) {
      this.loseSprite.destroy()
      this.loseSprite = null
    }
    
    super.destroy()
  }

  /**
   * Обновление позиции при изменении размера экрана
   */
  onResize() {
    this.updatePosition()
  }
}
