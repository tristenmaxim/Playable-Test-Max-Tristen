/**
 * Footer - футер внизу экрана
 * Использует asset_0039.webp (портретная) и asset_0040.webp (альбомная)
 */

import { Container, Sprite } from 'pixi.js'
import { CONSTANTS } from '../core/Constants.js'

export class Footer extends Container {
  constructor(app, assetLoader) {
    super()
    
    this.app = app
    this.assetLoader = assetLoader
    
    // Спрайты для разных ориентаций
    this.portraitSprite = null // asset_0039.webp
    this.landscapeSprite = null // asset_0040.webp
    
    // Текущий активный спрайт
    this.currentSprite = null
    
    // Z-Index
    this.zIndex = CONSTANTS.Z_INDEX.FOOTER
  }

  /**
   * Инициализация Footer
   */
  async init() {
    try {
      // Загружаем оба изображения
      await this.loadTextures()
      
      // Создаем спрайты
      this.createSprites()
      
      // Определяем начальную ориентацию и показываем нужный спрайт
      this.updateOrientation()
      
      // Позиционируем внизу экрана
      this.updatePosition()
      
      // Слушаем изменения размера экрана для обновления ориентации
      window.addEventListener('resize', () => {
        this.updateOrientation()
        this.updatePosition()
      })
      
      console.log('✅ Footer инициализирован')
    } catch (error) {
      console.error('❌ Ошибка инициализации Footer:', error)
      throw error
    }
  }

  /**
   * Загрузка текстур для портретной и альбомной ориентаций
   * asset_0040.webp (46.53 KB, 1080x201) - для портретной ориентации
   * asset_0039.webp (76.45 KB, 2022x201) - для альбомной ориентации
   */
  async loadTextures() {
    // Правильное назначение: asset_0040 для портретной, asset_0039 для альбомной
    const portraitPath = '../reference/reference_assets/data_uri_assets/asset_0040.webp'
    const landscapePath = '../reference/reference_assets/data_uri_assets/asset_0039.webp'
    
    try {
      const portraitTexture = await this.assetLoader.loadTexture(portraitPath)
      const landscapeTexture = await this.assetLoader.loadTexture(landscapePath)
      
      console.log('✅ Footer текстуры загружены:', {
        portrait: `${portraitTexture.width}x${portraitTexture.height}`,
        landscape: `${landscapeTexture.width}x${landscapeTexture.height}`
      })
      
      this.portraitTexture = portraitTexture
      this.landscapeTexture = landscapeTexture
    } catch (error) {
      console.error('❌ Ошибка загрузки текстур Footer:', error)
      throw error
    }
  }

  /**
   * Создание спрайтов для обеих ориентаций
   */
  createSprites() {
    // Спрайт для портретной ориентации
    this.portraitSprite = new Sprite(this.portraitTexture)
    this.portraitSprite.anchor.set(0.5, 1) // Центр по X, низ по Y
    this.portraitSprite.visible = false
    this.addChild(this.portraitSprite)
    
    // Спрайт для альбомной ориентации
    this.landscapeSprite = new Sprite(this.landscapeTexture)
    this.landscapeSprite.anchor.set(0.5, 1) // Центр по X, низ по Y
    this.landscapeSprite.visible = false
    this.addChild(this.landscapeSprite)
  }

  /**
   * Определение ориентации экрана и переключение спрайта
   * Футер должен занимать примерно 17% высоты экрана в обеих ориентациях (как в оригинале)
   */
  updateOrientation() {
    const screenWidth = this.app.screen.width
    const screenHeight = this.app.screen.height
    const isLandscape = screenWidth > screenHeight
    
    // Скрываем оба спрайта сначала
    if (this.portraitSprite) {
      this.portraitSprite.visible = false
    }
    if (this.landscapeSprite) {
      this.landscapeSprite.visible = false
    }
    
    // Выбираем нужный спрайт
    this.currentSprite = isLandscape ? this.landscapeSprite : this.portraitSprite
    
    // Показываем выбранный спрайт
    if (this.currentSprite) {
      this.currentSprite.visible = true
      
      // Вычисляем масштаб по ширине (чтобы футер занимал всю ширину экрана)
      // Это гарантирует, что футер полностью влезает и не обрезается снизу
      const scaleByWidth = screenWidth / this.currentSprite.texture.width
      
      // Используем масштаб по ширине для обеих ориентаций
      // Это гарантирует, что футер полностью помещается на экране
      const scale = scaleByWidth
      
      this.currentSprite.scale.set(scale)
      
      // Вычисляем фактическую высоту и ширину футера после масштабирования
      const scaledHeight = this.currentSprite.texture.height * scale
      const scaledWidth = this.currentSprite.texture.width * scale
      const heightPercent = (scaledHeight / screenHeight) * 100
      
      console.log(`🔍 Footer: экран ${screenWidth}x${screenHeight}, текстура ${this.currentSprite.texture.width}x${this.currentSprite.texture.height}`)
      console.log(`📱 Footer: ${isLandscape ? 'альбомная' : 'портретная'} ориентация, масштаб: ${scale.toFixed(3)}, высота: ${scaledHeight.toFixed(0)}px (${heightPercent.toFixed(1)}% экрана), ширина: ${scaledWidth.toFixed(0)}px`)
    }
  }

  /**
   * Обновление позиции футера (внизу экрана)
   */
  updatePosition() {
    const screenWidth = this.app.screen.width
    const screenHeight = this.app.screen.height
    
    // Позиционируем контейнер внизу экрана
    // X: центр экрана (спрайты имеют anchor 0.5 по X)
    // Y: низ экрана (спрайты имеют anchor 1 по Y)
    this.position.set(screenWidth / 2, screenHeight)
    
    // Устанавливаем маску для контейнера, чтобы футер не выходил за границы экрана
    if (this.currentSprite) {
      const scaledHeight = this.currentSprite.texture.height * this.currentSprite.scale.y
      // Убеждаемся, что футер не выходит за нижнюю границу экрана
      // Если высота больше экрана, обрезаем сверху
      if (scaledHeight > screenHeight) {
        console.warn(`⚠️ Footer высота (${scaledHeight.toFixed(0)}px) больше высоты экрана (${screenHeight}px)`)
      }
    }
  }

  /**
   * Обновление при изменении размера экрана
   */
  onResize() {
    this.updateOrientation()
    this.updatePosition()
  }

  /**
   * Уничтожение Footer
   */
  destroy() {
    if (this.portraitSprite) {
      if (this.portraitSprite.parent) {
        this.portraitSprite.parent.removeChild(this.portraitSprite)
      }
      this.portraitSprite.destroy()
      this.portraitSprite = null
    }
    
    if (this.landscapeSprite) {
      if (this.landscapeSprite.parent) {
        this.landscapeSprite.parent.removeChild(this.landscapeSprite)
      }
      this.landscapeSprite.destroy()
      this.landscapeSprite = null
    }
    
    super.destroy()
  }
}
