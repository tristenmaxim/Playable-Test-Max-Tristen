/**
 * Контроллер игрового процесса
 * Основано на анализе из ../анализ/02_game_controller.md
 */

import { Container } from 'pixi.js'
import { CONSTANTS } from './Constants.js'
import { ParallaxBackground } from '../entities/ParallaxBackground.js'
import { Player } from '../entities/Player.js'

export class GameController {
  constructor(app, assetLoader) {
    this.app = app
    this.assetLoader = assetLoader

    // Состояние игры
    this.state = CONSTANTS.STATES.LOADING
    this.isRunning = false
    this.isDecelerating = false
    this.currentSpeed = CONSTANTS.SPEED.BASE

    // Игровые метрики
    this.score = CONSTANTS.SCORE.START_BALANCE
    this.hp = CONSTANTS.HEALTH.MAX
    this.distanceTraveled = 0
    this.spawnIndex = 0

    // Контейнеры
    this.gameContainer = null
    this.entityContainer = null
    this.parallaxBackground = null
    
    // Игровые сущности
    this.player = null

    // События
    this.events = new Map()

    // Туториал
    this.tutorialTriggered = false
    this.jumpingEnabled = false
    this.tutorialEnemy = null

    // Замедление
    this.DECELERATION_RATE = CONSTANTS.SPEED.DECELERATION_RATE
    this.MIN_SPEED = CONSTANTS.SPEED.MIN
  }

  /**
   * Инициализация GameController
   */
  async init() {
    // Создание контейнеров
    this.createContainers()

    // Инициализация фона
    await this.initBackground()

    // Инициализация игрока
    await this.initPlayer()

    // Установка начального состояния
    this.setState(CONSTANTS.STATES.INTRO)
    
    // Слушаем изменения состояния для управления фоном
    this.on('stateChange', ({ to: newState }) => {
      if (this.parallaxBackground) {
        if (newState === CONSTANTS.STATES.PAUSED || newState === CONSTANTS.STATES.INTRO) {
          this.parallaxBackground.pause()
        } else {
          this.parallaxBackground.resume()
        }
      }
    })
  }

  /**
   * Инициализация фона
   */
  async initBackground() {
    this.parallaxBackground = new ParallaxBackground(this.app, this.assetLoader)
    this.parallaxBackground.zIndex = CONSTANTS.Z_INDEX.FAR_BACKGROUND
    this.gameContainer.addChild(this.parallaxBackground)
    await this.parallaxBackground.init()
  }

  /**
   * Инициализация игрока
   */
  async initPlayer() {
    // Используем roadY из ParallaxBackground для правильной позиции игрока
    // roadY - это позиция земли, где стоят кусты и деревья
    const groundY = this.parallaxBackground ? this.parallaxBackground.roadY : CONSTANTS.POSITIONS.GROUND_Y
    
    this.player = new Player(this.app, this.assetLoader, groundY)
    await this.player.init()
    
    // Добавляем спрайт игрока в контейнер сущностей
    if (this.player.sprite) {
      this.entityContainer.addChild(this.player.sprite)
    }
  }

  /**
   * Создание контейнеров
   */
  createContainers() {
    // Главный контейнер игры
    this.gameContainer = new Container()
    this.gameContainer.sortableChildren = true
    this.app.stage.addChild(this.gameContainer)

    // Контейнер для игровых сущностей
    this.entityContainer = new Container()
    this.entityContainer.sortableChildren = true
    this.entityContainer.zIndex = CONSTANTS.Z_INDEX.GROUND
    this.gameContainer.addChild(this.entityContainer)
  }

  /**
   * Обновление игрового цикла
   * @param {number} deltaMS - Время с последнего кадра в миллисекундах
   */
  update(deltaMS) {
    // Всегда обновляем фон
    if (this.parallaxBackground) {
      // В INTRO фон не движется, в RUNNING - движется
      const speed = this.isRunning ? this.currentSpeed : 0
      this.parallaxBackground.update(deltaMS, speed)
    }

    // Всегда обновляем игрока (если есть)
    if (this.player) {
      this.player.update(deltaMS)
    }

    // Если игра запущена
    if (this.isRunning) {
      // Замедление перед финишем
      if (this.isDecelerating) {
        this.currentSpeed *= this.DECELERATION_RATE
        if (this.currentSpeed < this.MIN_SPEED) {
          this.currentSpeed = 0
          setTimeout(() => {
            this.handleWin()
          }, 500)
        }
      }

      // Обновление параллакса (если есть)
      // if (this.parallax) {
      //   this.parallax.update(deltaMS, this.currentSpeed)
      // }

      // Расчёт пройденного расстояния
      this.distanceTraveled += this.currentSpeed * deltaMS / 1000

      // Спавн сущностей
      // this.checkSpawns()

      // Обновление сущностей
      // this.updateEntities(deltaMS)

      // Проверка коллизий
      // this.checkCollisions()

      // Очистка сущностей за экраном
      // this.cleanupEntities()
    }
  }

  /**
   * Установка состояния игры
   * @param {string} newState - Новое состояние
   */
  setState(newState) {
    const oldState = this.state
    this.state = newState
    this.emit('stateChange', { from: oldState, to: newState })
  }

  /**
   * Запуск игры
   */
  start() {
    this.isRunning = true
    this.jumpingEnabled = true
    this.setState(CONSTANTS.STATES.RUNNING)
    
    // Переключаем игрока на анимацию бега
    if (this.player && this.player.startRunning) {
      this.player.startRunning()
    }
    
    this.emit('start')
  }

  /**
   * Обработка тапа/клика
   */
  handleTap() {
    switch (this.state) {
      case CONSTANTS.STATES.INTRO:
        this.start()
        break

      case CONSTANTS.STATES.PAUSED:
        this.resumeFromTutorial()
        break

      case CONSTANTS.STATES.RUNNING:
        if (this.jumpingEnabled && !this.isDecelerating) {
          // Прыжок игрока
          if (this.player) {
            this.player.jump()
          }
          this.emit('jump')
        }
        break

      case CONSTANTS.STATES.END_WIN:
      case CONSTANTS.STATES.END_LOSE:
        // Обработка клика на экране завершения
        this.handleEndScreenTap()
        break
    }
  }

  /**
   * Возобновление после туториала
   */
  resumeFromTutorial() {
    this.isRunning = true
    this.jumpingEnabled = true
    this.setState(CONSTANTS.STATES.RUNNING)
    this.emit('tutorialComplete')
  }

  /**
   * Обработка победы
   */
  handleWin() {
    this.isRunning = false
    this.setState(CONSTANTS.STATES.END_WIN)
    this.emit('win', { score: this.score })
  }

  /**
   * Обработка поражения
   */
  handleLose() {
    this.isRunning = false
    this.setState(CONSTANTS.STATES.END_LOSE)
    this.emit('lose', { score: this.score })
  }

  /**
   * Обработка клика на экране завершения
   */
  handleEndScreenTap() {
    // CTA или рестарт
    // Будет реализовано в Фазе 4
  }

  /**
   * Подписка на событие
   * @param {string} event - Название события
   * @param {Function} callback - Функция обратного вызова
   */
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event).push(callback)
  }

  /**
   * Отписка от события
   * @param {string} event - Название события
   * @param {Function} callback - Функция обратного вызова
   */
  off(event, callback) {
    if (this.events.has(event)) {
      const callbacks = this.events.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * Эмит события
   * @param {string} event - Название события
   * @param {*} data - Данные события
   */
  emit(event, data) {
    if (this.events.has(event)) {
      this.events.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error)
        }
      })
    }
  }
}
