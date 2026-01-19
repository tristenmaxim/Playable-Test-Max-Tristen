/**
 * Fail End Screen - финальный экран проигрыша
 * Показывается после исчезновения asset_0041.png
 * Содержит:
 * 1. Текст "You didn't make it!\nTry again on the app!"
 * 2. asset_0009.webp (PayPal карточка)
 * 3. Количество заработанных денег (в правом нижнем углу карточки)
 * 4. Кнопка "INSTALL AND EARN!"
 * 5. asset_0044.png (крутится на фоне)
 */

import { Container, Text, TextStyle, Sprite, Graphics, Rectangle } from 'pixi.js'
import { CONSTANTS } from '../core/Constants.js'

export class FailEndScreen extends Container {
  constructor(app, assetLoader) {
    super()
    
    this.app = app
    this.assetLoader = assetLoader
    
    // Текстовые элементы
    this.titleText = null // "You didn't make it!"
    this.subtitleText = null // "Try again on the app!"
    
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
   * Инициализация Fail End Screen
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
      
      console.log('✅ Fail End Screen инициализирован')
    } catch (error) {
      console.error('❌ Ошибка инициализации Fail End Screen:', error)
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
   * Стиль: белый текст с черной обводкой (как в референсе)
   */
  createText() {
    // Вычисляем размер шрифта (адаптивный)
    // Для заголовка используем больший размер, для подзаголовка - меньший
    const screenWidth = this.app.screen.width
    const screenHeight = this.app.screen.height
    
    // Заголовок должен быть значительно больше подзаголовка
    // Используем фиксированные размеры относительно экрана для консистентности
    const titleFontSize = Math.max(32, Math.min(48, screenWidth * 0.06)) // Примерно 32-48px
    const subtitleFontSize = Math.max(20, Math.min(28, screenWidth * 0.037)) // Примерно 20-28px
    
    // Стиль для заголовка "You didn't make it!"
    // Белый текст с черной обводкой, bold (как в референсе)
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
    
    // Стиль для подзаголовка "Try again on the app!"
    // Серовато-белый текст с черной обводкой, не bold (regular weight)
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
    this.titleText = new Text('You didn\'t make it!', titleStyle)
    this.titleText.anchor.set(0.5, 0.5)
    
    this.subtitleText = new Text('Try again on the app!', subtitleStyle)
    this.subtitleText.anchor.set(0.5, 0.5)
    
    // Позиционируем текст вертикально (заголовок выше, подзаголовок ниже)
    // Отступ между строками должен быть достаточным, чтобы не было перекрытия
    // Используем высоту заголовка как базу для отступа
    const titleHeight = this.titleText.height || titleFontSize * 1.2 // Примерная высота текста
    const spacing = titleHeight * 0.5 // Отступ между строками (50% от высоты заголовка)
    
    // Текст должен быть выше центра контейнера
    // Вычисляем смещение вверх от центра контейнера
    // Поднимаем текст выше, чтобы освободить место для кнопки внизу
    const textOffsetY = -screenHeight * 0.25 // Текст на 25% выше центра экрана (было 15%)
    
    // Заголовок позиционируем выше центра
    this.titleText.y = textOffsetY - spacing / 2
    
    // Подзаголовок позиционируем ниже заголовка с достаточным отступом
    this.subtitleText.y = textOffsetY + spacing / 2 + titleHeight * 0.3 // Дополнительный отступ для предотвращения перекрытия
    
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
    
    // Вычисляем масштаб для заполнения экрана (но не слишком большой)
    const screenWidth = this.app.screen.width
    const screenHeight = this.app.screen.height
    
    // Масштабируем так, чтобы покрыть большую часть экрана, но не весь
    const targetSize = Math.min(screenWidth, screenHeight) * 0.8 // 80% от меньшей стороны
    const scale = targetSize / Math.max(this.rotatingBackgroundTexture.width, this.rotatingBackgroundTexture.height)
    
    this.rotatingBackgroundSprite.scale.set(scale, scale)
    
    // Центрируем спрайт
    this.rotatingBackgroundSprite.anchor.set(0.5, 0.5)
    this.rotatingBackgroundSprite.x = 0
    this.rotatingBackgroundSprite.y = 0
    
    // Z-Index (ниже всех элементов, но выше фона игры)
    this.rotatingBackgroundSprite.zIndex = this.zIndex - 2
    
    // Убеждаемся, что спрайт видим
    this.rotatingBackgroundSprite.visible = true
    this.rotatingBackgroundSprite.alpha = 1.0
    
    // Добавляем в контейнер ПЕРВЫМ, чтобы был под всеми элементами
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
    
    // Вычисляем масштаб для адаптации к размеру экрана
    // Карточка должна быть достаточно большой, но не занимать весь экран
    const screenWidth = this.app.screen.width
    const screenHeight = this.app.screen.height
    
    // Целевая ширина карточки (примерно 60-70% ширины экрана)
    const targetWidth = screenWidth * 0.65
    const scale = targetWidth / this.paypalCardTexture.width
    
    // Применяем масштаб
    this.paypalCardSprite.scale.set(scale, scale)
    
    // Центрируем спрайт горизонтально
    this.paypalCardSprite.anchor.set(0.5, 0.5)
    this.paypalCardSprite.x = 0
    
    // Позиционируем карточку ниже текста
    // Вычисляем позицию относительно подзаголовка
    // Уменьшаем отступ, чтобы карточка была ближе к тексту и выше на экране
    const subtitleBottom = this.subtitleText ? (this.subtitleText.y + this.subtitleText.height / 2) : 0
    const spacing = screenHeight * 0.03 // Отступ между текстом и карточкой (3% высоты экрана, было 5%)
    this.paypalCardSprite.y = subtitleBottom + spacing + (this.paypalCardSprite.height / 2)
    
    // Z-Index (карточка должна быть под текстом по z-index, но визуально ниже)
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
    const paddingX = screenWidth * 0.02 // 2% ширины экрана
    const paddingY = screenHeight * 0.02 // 2% высоты экрана
    
    // Правый нижний угол карточки
    const cardRight = this.paypalCardSprite.x + (this.paypalCardSprite.width / 2)
    const cardBottom = this.paypalCardSprite.y + (this.paypalCardSprite.height / 2)
    
    // Позиция текста (отступ от правого нижнего угла карточки)
    this.moneyAmountText.x = cardRight - paddingX
    this.moneyAmountText.y = cardBottom - paddingY
  }

  /**
   * Создание кнопки "INSTALL AND EARN" (красная кнопка)
   * Основано на кнопке Download из Footer.js, но красного цвета
   */
  createInstallButton() {
    // Создаем контейнер для кнопки
    const buttonContainer = new Container()
    buttonContainer.eventMode = 'static'
    buttonContainer.cursor = 'pointer'
    
    // Параметры кнопки (адаптивные размеры)
    const screenWidth = this.app.screen.width
    const screenHeight = this.app.screen.height
    const fontSize = Math.max(14, Math.min(20, screenWidth * 0.04)) // Больше, чем у Download
    const paddingX = screenWidth * 0.08 // 8% ширины экрана (было 4% - теперь шире)
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
    
    // Создаем фон кнопки с красным градиентом
    const buttonBg = new Graphics()
    const halfWidth = buttonWidth / 2
    const halfHeight = buttonHeight / 2
    
    // Красный градиент: от темно-красного к ярко-красному
    // Используем цвета: #CC0000 -> #FF0000 -> #FF3333
    const gradientSteps = 30
    
    for (let i = 0; i < gradientSteps; i++) {
      const ratio = i / gradientSteps
      let color
      if (ratio < 0.5) {
        // От #CC0000 к #FF0000
        const r = ratio * 2
        color = this.interpolateColor(0xCC0000, 0xFF0000, r)
      } else {
        // От #FF0000 к #FF3333
        const r = (ratio - 0.5) * 2
        color = this.interpolateColor(0xFF0000, 0xFF3333, r)
      }
      
      const y = -halfHeight + (buttonHeight / gradientSteps) * i
      const h = buttonHeight / gradientSteps
      buttonBg.rect(-halfWidth, y, buttonWidth, h).fill(color)
    }
    
    // Создаем маску со скругленными углами
    const gradientMask = new Graphics()
    gradientMask.roundRect(-halfWidth, -halfHeight, buttonWidth, buttonHeight, borderRadius).fill(0xFFFFFF)
    buttonBg.mask = gradientMask
    
    // Создаем границы
    const buttonBorder = new Graphics()
    
    // Внутренняя светлая граница
    buttonBorder.roundRect(-halfWidth, -halfHeight, buttonWidth, buttonHeight, borderRadius)
      .stroke({ width: 1, color: 0xFF6666 })
    
    // Внешняя темная красная граница
    buttonBorder.roundRect(-halfWidth, -halfHeight, buttonWidth, buttonHeight, borderRadius)
      .stroke({ width: borderWidth, color: 0x990000 })
    
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
    
    // Анимация пульсации (быстрее, чем у кнопки Download)
    let pulseScale = 1.0 // Начинаем с нормального размера
    let pulseDirection = 1
    const pulseSpeed = 0.005 // Увеличена скорость пульсации (было 0.002)
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
      // Pivot установлен в центр, поэтому масштабирование происходит из центра
      buttonContainer.scale.set(pulseScale, pulseScale)
    }
    
    this.app.ticker.add(pulseAnimation)
    
    // Сохраняем ссылку на анимацию для очистки при уничтожении
    this.installButtonPulseAnimation = pulseAnimation
    
    // Z-Index
    buttonContainer.zIndex = this.zIndex
    buttonContainer.visible = true
    buttonContainer.alpha = 1.0
    
    this.installButton = buttonContainer
    
    // Добавляем в контейнер
    this.addChild(buttonContainer)
    
    console.log(`✅ Install button создана: размер ${buttonWidth.toFixed(1)}x${buttonHeight.toFixed(1)}, радиус ${borderRadius.toFixed(1)}`)
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
    console.log('🔘 Install button clicked')
    // TODO: Реализовать логику перехода в магазин приложений
  }

  /**
   * Создание текста суммы денег в правом нижнем углу PayPal карточки
   */
  createMoneyAmountText() {
    // Вычисляем размер шрифта (большой, жирный текст)
    const screenWidth = this.app.screen.width
    const fontSize = Math.max(24, Math.min(36, screenWidth * 0.08)) // Примерно 24-36px
    
    // Стиль для суммы денег (такой же, как текст над карточкой - белый с черной обводкой)
    const moneyStyle = new TextStyle({
      fontFamily: 'GameFont, sans-serif',
      fontSize: fontSize,
      fill: 0xFFFFFF, // Белый цвет (как текст над карточкой)
      stroke: 0x000000, // Черная обводка (как текст над карточкой)
      strokeThickness: 3, // Толщина обводки
      fontWeight: 'bold',
      align: 'right', // Выравнивание по правому краю
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 4,
      dropShadowAngle: Math.PI / 6,
      dropShadowDistance: 2
    })
    
    // Создаем текстовый элемент (начальное значение будет обновлено в show())
    this.moneyAmountText = new Text('$0.00', moneyStyle)
    
    // Якорь в правом нижнем углу
    this.moneyAmountText.anchor.set(1, 1) // Справа, снизу
    
    // Z-Index (выше карточки)
    this.moneyAmountText.zIndex = this.zIndex
    
    // Убеждаемся, что текст видим
    this.moneyAmountText.visible = true
    this.moneyAmountText.alpha = 1.0
    
    // Добавляем в контейнер (поверх карточки)
    this.addChild(this.moneyAmountText)
  }

  /**
   * Обновление позиции (центр экрана)
   */
  updatePosition() {
    const screenWidth = this.app.screen.width
    const screenHeight = this.app.screen.height
    
    // Позиционируем контейнер в центре экрана
    // Текст будет выше центра, карточка - в центре
    this.position.set(screenWidth / 2, screenHeight / 2)
    
    // Обновляем размеры шрифта при изменении размера экрана
    if (this.titleText && this.subtitleText) {
      const screenWidth = this.app.screen.width
      const titleFontSize = Math.max(32, Math.min(48, screenWidth * 0.06))
      const subtitleFontSize = Math.max(20, Math.min(28, screenWidth * 0.037))
      
      // Обновляем стили
      this.titleText.style.fontSize = titleFontSize
      this.subtitleText.style.fontSize = subtitleFontSize
      
      // Пересчитываем позиции с учетом реальной высоты текста
      const screenHeight = this.app.screen.height
      const titleHeight = this.titleText.height || titleFontSize * 1.2
      const spacing = titleHeight * 0.5
      const textOffsetY = -screenHeight * 0.25 // Поднимаем текст выше (было 0.15)
      
      this.titleText.y = textOffsetY - spacing / 2
      this.subtitleText.y = textOffsetY + spacing / 2 + titleHeight * 0.3
      
      // Обновляем позицию PayPal карточки относительно текста
      if (this.paypalCardSprite && this.paypalCardTexture) {
        const screenWidth = this.app.screen.width
        
        // Обновляем масштаб карточки при изменении размера экрана
        const targetWidth = screenWidth * 0.65
        const scale = targetWidth / this.paypalCardTexture.width
        this.paypalCardSprite.scale.set(scale, scale)
        
        // Пересчитываем позицию после изменения масштаба
        // Уменьшаем отступ для более компактного расположения
        const subtitleBottom = this.subtitleText.y + this.subtitleText.height / 2
        const cardSpacing = screenHeight * 0.03 // Уменьшенный отступ (было 0.05)
        this.paypalCardSprite.y = subtitleBottom + cardSpacing + (this.paypalCardSprite.height / 2)
        
        // Обновляем позицию текста суммы денег
        this.updateMoneyAmountPosition()
        
        // Обновляем размер шрифта при изменении размера экрана
        if (this.moneyAmountText) {
          const fontSize = Math.max(24, Math.min(36, screenWidth * 0.08))
          this.moneyAmountText.style.fontSize = fontSize
        }
        
        // Обновляем позицию кнопки "INSTALL AND EARN"
        this.updateInstallButtonPosition()
        
        // Обновляем масштаб вращающегося фона при изменении размера экрана
        if (this.rotatingBackgroundSprite && this.rotatingBackgroundTexture) {
          const screenWidth = this.app.screen.width
          const screenHeight = this.app.screen.height
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
    
    // Позиционируем кнопку ниже карточки с отступом
    const cardBottom = this.paypalCardSprite.y + (this.paypalCardSprite.height / 2)
    const spacing = screenHeight * 0.04 // Отступ между карточкой и кнопкой (4% высоты экрана)
    
    // Кнопка центрирована горизонтально (x = 0), позиционируем по Y ниже карточки
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
      // Форматируем счет с двумя знаками после запятой
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
      // Обновляем позицию кнопки относительно карточки
      this.updateInstallButtonPosition()
    }
    
    // Анимация появления (fade in)
    this.alpha = 0
    
    let elapsed = 0
    const duration = 300 // 300ms
    
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
    
    console.log('📺 Fail End Screen показан', {
      visible: this.visible,
      position: `(${this.position.x.toFixed(1)}, ${this.position.y.toFixed(1)})`,
      screenSize: `${this.app.screen.width}x${this.app.screen.height}`,
      score: score.toFixed(2),
      paypalCardVisible: this.paypalCardSprite ? this.paypalCardSprite.visible : false,
      paypalCardPosition: this.paypalCardSprite ? `(${this.paypalCardSprite.x.toFixed(1)}, ${this.paypalCardSprite.y.toFixed(1)})` : 'N/A',
      moneyAmountVisible: this.moneyAmountText ? this.moneyAmountText.visible : false
    })
  }

  /**
   * Скрытие экрана
   */
  hide() {
    this.visible = false
    this.alpha = 0
    console.log('📺 Fail End Screen скрыт')
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
      // Останавливаем анимацию пульсации перед уничтожением
      if (this.installButtonPulseAnimation) {
        this.app.ticker.remove(this.installButtonPulseAnimation)
        this.installButtonPulseAnimation = null
      }
      
      this.installButton.destroy()
      this.installButton = null
    }
    
    // Останавливаем анимацию вращения
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
