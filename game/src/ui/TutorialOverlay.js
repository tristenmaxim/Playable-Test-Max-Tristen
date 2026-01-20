/**
 * Tutorial Overlay - обучающий оверлей
 * Этап 16: UI - Tutorial Overlay
 * Показывает надпись "Tap to start earning!" при старте игры
 */

import { Container, Text, TextStyle, Graphics } from 'pixi.js'
import { CONSTANTS } from '../core/Constants.js'

export class TutorialOverlay extends Container {
  constructor(app, assetLoader) {
    super()
    
    this.app = app
    this.assetLoader = assetLoader
    
    // Текстовый спрайт для надписи
    this.tutorialText = null
    
    // Фон (полупрозрачный, опционально)
    this.background = null
    
    // Видимость
    this.visible = false
    
    // Z-Index
    this.zIndex = CONSTANTS.Z_INDEX.OVERLAY
  }

  /**
   * Инициализация Tutorial Overlay
   */
  async init() {
    try {
      // Загружаем шрифт GameFont из ассетов
      await this.loadFont()
      
      // Создание текстового элемента
      this.createTutorialText()
      
      // Позиционирование в центре экрана
      this.updatePosition()
      
      // Изначально скрыт
      this.visible = false
      
      console.log('✅ Tutorial Overlay инициализирован')
    } catch (error) {
      console.error('❌ Ошибка инициализации Tutorial Overlay:', error)
      throw error
    }
  }

  /**
   * Загрузка шрифта GameFont из asset_0045.ttf
   */
  async loadFont() {
    const fontPath = '/reference/reference_assets/data_uri_assets/asset_0045.ttf'
    
    try {
      // Загружаем шрифт через FontFace API
      const font = new FontFace('GameFont', `url(${fontPath})`)
      
      // Ждем загрузки шрифта
      await font.load()
      
      // Добавляем шрифт в document.fonts
      document.fonts.add(font)
      
      // Ждем готовности всех шрифтов
      await document.fonts.ready
      
      // Проверяем, что шрифт действительно загружен
      const isLoaded = document.fonts.check('12px GameFont')
      console.log(`✅ Шрифт GameFont загружен из asset_0045.ttf (проверка: ${isLoaded ? 'OK' : 'FAIL'})`)
    } catch (error) {
      console.warn('⚠️ Не удалось загрузить шрифт через FontFace API, используем CSS fallback:', error)
      // Fallback на CSS @font-face уже определен в HTML
      // Ждем готовности шрифтов из CSS
      await document.fonts.ready
      const isLoaded = document.fonts.check('12px GameFont')
      console.log(`📝 CSS fallback шрифт GameFont (проверка: ${isLoaded ? 'OK' : 'FAIL'})`)
    }
  }

  /**
   * Создание текстового элемента для туториала
   */
  createTutorialText() {
    // Стиль для текста (белый с черной обводкой для читаемости)
    // Используем шрифт GameFont из ассетов
    this.textStyle = new TextStyle({
      fontFamily: 'GameFont, Arial, sans-serif',
      fontSize: 32,
      fill: 0xFFFFFF, // Белый цвет
      align: 'center',
      fontWeight: 'bold',
      stroke: 0x000000, // Чёрная обводка
      strokeThickness: 4,
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 8,
      dropShadowAngle: Math.PI / 6,
      dropShadowDistance: 4
    })
    
    // Создаём текстовый спрайт с начальным текстом
    // По умолчанию показываем "Tap to start earning!"
    this.tutorialText = new Text('Tap to start\nearning!', this.textStyle)
    
    // Якорь (центр)
    this.tutorialText.anchor.set(0.5, 0.5)
    
    // Добавляем в контейнер
    this.addChild(this.tutorialText)
  }

  /**
   * Получить текст туториала по типу
   * @param {string} type - Тип туториала: 'start' или 'enemy'
   * @returns {string} Текст для отображения
   */
  getTutorialText(type) {
    const messages = {
      start: 'Tap to start\nearning!',
      enemy: 'Jump to avoid\nenemies'
    }
    
    return messages[type] || messages.start
  }

  /**
   * Обновление позиции (центр экрана)
   */
  updatePosition() {
    const screenWidth = this.app.screen.width
    const screenHeight = this.app.screen.height
    
    // Позиционируем в центре экрана
    this.position.set(screenWidth / 2, screenHeight / 2)
  }

  /**
   * Показ туториала
   * @param {string} type - Тип туториала: 'start' или 'enemy'
   */
  show(type = 'start') {
    // Обновляем текст в зависимости от типа
    if (this.tutorialText) {
      this.tutorialText.text = this.getTutorialText(type)
    }
    
    this.visible = true
    this.updatePosition()
    
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
    
    console.log(`📢 Показ туториала (тип: ${type}): "${this.getTutorialText(type)}"`)
  }

  /**
   * Скрытие туториала
   */
  hide() {
    // Анимация исчезновения (fade out)
    let elapsed = 0
    const duration = 300 // 300ms
    const startAlpha = this.alpha
    
    const animate = (deltaMS) => {
      elapsed += deltaMS
      
      if (elapsed < duration) {
        this.alpha = startAlpha * (1 - elapsed / duration)
      } else {
        this.alpha = 0
        this.visible = false
        this.app.ticker.remove(animate)
      }
    }
    
    this.app.ticker.add(animate)
  }

  /**
   * Обновление позиции при изменении размера экрана
   */
  onResize() {
    this.updatePosition()
  }

  /**
   * Уничтожение Tutorial Overlay
   */
  destroy() {
    if (this.tutorialText) {
      if (this.tutorialText.parent) {
        this.tutorialText.parent.removeChild(this.tutorialText)
      }
      this.tutorialText.destroy()
      this.tutorialText = null
    }
    
    if (this.background) {
      if (this.background.parent) {
        this.background.parent.removeChild(this.background)
      }
      this.background.destroy()
      this.background = null
    }
    
    super.destroy()
  }
}
