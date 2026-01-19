/**
 * Footer - футер внизу экрана
 * Использует asset_0039.webp (портретная) и asset_0040.webp (альбомная)
 */

import { Container, Sprite, Graphics, Text, TextStyle, Rectangle } from 'pixi.js'
import { CONSTANTS } from '../core/Constants.js'

export class Footer extends Container {
  constructor(app, assetLoader) {
    super()
    
    this.app = app
    this.assetLoader = assetLoader
    
    // Включаем сортировку по z-index для правильного порядка отрисовки
    this.sortableChildren = true
    
    // Спрайты для разных ориентаций
    this.portraitSprite = null // asset_0039.webp
    this.landscapeSprite = null // asset_0040.webp
    
    // Текущий активный спрайт
    this.currentSprite = null
    
    // Кнопка Download
    this.downloadButton = null
    
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
      
      // Создаем кнопку Download
      this.createDownloadButton()
      
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
    this.portraitSprite.zIndex = 0 // Ниже кнопки
    this.addChild(this.portraitSprite)
    
    // Спрайт для альбомной ориентации
    this.landscapeSprite = new Sprite(this.landscapeTexture)
    this.landscapeSprite.anchor.set(0.5, 1) // Центр по X, низ по Y
    this.landscapeSprite.visible = false
    this.landscapeSprite.zIndex = 0 // Ниже кнопки
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
   * Создание кнопки Download (footer-cta)
   */
  createDownloadButton() {
    // Создаем контейнер для кнопки
    const buttonContainer = new Container()
    buttonContainer.eventMode = 'static' // Вместо interactive = true в PixiJS v8
    buttonContainer.cursor = 'pointer'
    
    // Устанавливаем pivot в центр для масштабирования из центра
    // Pivot будет установлен после вычисления размеров кнопки
    
    // Параметры кнопки (как в оригинале)
    const fontSize = Math.max(10, Math.min(16, this.app.screen.width * 0.025)) // clamp(10px, 2.5vw, 16px)
    const paddingX = this.app.screen.width * 0.03 // 3vw
    const paddingY = this.app.screen.height * 0.015 // 1.5vh
    const borderWidth = 3
    
    // Создаем текст (используем GameFont, как везде в игре)
    // Добавляем черную обводку, как в оригинале
    const textStyle = new TextStyle({
      fontFamily: 'GameFont, sans-serif',
      fontSize: fontSize,
      fill: 0xFFFFFF, // Белый цвет текста
      stroke: 0x000000, // Черная обводка
      strokeThickness: 2, // Толщина обводки (2px)
      fontWeight: 'bold',
      letterSpacing: 0.5,
      align: 'center'
    })
    
    const buttonText = new Text('DOWNLOAD', textStyle)
    buttonText.anchor.set(0.5, 0.5)
    
    // Вычисляем размеры кнопки
    const textWidth = buttonText.width
    const textHeight = buttonText.height
    const buttonWidth = textWidth + paddingX * 2
    const buttonHeight = textHeight + paddingY * 2
    
    // Вычисляем радиус скругления (более скругленные углы, как в оригинале)
    // Радиус примерно 20-25% от высоты кнопки для более выраженного скругления
    const borderRadius = Math.max(8, buttonHeight * 0.22)
    
    // ВАЖНО: Элементы внутри контейнера позиционируются относительно центра (0, 0)
    // Поэтому pivot должен быть установлен в (0, 0), а не в (width/2, height/2)
    // Это обеспечит, что масштабирование происходит из центра контейнера
    buttonContainer.pivot.set(0, 0)
    
    // Создаем фон кнопки с градиентом (имитация градиента через несколько слоев)
    const buttonBg = new Graphics()
    
    // Рисуем фон относительно центра (так как pivot установлен)
    const halfWidth = buttonWidth / 2
    const halfHeight = buttonHeight / 2
    
    // Градиент: #ffe44d -> #ffb830 -> #ff9500
    // Рисуем градиент через обычные прямоугольники (без скругления)
    // Затем применим маску со скругленными углами для идеального совпадения с границей
    const gradientSteps = 30 // Увеличиваем количество слоев для более плавного градиента
    
    // Рисуем градиент как обычные прямоугольники
    for (let i = 0; i < gradientSteps; i++) {
      const ratio = i / gradientSteps
      let color
      if (ratio < 0.5) {
        // От #ffe44d к #ffb830
        const r = ratio * 2
        color = this.interpolateColor(0xFFE44D, 0xFFB830, r)
      } else {
        // От #ffb830 к #ff9500
        const r = (ratio - 0.5) * 2
        color = this.interpolateColor(0xFFB830, 0xFF9500, r)
      }
      
      const y = -halfHeight + (buttonHeight / gradientSteps) * i
      const h = buttonHeight / gradientSteps
      // Рисуем обычные прямоугольники для градиента
      buttonBg.rect(-halfWidth, y, buttonWidth, h).fill(color)
    }
    
    // Создаем маску со скругленными углами для градиента
    // Это обеспечит идеальное совпадение краев градиента с границей
    const gradientMask = new Graphics()
    gradientMask.roundRect(-halfWidth, -halfHeight, buttonWidth, buttonHeight, borderRadius).fill(0xFFFFFF)
    // Маска должна быть добавлена в контейнер и быть видимой для работы маскирования
    buttonBg.mask = gradientMask
    
    // Создаем отдельный Graphics для границ (чтобы они были поверх маски)
    const buttonBorder = new Graphics()
    
    // Добавляем внутреннюю светлую границу (как в оригинале)
    buttonBorder.roundRect(-halfWidth, -halfHeight, buttonWidth, buttonHeight, borderRadius)
      .stroke({ width: 1, color: 0xF0F0F0 })
    
    // Добавляем внешнюю темную границу поверх всего
    buttonBorder.roundRect(-halfWidth, -halfHeight, buttonWidth, buttonHeight, borderRadius)
      .stroke({ width: borderWidth, color: 0xE07800 })
    
    // Позиционируем элементы (относительно центра кнопки, так как pivot установлен)
    buttonText.x = 0 // Центр, так как pivot уже установлен
    buttonText.y = 0 // Центр, так как pivot уже установлен
    
    // Устанавливаем hitArea для интерактивности (весь размер кнопки, относительно центра)
    // Используем Rectangle из PixiJS, который имеет метод contains
    buttonContainer.hitArea = new Rectangle(-halfWidth, -halfHeight, buttonWidth, buttonHeight)
    
    // Убеждаемся, что все элементы видимы
    buttonBg.visible = true
    buttonBg.alpha = 1.0
    buttonBorder.visible = true
    buttonBorder.alpha = 1.0
    buttonText.visible = true
    buttonText.alpha = 1.0
    
    // Маска должна быть добавлена в контейнер для работы маскирования
    // Но она не должна быть видна (будет скрыта за границами)
    gradientMask.visible = true // Видима для работы маскирования
    gradientMask.alpha = 1.0
    
    // Добавляем элементы в контейнер в правильном порядке:
    // 1. Маска (для маскирования градиента)
    // 2. Градиентный фон (с маской)
    // 3. Границы (поверх всего, скрывают маску)
    // 4. Текст (поверх всего)
    buttonContainer.addChild(gradientMask)
    buttonContainer.addChild(buttonBg)
    buttonContainer.addChild(buttonBorder)
    buttonContainer.addChild(buttonText)
    
    console.log(`✅ Download button создана: размер ${buttonWidth.toFixed(1)}x${buttonHeight.toFixed(1)}, радиус скругления ${borderRadius.toFixed(1)}, градиентных слоев: ${gradientSteps}`)
    
    // Обработчик клика
    buttonContainer.on('pointerdown', () => {
      this.handleDownloadClick()
    })
    
    // Анимация пульсации (как в оригинале)
    // Кнопка должна масштабироваться из центра, центр должен оставаться на месте
    let pulseScale = 1.0 // Начинаем с нормального размера
    let pulseDirection = 1
    const pulseSpeed = 0.002
    const minScale = 0.9
    const maxScale = 1.1
    
    const pulseAnimation = () => {
      pulseScale += pulseSpeed * pulseDirection
      if (pulseScale >= maxScale) {
        pulseScale = maxScale
        pulseDirection = -1
      } else if (pulseScale <= minScale) {
        pulseScale = minScale
        pulseDirection = 1
      }
      
      // Масштабируем кнопку из центра
      // Pivot уже установлен в центр, поэтому масштабирование происходит из центра
      // Позиция кнопки не меняется, поэтому центр остается на месте
      buttonContainer.scale.set(pulseScale, pulseScale)
    }
    
    this.app.ticker.add(pulseAnimation)
    
    // Сохраняем ссылку на анимацию для очистки при уничтожении
    this.pulseAnimation = pulseAnimation
    
    // Убеждаемся, что кнопка видима и выше других элементов
    buttonContainer.visible = true
    buttonContainer.alpha = 1.0
    buttonContainer.zIndex = 10 // Выше спрайтов футера (у них zIndex = 0)
    
    this.downloadButton = buttonContainer
    
    // Добавляем кнопку ПОСЛЕ спрайтов футера, чтобы она была поверх них
    this.addChild(buttonContainer)
    
    console.log(`✅ Download button создана: размер ${buttonWidth.toFixed(1)}x${buttonHeight.toFixed(1)}, шрифт ${fontSize.toFixed(1)}px, zIndex: ${buttonContainer.zIndex}`)
  }
  
  /**
   * Интерполяция цвета между двумя значениями
   */
  interpolateColor(color1, color2, ratio) {
    const r1 = (color1 >> 16) & 0xFF
    const g1 = (color1 >> 8) & 0xFF
    const b1 = color1 & 0xFF
    
    const r2 = (color2 >> 16) & 0xFF
    const g2 = (color2 >> 8) & 0xFF
    const b2 = color2 & 0xFF
    
    const r = Math.round(r1 + (r2 - r1) * ratio)
    const g = Math.round(g1 + (g2 - g1) * ratio)
    const b = Math.round(b1 + (b2 - b1) * ratio)
    
    return (r << 16) | (g << 8) | b
  }
  
  /**
   * Обработка клика на кнопку Download
   */
  handleDownloadClick() {
    console.log('🔘 Download button clicked')
    
    // Отправляем сообщение родительскому окну (как в оригинале)
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'CTA_CLICK', url: '' }, '*')
    }
    
    // Также пробуем использовать различные API (как в оригинале)
    if (window.playboxCTA) {
      window.playboxCTA('')
    } else if (window.openAppStore) {
      window.openAppStore()
    } else if (window.FbPlayableAd && window.FbPlayableAd.onCTAClick) {
      window.FbPlayableAd.onCTAClick()
    } else if (window.ExitApi && window.ExitApi.exit) {
      window.ExitApi.exit()
    } else if (window.TikTokApi && window.TikTokApi.openAppStore) {
      window.TikTokApi.openAppStore()
    } else {
      // Fallback: просто логируем
      console.log('⚠️ No CTA API available, using postMessage')
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
    
    // Позиционируем кнопку Download справа (как в оригинале)
    if (this.downloadButton) {
      const scaledHeight = this.currentSprite ? this.currentSprite.texture.height * this.currentSprite.scale.y : 0
      
      // Используем тот же отступ, что и у PayPal счетчика сверху справа (15px)
      const buttonPadding = 15 // Такой же отступ, как у ScoreDisplay
      
      // Позиция кнопки: справа, ниже центра футера по вертикали
      // Контейнер Footer находится в (screenWidth/2, screenHeight)
      // ScoreDisplay находится в (screenWidth - padding, padding) = (screenWidth - 15, 15)
      // Кнопка должна быть на правом краю экрана с отступом 15px (как ScoreDisplay)
      // 
      // Важно: pivot кнопки установлен в (0, 0), что соответствует центру элементов внутри контейнера
      // Позиция контейнера определяет, где находится центр элементов внутри него
      // 
      // Позиция X: на уровне PayPal картинки (ScoreDisplay) с таким же отступом справа
      // ScoreDisplay находится в абсолютной позиции (screenWidth - padding, padding)
      // Относительно Footer контейнера (который в screenWidth/2, screenHeight):
      // X относительно Footer = (screenWidth - padding) - screenWidth/2 = screenWidth/2 - padding
      // Но так как кнопка имеет pivot в центре, а ScoreDisplay тоже центрирован по своей ширине,
      // нужно учесть, что правый край кнопки должен быть на том же месте, что и правый край ScoreDisplay
      // Позиция центра кнопки = правый край экрана - отступ - половина ширины кнопки
      // Относительно Footer: buttonX = screenWidth/2 - buttonPadding - this.downloadButton.width/2
      // Но проще: правый край кнопки должен быть на screenWidth - buttonPadding
      // Центр кнопки = screenWidth - buttonPadding - this.downloadButton.width/2
      // Относительно Footer: buttonX = (screenWidth - buttonPadding - this.downloadButton.width/2) - screenWidth/2
      // = screenWidth/2 - buttonPadding - this.downloadButton.width/2
      const buttonX = screenWidth / 2 - buttonPadding - (this.downloadButton.width / 2)
      // Позиция Y: ниже центра футера (положительное значение = ниже)
      const buttonY = -scaledHeight / 2 + scaledHeight * 0.15
      
      // Убеждаемся, что pivot остается в (0, 0) для правильного масштабирования из центра
      // Все элементы внутри контейнера позиционируются относительно центра (0, 0)
      this.downloadButton.pivot.set(0, 0)
      
      // Устанавливаем позицию кнопки
      // В PixiJS, когда pivot установлен в (0, 0), позиция (x, y) определяет, где находится точка (0, 0)
      // Так как элементы внутри позиционируются относительно (0, 0) как центр, позиция определяет центр кнопки
      this.downloadButton.x = buttonX
      this.downloadButton.y = buttonY
      
      // Убеждаемся, что кнопка видима
      this.downloadButton.visible = true
      this.downloadButton.alpha = 1.0
      
      // Вычисляем абсолютную позицию для отладки
      const absoluteX = screenWidth / 2 + buttonX
      const absoluteY = screenHeight + buttonY
      const buttonRightEdge = absoluteX + (this.downloadButton.width / 2) // Правый край кнопки
      const scoreDisplayRightEdge = screenWidth - buttonPadding // Правый край ScoreDisplay
      
      console.log(`📍 Download button позиция: относительная (${buttonX.toFixed(1)}, ${buttonY.toFixed(1)}), абсолютная (${absoluteX.toFixed(1)}, ${absoluteY.toFixed(1)}), размер: ${this.downloadButton.width.toFixed(1)}x${this.downloadButton.height.toFixed(1)}`)
      console.log(`📍 Download button правый край: ${buttonRightEdge.toFixed(1)}, ScoreDisplay правый край: ${scoreDisplayRightEdge.toFixed(1)}, экран: ${screenWidth}x${screenHeight}`)
    }
    
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
    
    // Пересоздаем кнопку с новыми размерами
    if (this.downloadButton) {
      // Удаляем анимацию перед уничтожением
      if (this.pulseAnimation) {
        this.app.ticker.remove(this.pulseAnimation)
        this.pulseAnimation = null
      }
      
      if (this.downloadButton.parent) {
        this.removeChild(this.downloadButton)
      }
      this.downloadButton.destroy()
      this.downloadButton = null
    }
    this.createDownloadButton()
    
    this.updatePosition()
  }

  /**
   * Уничтожение Footer
   */
  destroy() {
    // Удаляем анимацию пульсации
    if (this.pulseAnimation) {
      this.app.ticker.remove(this.pulseAnimation)
      this.pulseAnimation = null
    }
    
    if (this.downloadButton) {
      if (this.downloadButton.parent) {
        this.downloadButton.parent.removeChild(this.downloadButton)
      }
      this.downloadButton.destroy()
      this.downloadButton = null
    }
    
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
