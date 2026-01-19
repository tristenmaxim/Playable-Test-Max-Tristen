/**
 * Win End Screen - финальный экран победы
 * Показывается после достижения финиша
 * Содержит:
 * 1. Текст "Congratulations!\nChoose your reward!"
 * 2. asset_0009.webp (PayPal карточка)
 * 3. Количество заработанных денег (в правом нижнем углу карточки)
 * 4. Кнопка "INSTALL AND EARN!" (цвета Download - желто-оранжевый градиент)
 * 5. asset_0044.png (крутится на фоне)
 */

import { Container, Text, TextStyle, Sprite, Graphics, Rectangle } from 'pixi.js'
import { CONSTANTS } from '../core/Constants.js'

export class WinEndScreen extends Container {
  constructor(app, assetLoader) {
    super()
    
    this.app = app
    this.assetLoader = assetLoader
    
    // Текстовые элементы
    this.titleText = null // "Congratulations!"
    this.subtitleText = null // "Choose your reward!"
    
    // PayPal карточка (asset_0009.webp)
    this.paypalCardSprite = null
    this.paypalCardTexture = null
    
    // Текст суммы денег в правом нижнем углу карточки
    this.moneyAmountText = null
    
    // Кнопка "INSTALL AND EARN"
    this.installButton = null
    
    // Вращающийся фон (asset_0044.png)
    this.rotatingBackgroundSprite = null
    this.rotatingBackgroundTexture = null
    this.rotationTicker = null
    
    // Z-Index (выше всех игровых элементов)
    this.zIndex = CONSTANTS.Z_INDEX.OVERLAY
    
    // Включаем сортировку по z-index для правильного порядка отрисовки
    this.sortableChildren = true
    
    // Изначально скрыт
    this.visible = false
    this.alpha = 0
  }

  /**
   * Инициализация Win End Screen
   */
  async init() {
    try {
      // Загружаем текстуру PayPal карточки
      await this.loadPayPalCardTexture()
      
      // Создаем текстовые элементы
      this.createText()
      
      // Создаем спрайт PayPal карточки
      this.createPayPalCard()
      
      // Создаем текст суммы денег
      this.createMoneyAmountText()
      
      // Загружаем текстуру вращающегося фона
      await this.loadRotatingBackgroundTexture()
      
      // Создаем вращающийся фон
      this.createRotatingBackground()
      
      // Создаем кнопку "INSTALL AND EARN"
      this.createInstallButton()
      
      // Позиционирование
      this.updatePosition()
      
      console.log('✅ Win End Screen инициализирован')
    } catch (error) {
      console.error('❌ Ошибка инициализации Win End Screen:', error)
      throw error
    }
  }

  /**
   * Загрузка текстуры вращающегося фона (asset_0044.png)
   */
  async loadRotatingBackgroundTexture() {
    const texturePath = '../reference/reference_assets/data_uri_assets/asset_0044.png'
    
    try {
      this.rotatingBackgroundTexture = await this.assetLoader.loadTexture(texturePath)
      
      if (!this.rotatingBackgroundTexture) {
        throw new Error('Текстура вращающегося фона не загружена (null)')
      }
      
      console.log(`✅ Текстура вращающегося фона загружена:`, {
        width: this.rotatingBackgroundTexture.width,
        height: this.rotatingBackgroundTexture.height
      })
    } catch (error) {
      console.error('❌ Ошибка загрузки текстуры вращающегося фона:', error)
      throw error
    }
  }

  /**
   * Загрузка текстуры PayPal карточки (asset_0009.webp)
   */
  async loadPayPalCardTexture() {
    const texturePath = '../reference/reference_assets/data_uri_assets/asset_0009.webp'
    
    try {
      this.paypalCardTexture = await this.assetLoader.loadTexture(texturePath)
      
      if (!this.paypalCardTexture) {
        throw new Error('Текстура PayPal карточки не загружена (null)')
      }
      
      console.log(`✅ Текстура PayPal карточки загружена:`, {
        width: this.paypalCardTexture.width,
        height: this.paypalCardTexture.height
      })
    } catch (error) {
      console.error('❌ Ошибка загрузки текстуры PayPal карточки:', error)
      throw error
    }
  }

  /**
   * Создание текстовых элементов
   * Использует тот же шрифт, что и кнопка Download
   * Стиль: белый текст с черной обводкой
   */
  createText() {
    // Вычисляем размер шрифта (адаптивный)
    const screenWidth = this.app.screen.width
    const screenHeight = this.app.screen.height
    
    // Заголовок должен быть значительно больше подзаголовка
    const titleFontSize = Math.max(32, Math.min(48, screenWidth * 0.06)) // Примерно 32-48px
    const subtitleFontSize = Math.max(20, Math.min(28, screenWidth * 0.037)) // Примерно 20-28px
    
    // Стиль для заголовка "Congratulations!"
    const titleStyle = new TextStyle({
      fontFamily: 'GameFont, sans-serif',
      fontSize: titleFontSize,
      fill: 0xFFFFFF, // Белый цвет текста
      stroke: 0x000000, // Черная обводка
      strokeThickness: 4, // Толстая обводка для эффекта комикса
      fontWeight: 'bold',
      letterSpacing: 0.5,
      align: 'center',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 6,
      dropShadowAngle: Math.PI / 6,
      dropShadowDistance: 3
    })
    
    // Стиль для подзаголовка "Choose your reward!"
    const subtitleStyle = new TextStyle({
      fontFamily: 'GameFont, sans-serif',
      fontSize: subtitleFontSize,
      fill: 0xF5F5F5, // Светло-серый цвет (почти белый, но чуть темнее)
      stroke: 0x000000, // Черная обводка
      strokeThickness: 3, // Обводка немного тоньше
      fontWeight: 'normal', // Не bold (regular weight)
      letterSpacing: 0.5,
      align: 'center',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 4,
      dropShadowAngle: Math.PI / 6,
      dropShadowDistance: 2
    })
    
    // Создаем текстовые элементы
    this.titleText = new Text('Congratulations!', titleStyle)
    this.titleText.anchor.set(0.5, 0.5)
    
    this.subtitleText = new Text('Choose your reward!', subtitleStyle)
    this.subtitleText.anchor.set(0.5, 0.5)
    
    // Позиционируем текст вертикально
    const titleHeight = this.titleText.height || titleFontSize * 1.2
    const spacing = titleHeight * 0.5
    
    // Текст должен быть выше центра контейнера
    const textOffsetY = -screenHeight * 0.25
    
    // Заголовок позиционируем выше центра
    this.titleText.y = textOffsetY - spacing / 2
    
    // Подзаголовок позиционируем ниже заголовка с достаточным отступом
    this.subtitleText.y = textOffsetY + spacing / 2 + titleHeight * 0.3
    
    // Добавляем в контейнер
    this.addChild(this.titleText)
    this.addChild(this.subtitleText)
    
    // Z-Index для текста
    this.titleText.zIndex = this.zIndex
    this.subtitleText.zIndex = this.zIndex
  }

  /**
   * Создание вращающегося фона (asset_0044.png)
   */
  createRotatingBackground() {
    if (!this.rotatingBackgroundTexture) {
      console.error('Текстура вращающегося фона не загружена')
      return
    }

    // Создаем спрайт
    this.rotatingBackgroundSprite = new Sprite(this.rotatingBackgroundTexture)
    
    // Вычисляем масштаб
    const screenWidth = this.app.screen.width
    const screenHeight = this.app.screen.height
    
    const targetSize = Math.min(screenWidth, screenHeight) * 0.8 // 80% от меньшей стороны
    const scale = targetSize / Math.max(this.rotatingBackgroundTexture.width, this.rotatingBackgroundTexture.height)
    
    this.rotatingBackgroundSprite.scale.set(scale, scale)
    
    // Центрируем спрайт
    this.rotatingBackgroundSprite.anchor.set(0.5, 0.5)
    this.rotatingBackgroundSprite.x = 0
    this.rotatingBackgroundSprite.y = 0
    
    // Z-Index (ниже всех элементов)
    this.rotatingBackgroundSprite.zIndex = this.zIndex - 2
    
    // Убеждаемся, что спрайт видим
    this.rotatingBackgroundSprite.visible = true
    this.rotatingBackgroundSprite.alpha = 1.0
    
    // Добавляем в контейнер ПЕРВЫМ
    this.addChildAt(this.rotatingBackgroundSprite, 0)
    
    // Запускаем анимацию вращения
    this.startRotationAnimation()
  }

  /**
   * Запуск анимации вращения фона
   */
  startRotationAnimation() {
    if (!this.rotatingBackgroundSprite) return
    
    // Скорость вращения (радианы в секунду)
    const rotationSpeed = 0.5 // Полный оборот за ~12.5 секунд
    
    this.rotationTicker = (ticker) => {
      if (!this.rotatingBackgroundSprite || !this.rotatingBackgroundSprite.visible) return
      
      // Вращаем спрайт
      const deltaSeconds = ticker.deltaMS / 1000
      this.rotatingBackgroundSprite.rotation += rotationSpeed * deltaSeconds
    }
    
    this.app.ticker.add(this.rotationTicker)
  }

  /**
   * Создание спрайта PayPal карточки (asset_0009.webp)
   */
  createPayPalCard() {
    if (!this.paypalCardTexture) {
      console.error('Текстура PayPal карточки не загружена')
      return
    }

    // Создаем спрайт
    this.paypalCardSprite = new Sprite(this.paypalCardTexture)
    
    const screenWidth = this.app.screen.width
    const screenHeight = this.app.screen.height
    
    // Целевая ширина карточки
    const targetWidth = screenWidth * 0.65
    const scale = targetWidth / this.paypalCardTexture.width
    
    this.paypalCardSprite.scale.set(scale, scale)
    
    // Центрируем спрайт горизонтально
    this.paypalCardSprite.anchor.set(0.5, 0.5)
    this.paypalCardSprite.x = 0
    
    // Позиционируем карточку ниже текста
    const subtitleBottom = this.subtitleText ? (this.subtitleText.y + this.subtitleText.height / 2) : 0
    const spacing = screenHeight * 0.03
    this.paypalCardSprite.y = subtitleBottom + spacing + (this.paypalCardSprite.height / 2)
    
    // Z-Index
    this.paypalCardSprite.zIndex = this.zIndex - 1
    
    // Убеждаемся, что спрайт видим
    this.paypalCardSprite.visible = true
    this.paypalCardSprite.alpha = 1.0
    
    // Добавляем в контейнер
    this.addChild(this.paypalCardSprite)
    
    // Обновляем позицию текста суммы денег после создания карточки
    this.updateMoneyAmountPosition()
    
    // Обновляем позицию кнопки после создания карточки
    if (this.installButton) {
      this.updateInstallButtonPosition()
    }
  }

  /**
   * Обновление позиции текста суммы денег в правом нижнем углу карточки
   */
  updateMoneyAmountPosition() {
    if (!this.moneyAmountText || !this.paypalCardSprite) return
    
    const screenWidth = this.app.screen.width
    const screenHeight = this.app.screen.height
    
    // Отступ от краев карточки
    const paddingX = screenWidth * 0.02
    const paddingY = screenHeight * 0.02
    
    // Правый нижний угол карточки
    const cardRight = this.paypalCardSprite.x + (this.paypalCardSprite.width / 2)
    const cardBottom = this.paypalCardSprite.y + (this.paypalCardSprite.height / 2)
    
    // Позиция текста
    this.moneyAmountText.x = cardRight - paddingX
    this.moneyAmountText.y = cardBottom - paddingY
  }

  /**
   * Создание кнопки "INSTALL AND EARN" (цвета Download - желто-оранжевый градиент)
   * Основано на кнопке Download из Footer.js
   */
  createInstallButton() {
    // Создаем контейнер для кнопки
    const buttonContainer = new Container()
    buttonContainer.eventMode = 'static'
    buttonContainer.cursor = 'pointer'
    
    // Параметры кнопки (адаптивные размеры)
    const screenWidth = this.app.screen.width
    const screenHeight = this.app.screen.height
    const fontSize = Math.max(14, Math.min(20, screenWidth * 0.04))
    const paddingX = screenWidth * 0.08 // 8% ширины экрана (широкая кнопка)
    const paddingY = screenHeight * 0.02 // 2% высоты экрана
    const borderWidth = 3
    
    // Создаем текст (белый с черной обводкой, как у Download)
    const textStyle = new TextStyle({
      fontFamily: 'GameFont, sans-serif',
      fontSize: fontSize,
      fill: 0xFFFFFF, // Белый цвет текста
      stroke: 0x000000, // Черная обводка
      strokeThickness: 2,
      fontWeight: 'bold',
      letterSpacing: 0.5,
      align: 'center'
    })
    
    const buttonText = new Text('INSTALL AND EARN', textStyle)
    buttonText.anchor.set(0.5, 0.5)
    
    // Вычисляем размеры кнопки
    const textWidth = buttonText.width
    const textHeight = buttonText.height
    const buttonWidth = textWidth + paddingX * 2
    const buttonHeight = textHeight + paddingY * 2
    
    // Радиус скругления
    const borderRadius = Math.max(12, buttonHeight * 0.25)
    
    // Pivot в центре
    buttonContainer.pivot.set(0, 0)
    
    // Создаем фон кнопки с градиентом как у Download
    const buttonBg = new Graphics()
    const halfWidth = buttonWidth / 2
    const halfHeight = buttonHeight / 2
    
    // Градиент как у Download: #ffe44d -> #ffb830 -> #ff9500
    const gradientSteps = 30
    
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
      buttonBg.rect(-halfWidth, y, buttonWidth, h).fill(color)
    }
    
    // Создаем маску со скругленными углами
    const gradientMask = new Graphics()
    gradientMask.roundRect(-halfWidth, -halfHeight, buttonWidth, buttonHeight, borderRadius).fill(0xFFFFFF)
    buttonBg.mask = gradientMask
    
    // Создаем границы (как у Download)
    const buttonBorder = new Graphics()
    
    // Внутренняя светлая граница
    buttonBorder.roundRect(-halfWidth, -halfHeight, buttonWidth, buttonHeight, borderRadius)
      .stroke({ width: 1, color: 0xF0F0F0 })
    
    // Внешняя темная граница (оранжевая, как у Download)
    buttonBorder.roundRect(-halfWidth, -halfHeight, buttonWidth, buttonHeight, borderRadius)
      .stroke({ width: borderWidth, color: 0xE07800 })
    
    // Позиционируем элементы
    buttonText.x = 0
    buttonText.y = 0
    
    // HitArea
    buttonContainer.hitArea = new Rectangle(-halfWidth, -halfHeight, buttonWidth, buttonHeight)
    
    // Видимость
    buttonBg.visible = true
    buttonBg.alpha = 1.0
    buttonBorder.visible = true
    buttonBorder.alpha = 1.0
    buttonText.visible = true
    buttonText.alpha = 1.0
    gradientMask.visible = true
    gradientMask.alpha = 1.0
    
    // Добавляем элементы в контейнер
    buttonContainer.addChild(gradientMask)
    buttonContainer.addChild(buttonBg)
    buttonContainer.addChild(buttonBorder)
    buttonContainer.addChild(buttonText)
    
    // Обработчик клика
    buttonContainer.on('pointerdown', () => {
      this.handleInstallClick()
    })
    
    // Анимация пульсации (быстрая, как у FailEndScreen)
    let pulseScale = 1.0
    let pulseDirection = 1
    const pulseSpeed = 0.005 // Быстрая пульсация
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
      
      buttonContainer.scale.set(pulseScale, pulseScale)
    }
    
    this.app.ticker.add(pulseAnimation)
    
    // Сохраняем ссылку на анимацию
    this.installButtonPulseAnimation = pulseAnimation
    
    // Z-Index
    buttonContainer.zIndex = this.zIndex
    buttonContainer.visible = true
    buttonContainer.alpha = 1.0
    
    this.installButton = buttonContainer
    
    // Добавляем в контейнер
    this.addChild(buttonContainer)
    
    console.log(`✅ Install button (Win) создана: размер ${buttonWidth.toFixed(1)}x${buttonHeight.toFixed(1)}, радиус ${borderRadius.toFixed(1)}`)
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
   * Обработка клика на кнопку "INSTALL AND EARN"
   */
  handleInstallClick() {
    console.log('🔘 Install button clicked (Win)')
    // TODO: Реализовать логику перехода в магазин приложений
  }

  /**
   * Создание текста суммы денег в правом нижнем углу PayPal карточки
   */
  createMoneyAmountText() {
    const screenWidth = this.app.screen.width
    const fontSize = Math.max(24, Math.min(36, screenWidth * 0.08))
    
    // Стиль для суммы денег (белый с черной обводкой)
    const moneyStyle = new TextStyle({
      fontFamily: 'GameFont, sans-serif',
      fontSize: fontSize,
      fill: 0xFFFFFF, // Белый цвет
      stroke: 0x000000, // Черная обводка
      strokeThickness: 3,
      fontWeight: 'bold',
      align: 'right',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 4,
      dropShadowAngle: Math.PI / 6,
      dropShadowDistance: 2
    })
    
    this.moneyAmountText = new Text('$0.00', moneyStyle)
    this.moneyAmountText.anchor.set(1, 1) // Справа, снизу
    this.moneyAmountText.zIndex = this.zIndex
    this.moneyAmountText.visible = true
    this.moneyAmountText.alpha = 1.0
    
    this.addChild(this.moneyAmountText)
  }

  /**
   * Обновление позиции (центр экрана)
   */
  updatePosition() {
    const screenWidth = this.app.screen.width
    const screenHeight = this.app.screen.height
    
    // Позиционируем контейнер в центре экрана
    this.position.set(screenWidth / 2, screenHeight / 2)
    
    // Обновляем размеры шрифта при изменении размера экрана
    if (this.titleText && this.subtitleText) {
      const titleFontSize = Math.max(32, Math.min(48, screenWidth * 0.06))
      const subtitleFontSize = Math.max(20, Math.min(28, screenWidth * 0.037))
      
      this.titleText.style.fontSize = titleFontSize
      this.subtitleText.style.fontSize = subtitleFontSize
      
      const titleHeight = this.titleText.height || titleFontSize * 1.2
      const spacing = titleHeight * 0.5
      const textOffsetY = -screenHeight * 0.25
      
      this.titleText.y = textOffsetY - spacing / 2
      this.subtitleText.y = textOffsetY + spacing / 2 + titleHeight * 0.3
      
      // Обновляем позицию PayPal карточки
      if (this.paypalCardSprite && this.paypalCardTexture) {
        const targetWidth = screenWidth * 0.65
        const scale = targetWidth / this.paypalCardTexture.width
        this.paypalCardSprite.scale.set(scale, scale)
        
        const subtitleBottom = this.subtitleText.y + this.subtitleText.height / 2
        const cardSpacing = screenHeight * 0.03
        this.paypalCardSprite.y = subtitleBottom + cardSpacing + (this.paypalCardSprite.height / 2)
        
        this.updateMoneyAmountPosition()
        
        if (this.moneyAmountText) {
          const fontSize = Math.max(24, Math.min(36, screenWidth * 0.08))
          this.moneyAmountText.style.fontSize = fontSize
        }
        
        this.updateInstallButtonPosition()
        
        // Обновляем масштаб вращающегося фона
        if (this.rotatingBackgroundSprite && this.rotatingBackgroundTexture) {
          const targetSize = Math.min(screenWidth, screenHeight) * 0.8
          const scale = targetSize / Math.max(this.rotatingBackgroundTexture.width, this.rotatingBackgroundTexture.height)
          this.rotatingBackgroundSprite.scale.set(scale, scale)
        }
      }
    }
  }

  /**
   * Обновление позиции кнопки "INSTALL AND EARN" ниже PayPal карточки
   */
  updateInstallButtonPosition() {
    if (!this.installButton || !this.paypalCardSprite) return
    
    const screenHeight = this.app.screen.height
    
    const cardBottom = this.paypalCardSprite.y + (this.paypalCardSprite.height / 2)
    const spacing = screenHeight * 0.04
    
    this.installButton.x = 0
    this.installButton.y = cardBottom + spacing + (this.installButton.height / 2)
  }

  /**
   * Показ экрана с анимацией появления
   * @param {number} score - Текущий счет игрока
   */
  show(score = 0) {
    this.visible = true
    this.updatePosition()
    
    // Обновляем сумму денег на карточке
    if (this.moneyAmountText) {
      const formattedScore = `$${score.toFixed(2)}`
      this.moneyAmountText.text = formattedScore
      this.moneyAmountText.visible = true
      this.moneyAmountText.alpha = 1.0
    }
    
    // Убеждаемся, что все элементы видимы
    if (this.rotatingBackgroundSprite) {
      this.rotatingBackgroundSprite.visible = true
      this.rotatingBackgroundSprite.alpha = 1.0
    }
    
    if (this.paypalCardSprite) {
      this.paypalCardSprite.visible = true
      this.paypalCardSprite.alpha = 1.0
    }
    
    if (this.installButton) {
      this.installButton.visible = true
      this.installButton.alpha = 1.0
      this.updateInstallButtonPosition()
    }
    
    // Анимация появления (fade in)
    this.alpha = 0
    
    let elapsed = 0
    const duration = 300
    
    const animate = (deltaMS) => {
      elapsed += deltaMS
      
      if (elapsed < duration) {
        this.alpha = elapsed / duration
      } else {
        this.alpha = 1
        this.app.ticker.remove(animate)
      }
    }
    
    this.app.ticker.add(animate)
    
    console.log('📺 Win End Screen показан', {
      visible: this.visible,
      position: `(${this.position.x.toFixed(1)}, ${this.position.y.toFixed(1)})`,
      screenSize: `${this.app.screen.width}x${this.app.screen.height}`,
      score: score.toFixed(2)
    })
  }

  /**
   * Скрытие экрана
   */
  hide() {
    this.visible = false
    this.alpha = 0
    console.log('📺 Win End Screen скрыт')
  }

  /**
   * Обновление позиции при изменении размера экрана
   */
  onResize() {
    this.updatePosition()
  }

  /**
   * Уничтожение компонента
   */
  destroy() {
    if (this.titleText) {
      this.titleText.destroy()
      this.titleText = null
    }
    
    if (this.subtitleText) {
      this.subtitleText.destroy()
      this.subtitleText = null
    }
    
    if (this.paypalCardSprite) {
      this.paypalCardSprite.destroy()
      this.paypalCardSprite = null
    }
    
    if (this.moneyAmountText) {
      this.moneyAmountText.destroy()
      this.moneyAmountText = null
    }
    
    if (this.installButton) {
      if (this.installButtonPulseAnimation) {
        this.app.ticker.remove(this.installButtonPulseAnimation)
        this.installButtonPulseAnimation = null
      }
      
      this.installButton.destroy()
      this.installButton = null
    }
    
    if (this.rotationTicker) {
      this.app.ticker.remove(this.rotationTicker)
      this.rotationTicker = null
    }
    
    if (this.rotatingBackgroundSprite) {
      this.rotatingBackgroundSprite.destroy()
      this.rotatingBackgroundSprite = null
    }
    
    this.paypalCardTexture = null
    this.rotatingBackgroundTexture = null
    
    super.destroy()
  }
}
