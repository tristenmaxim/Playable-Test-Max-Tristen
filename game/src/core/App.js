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

    // Запуск игрового цикла
    this.startGameLoop()

    // Настройка обработчиков событий
    this.setupEventHandlers()

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
      // Обновляем позиции UI элементов при изменении размера экрана
      if (this.gameController) {
        if (this.gameController.scoreDisplay && this.gameController.scoreDisplay.onResize) {
          this.gameController.scoreDisplay.onResize()
        }
        if (this.gameController.hpDisplay && this.gameController.hpDisplay.onResize) {
          this.gameController.hpDisplay.onResize()
        }
        if (this.gameController.footer && this.gameController.footer.onResize) {
          this.gameController.footer.onResize()
        }
        if (this.gameController.loseScreen && this.gameController.loseScreen.onResize) {
          this.gameController.loseScreen.onResize()
        }
        if (this.gameController.failEndScreen && this.gameController.failEndScreen.onResize) {
          this.gameController.failEndScreen.onResize()
        }
      }
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
   * Настройка обработчиков событий (клики, тапы)
   */
  setupEventHandlers() {
    // Обработка клика/тапа на экране
    const handleTap = (event) => {
      event.preventDefault()
      if (this.gameController) {
        this.gameController.handleTap()
      }
    }

    // Поддержка и мыши, и тач-событий
    this.app.canvas.addEventListener('click', handleTap)
    this.app.canvas.addEventListener('touchstart', handleTap)
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
