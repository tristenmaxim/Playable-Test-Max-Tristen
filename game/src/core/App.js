/**
 * Главный класс приложения
 * Основано на анализе из ../анализ/02_game_controller.md и 00_overview.md
 */

import { Application } from 'pixi.js'
import { CONSTANTS, initDynamicConstants } from './Constants.js'
import { AssetLoader } from './AssetLoader.js'
import { GameController } from './GameController.js'

export class App {
  constructor() {
    this.app = null
    this.assetLoader = null
    this.gameController = null
    this.lastTapTime = 0
    this.TAP_DELAY = 300 // мс - задержка между тапами для debouncing
  }

  /**
   * Инициализация приложения
   */
  async init() {
    // Инициализация динамических констант
    initDynamicConstants()

    // Инициализация PixiJS
    await this.initPixiJS()

    // Создание системы загрузки ассетов
    this.assetLoader = new AssetLoader()

    // Создание GameController
    this.gameController = new GameController(this.app, this.assetLoader)

    // Инициализация GameController
    await this.gameController.init()

    // Настройка обработчиков ввода
    this.setupInputHandlers()

    // Запуск игрового цикла
    this.startGameLoop()

    // Скрытие preloader
    this.hidePreloader()
  }

  /**
   * Инициализация PixiJS Application
   */
  async initPixiJS() {
    this.app = new Application()

    await this.app.init({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0xFCFCF6, // #FCFCF6
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      antialias: true,
      resizeTo: window
    })

    // Добавление canvas в DOM
    const canvas = this.app.canvas
    canvas.id = 'game-canvas'
    canvas.style.display = 'block'
    document.body.appendChild(canvas)

    // Обработка изменения размера окна
    window.addEventListener('resize', () => {
      initDynamicConstants()
      // GameController обновит позиции если нужно
    })
  }

  /**
   * Запуск игрового цикла
   */
  startGameLoop() {
    this.app.ticker.add((ticker) => {
      if (this.gameController) {
        this.gameController.update(ticker.deltaMS)
      }
    })
  }

  /**
   * Настройка обработчиков ввода
   * Основано на анализе из ../анализ/16_input_system.md
   */
  setupInputHandlers() {
    // Touch события (мобильные устройства)
    window.addEventListener('touchstart', this.handlePointerDown.bind(this), { passive: true })
    window.addEventListener('touchend', this.handlePointerUp.bind(this), { passive: true })
    window.addEventListener('touchcancel', this.handlePointerUp.bind(this), { passive: true })

    // Mouse события (десктоп)
    window.addEventListener('mousedown', this.handlePointerDown.bind(this))
    window.addEventListener('mouseup', this.handlePointerUp.bind(this))
    window.addEventListener('click', this.handleClick.bind(this))

    // Keyboard события (опционально - пробел для прыжка)
    window.addEventListener('keydown', this.handleKeyDown.bind(this))
  }

  /**
   * Обработка начала касания/нажатия
   */
  handlePointerDown(event) {
    event.preventDefault()
    this.handleTap()
  }

  /**
   * Обработка окончания касания/отпускания
   */
  handlePointerUp(event) {
    event.preventDefault()
    // Можно добавить дополнительную логику если нужно
  }

  /**
   * Обработка клика мыши
   */
  handleClick(event) {
    event.preventDefault()
    this.handleTap()
  }

  /**
   * Обработка нажатия клавиши
   */
  handleKeyDown(event) {
    // Пробел для прыжка/старта
    if (event.code === 'Space' || event.key === ' ') {
      event.preventDefault()
      this.handleTap()
    }
  }

  /**
   * Универсальный обработчик тапа с debouncing
   */
  handleTap() {
    const now = Date.now()
    
    // Debouncing - предотвращение слишком частых кликов
    if (now - this.lastTapTime < this.TAP_DELAY) {
      return
    }
    
    this.lastTapTime = now
    
    // Передача события в GameController
    if (this.gameController) {
      this.gameController.handleTap()
    }
  }

  /**
   * Скрытие preloader
   */
  hidePreloader() {
    const preloader = document.getElementById('preloader')
    if (preloader) {
      preloader.style.opacity = '0'
      preloader.style.visibility = 'hidden'
      setTimeout(() => {
        preloader.remove()
      }, 300)
    }
  }
}
