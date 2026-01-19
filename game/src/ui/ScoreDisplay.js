/**
 * Score Display - отображение счёта игрока
 * Этап 15: UI - Score Display
 * Использует PayPal подложку (asset_0042.webp) как в оригинале
 */

import { Container, Text, TextStyle, Sprite } from 'pixi.js'
import { CONSTANTS } from '../core/Constants.js'

export class ScoreDisplay extends Container {
  constructor(app, assetLoader) {
    super()
    
    this.app = app
    this.assetLoader = assetLoader
    
    // Текущий счёт
    this.currentScore = CONSTANTS.SCORE.START_BALANCE
    
    // Спрайт фона (PayPal подложка)
    this.backgroundSprite = null
    
    // Текстовый спрайт для отображения счёта
    this.scoreText = null
    
    // Параметры отображения (как в оригинале)
    this.fontSize = 28 // Размер шрифта для числа счёта
    this.padding = 15 // Отступ от края экрана (как в оригинале: ~15px)
    
    // Внутренние отступы PayPal подложки (как в оригинале)
    this.innerPaddingLeft = 10 // Отступ от левого края подложки до PayPal логотипа
    this.innerPaddingRight = 10 // Отступ от правого края подложки до числа
    this.innerPaddingVertical = 8 // Вертикальные отступы (сверху и снизу)
    
    // Фиксированный размер PayPal подложки (не зависит от размера экрана)
    // Подложка будет под числом, масштабируется пропорционально
    this.fixedWidth = 140 // Фиксированная ширина в пикселях (200px - 30% = 140px)
    
    // Z-Index (выше Footer, но ниже оверлеев)
    this.zIndex = CONSTANTS.Z_INDEX.UI_SCORE
  }

  /**
   * Инициализация Score Display
   */
  async init() {
    try {
      // Убеждаемся, что контейнер видим
      this.visible = true
      this.alpha = 1.0
      
      // Ждем загрузки шрифта GameFont перед созданием текста
      await this.ensureFontLoaded()
      
      // Сначала загружаем PayPal подложку (добавится первой, будет под текстом по z-index)
      await this.loadBackground()
      
      // Затем создаем текст счёта (размер как у эмодзи, будет поверх подложки)
      this.createScoreText()
      
      // Позиционирование (правый верхний угол, число по центру правой части подложки)
      this.updatePosition()
      
      // Устанавливаем начальное значение
      this.updateScore(this.currentScore)
      
      console.log('✅ Score Display инициализирован: число по центру правой части подложки')
      console.log(`📍 Score Display позиция: x=${this.position.x.toFixed(1)}, y=${this.position.y.toFixed(1)}`)
    } catch (error) {
      console.error('❌ Ошибка инициализации Score Display:', error)
      throw error
    }
  }

  /**
   * Убеждаемся, что шрифт GameFont загружен
   */
  async ensureFontLoaded() {
    // Ждем готовности всех шрифтов (включая CSS @font-face)
    await document.fonts.ready
    
    // Проверяем, что GameFont доступен
    const isLoaded = document.fonts.check('12px GameFont')
    if (!isLoaded) {
      console.warn('⚠️ GameFont не загружен, используем fallback')
    } else {
      console.log('✅ GameFont готов к использованию')
    }
  }

  /**
   * Загрузка фонового изображения (PayPal подложка asset_0042.webp)
   * Подложка позиционируется так, чтобы число "$0" было посередине правой половины подложки
   */
  async loadBackground() {
    const texturePath = '../reference/reference_assets/data_uri_assets/asset_0042.webp'
    
    try {
      const texture = await this.assetLoader.loadTexture(texturePath)
      console.log('✅ PayPal подложка загружена:', texture.width, 'x', texture.height)
      
      // Создаём спрайт фона
      this.backgroundSprite = new Sprite(texture)
      
      // Фиксированное масштабирование (не зависит от размера экрана)
      const scale = this.fixedWidth / texture.width
      this.backgroundSprite.scale.set(scale)
      
      const scaledWidth = this.fixedWidth
      const scaledHeight = texture.height * scale
      
      console.log(`📏 PayPal подложка: фиксированный масштаб ${scale.toFixed(3)}, ширина ${scaledWidth}px, высота ${scaledHeight.toFixed(0)}px`)
      
      // Подложка должна быть выровнена по правому краю контейнера
      // Подложка имеет anchor (1, 0), значит её правый верхний угол должен быть в (0, 0) контейнера
      const offsetX = 0
      const offsetY = 0 // Подложка в верхнем левом углу контейнера (правый верхний угол подложки в (0,0))
      
      // Якорь (правый верхний угол подложки)
      this.backgroundSprite.anchor.set(1, 0)
      
      // Позиционируем подложку в правом верхнем углу контейнера
      this.backgroundSprite.x = offsetX
      this.backgroundSprite.y = offsetY
      
      console.log(`📍 Позиция подложки: x=${offsetX.toFixed(1)}, y=${offsetY.toFixed(1)}`)
      
      // Z-index: подложка должна быть ПОД текстом (меньший z-index)
      // В PixiJS порядок добавления определяет z-index (первый добавленный - ниже)
      // Добавляем подложку ПЕРВОЙ, чтобы она была под текстом
      this.addChildAt(this.backgroundSprite, 0)
    } catch (error) {
      console.warn('⚠️ Не удалось загрузить PayPal подложку:', error)
      throw error
    }
  }

  /**
   * Создание текстового элемента для счёта
   * Размер шрифта 28px, позиция справа (как эмодзи слева)
   */
  createScoreText() {
    // Стиль для текста счёта (темно-синий цвет PayPal, размер 28px)
    // Используем GameFont (asset_0045.ttf), как везде в игре
    const textStyle = new TextStyle({
      fontFamily: 'GameFont, sans-serif',
      fontSize: this.fontSize, // 28px
      fill: 0x003087, // Темно-синий цвет PayPal
      align: 'right',
      fontWeight: 'bold'
    })
    
    // Создаём текстовый спрайт
    this.scoreText = new Text('$0', textStyle)
    
    // Убеждаемся, что используется GameFont
    this.scoreText.style.fontFamily = 'GameFont, sans-serif'
    
    // Позиционируем текст с отступом от правого края контейнера
    // Отступ нужен для того, чтобы число было с внутренним отступом от правого края подложки
    // Вертикальная позиция будет установлена после загрузки подложки в updatePosition
    this.scoreText.x = -this.innerPaddingRight // Сдвиг влево на размер внутреннего отступа
    this.scoreText.y = 0 // Временно, будет обновлено в updatePosition
    
    // Якорь (правый верхний угол)
    this.scoreText.anchor.set(1, 0) // Справа, сверху
    
    // Убеждаемся, что текст видим
    this.scoreText.visible = true
    this.scoreText.alpha = 1.0
    
    // Добавляем в контейнер (после подложки, чтобы был поверх по z-index)
    this.addChild(this.scoreText)
  }

  /**
   * Обновление позиции (правый верхний угол экрана)
   * Позиционирование аналогично HP Display (сердечки), но справа
   */
  updatePosition() {
    const screenWidth = this.app.screen.width
    
    // Позиционируем контейнер аналогично HP Display, но справа
    // HP Display: position.set(padding, padding) - левый верхний угол
    // Score Display: правый верхний угол с тем же отступом
    // Текст в контейнере имеет anchor (1, 0) - правый верхний угол
    this.position.set(screenWidth - this.padding, this.padding)
    
    // Обновляем позицию подложки и текста (если они загружены)
    if (this.backgroundSprite && this.scoreText) {
      const scaledHeight = this.backgroundSprite.height
      const textHeight = this.fontSize
      
      // Подложка выровнена по правому верхнему углу контейнера
      this.backgroundSprite.x = 0
      this.backgroundSprite.y = 0
      
      // Текст с отступом от правого края контейнера
      // Вертикально: по центру правой части подложки (центр подложки по вертикали)
      this.scoreText.x = -this.innerPaddingRight
      this.scoreText.y = scaledHeight / 2 - textHeight / 2 // Центр подложки минус половина высоты текста
    }
  }

  /**
   * Обновление отображения счёта
   * @param {number} score - Текущий счёт
   */
  updateScore(score) {
    const previousScore = this.currentScore
    this.currentScore = Math.max(0, score)
    
    // Форматируем счёт с символом валюты
    const formattedScore = `$${Math.floor(this.currentScore)}`
    
    // Обновляем текст
    if (this.scoreText) {
      // Принудительно обновляем стиль ПЕРЕД изменением текста
      // Это гарантирует, что GameFont будет использоваться при пересоздании текстуры
      if (this.scoreText.style) {
        this.scoreText.style.fontFamily = 'GameFont, sans-serif'
      }
      
      // Изменяем текст (это может пересоздать текстуру)
      this.scoreText.text = formattedScore
      
      // Принудительно обновляем стиль ПОСЛЕ изменения текста
      // PixiJS может пересоздать текстуру при изменении текста, поэтому нужно обновить стиль снова
      if (this.scoreText.style) {
        this.scoreText.style.fontFamily = 'GameFont, sans-serif'
      }
      
      // Также обновляем через прямое свойство style для надежности
      this.scoreText.style = this.scoreText.style || {}
      this.scoreText.style.fontFamily = 'GameFont, sans-serif'
    }
    
    // Анимация при увеличении счёта
    if (this.currentScore > previousScore) {
      this.animateScoreChange()
    }
  }

  /**
   * Анимация изменения счёта (пульсация и масштабирование)
   */
  animateScoreChange() {
    if (!this.scoreText) return
    
    const originalScale = this.scoreText.scale.x
    const pulseScale = originalScale * 1.2
    
    // Простая анимация через ticker
    let elapsed = 0
    const duration = 300 // 300ms
    
    const animate = (deltaMS) => {
      elapsed += deltaMS
      
      // Убеждаемся, что стиль не сбросился во время анимации
      if (this.scoreText && this.scoreText.style) {
        this.scoreText.style.fontFamily = 'GameFont, sans-serif'
      }
      
      if (elapsed < duration) {
        const progress = elapsed / duration
        
        if (progress < 0.5) {
          // Увеличение
          const scale = originalScale + (pulseScale - originalScale) * (progress * 2)
          this.scoreText.scale.set(scale)
        } else {
          // Уменьшение обратно
          const scale = pulseScale - (pulseScale - originalScale) * ((progress - 0.5) * 2)
          this.scoreText.scale.set(scale)
        }
      } else {
        this.scoreText.scale.set(originalScale)
        this.app.ticker.remove(animate)
        
        // Финальная проверка стиля после анимации
        if (this.scoreText && this.scoreText.style) {
          this.scoreText.style.fontFamily = 'GameFont, sans-serif'
        }
      }
    }
    
    this.app.ticker.add(animate)
  }

  /**
   * Обновление позиции при изменении размера экрана
   * Размер остается фиксированным, обновляется только позиция
   */
  onResize() {
    this.updatePosition()
  }

  /**
   * Уничтожение Score Display
   */
  destroy() {
    if (this.backgroundSprite) {
      if (this.backgroundSprite.parent) {
        this.backgroundSprite.parent.removeChild(this.backgroundSprite)
      }
      this.backgroundSprite.destroy()
      this.backgroundSprite = null
    }
    
    if (this.scoreText) {
      if (this.scoreText.parent) {
        this.scoreText.parent.removeChild(this.scoreText)
      }
      this.scoreText.destroy()
      this.scoreText = null
    }
    
    super.destroy()
  }
}
