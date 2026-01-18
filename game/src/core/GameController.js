/**
 * Контроллер игрового процесса
 * Основано на анализе из ../анализ/02_game_controller.md
 */

import { Container } from 'pixi.js'
import { CONSTANTS } from './Constants.js'
import { ParallaxBackground } from '../entities/ParallaxBackground.js'
import { Player } from '../entities/Player.js'
import { Collectible } from '../entities/Collectible.js'
import { rectanglesIntersect } from '../utils/Collision.js'
import { COLLECTIBLE_SPAWN_DATA } from './spawnData.js'

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
    this.distanceTraveled = 0 // Пройденное расстояние в пикселях

    // Контейнеры
    this.gameContainer = null
    this.entityContainer = null
    this.parallaxBackground = null
    
    // Игровые сущности
    this.player = null
    this.collectibles = [] // Массив коллекций
    
    // Данные спавна коллекций из референса
    // Каждая запись будет помечена как spawned после спавна
    this.collectibleSpawnData = COLLECTIBLE_SPAWN_DATA.map(data => ({
      ...data,
      spawned: false
    }))

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
   * Спавн коллекции по данным из референса
   * @param {Object} spawnData - Данные спавна { type, yOffset }
   */
  async spawnCollectible(spawnData) {
    const groundY = this.parallaxBackground ? this.parallaxBackground.roadY : CONSTANTS.POSITIONS.GROUND_Y
    
    // Позиция X: справа за экраном (как в референсе: yt + yt * 0.5)
    // где yt = 720 (единица расстояния из референса)
    const yt = 720
    const spawnX = window.innerWidth + yt * 0.5
    
    // Тип определяется случайно: 60% dollar, 40% paypalCard (как в референсе)
    const type = Math.random() < 0.6 ? 'dollar' : 'paypalCard'
    
    // Y координата коллектбла
    // Референсные значения рассчитаны для Me=1280px, нужно масштабировать пропорционально
    const referenceHeight = CONSTANTS.POSITIONS.REFERENCE_SCREEN_HEIGHT // 1280
    const heightScale = window.innerHeight / referenceHeight
    
    // В референсе: baseY = roadY - 60, y = baseY - yOffset
    // Но для баланса с уменьшенным прыжком нужно поднять коллектблы выше
    const baseY = groundY - (60 * heightScale) // Базовая позиция: roadY - 60
    
    // yOffset из spawnData масштабируем пропорционально
    const scaledYOffset = (spawnData.yOffset || 0) * heightScale
    
    // Коллектблы в группах (yOffset>0) должны быть ВЫШЕ для баланса с уменьшенным прыжком
    // Поднимаем их выше базовой позиции
    let y
    if (spawnData.yOffset > 0) {
      // Коллектблы в воздухе: позиция выше roadY
      // Добавляем смещение чтобы поднять их выше для баланса с прыжком
      const additionalOffset = 160 * heightScale // Дополнительное смещение вверх (80px + 80px = 160px)
      y = groundY - scaledYOffset - additionalOffset
    } else {
      // Коллектблы на земле: базовая позиция (roadY - 60)
      y = baseY
    }
    
    const collectible = new Collectible(this.app, this.assetLoader, type, spawnX, y)
    await collectible.init()
    
    // Добавляем спрайт в контейнер сущностей
    if (collectible.sprite) {
      this.entityContainer.addChild(collectible.sprite)
      this.collectibles.push(collectible)
      
      // Отладочная информация для проверки системы координат
      // Игрок стоит на roadY (sprite.y = roadY, anchor (0.5, 1) - низ спрайта на roadY)
      // Максимальная высота прыжка: roadY - JUMP_HEIGHT
      const maxJumpY = groundY - (CONSTANTS.PHYSICS.JUMP_HEIGHT * heightScale)
      
      // Коллектбл имеет anchor (0.5, 0.5), значит центр в точке y
      const collectibleCenterY = y
      // Примерный радиус коллектбла (диаметр ~42px, радиус ~21px)
      const collectibleRadius = 21 * heightScale
      // Нижняя точка коллектбла: y - (высота/2)
      const collectibleBottomY = y - collectibleRadius
      const collectibleTopY = y + collectibleRadius
      
      // Игрок может достать коллектбл, если его максимальная высота прыжка >= нижней точки коллектбла
      const canReach = collectibleBottomY >= maxJumpY
      
      // Расстояние от roadY до коллектбла (положительное = выше roadY)
      const distanceFromRoadY = groundY - collectibleBottomY
      
      // Проверка баланса: коллектбл должен быть доступен при прыжке
      // Максимальная высота прыжка: roadY - JUMP_HEIGHT
      // Коллектбл доступен если его нижняя точка >= максимальной высоты прыжка
      const jumpReach = groundY - maxJumpY // Досягаемость прыжка от roadY
      const collectibleHeight = collectibleBottomY - groundY // Высота коллектбла от roadY (отрицательная = выше)
      const isBalanced = Math.abs(collectibleHeight + jumpReach) < 50 // Разница должна быть небольшой
      
      console.log(`🪙 ${type === 'paypalCard' ? 'PayPal' : 'Доллар'} создан:`, {
        x: spawnX.toFixed(0),
        y: y.toFixed(0),
        yOffset: spawnData.yOffset || 0,
        scaledYOffset: scaledYOffset.toFixed(0),
        groundY: groundY.toFixed(0),
        baseY: baseY.toFixed(0),
        collectibleBottomY: collectibleBottomY.toFixed(0),
        collectibleTopY: collectibleTopY.toFixed(0),
        distanceFromRoadY: distanceFromRoadY.toFixed(0),
        maxJumpY: maxJumpY.toFixed(0),
        jumpHeight: (CONSTANTS.PHYSICS.JUMP_HEIGHT * heightScale).toFixed(0),
        jumpReach: jumpReach.toFixed(0),
        collectibleHeight: collectibleHeight.toFixed(0),
        isBalanced: isBalanced ? '✅' : '⚠️',
        needsJump: (spawnData.yOffset || 0) > 0 ? '✅' : '❌',
        canReach: canReach ? '✅' : '❌'
      })
    }
  }

  /**
   * Проверка и спавн коллекций по пройденному расстоянию
   * Использует данные из референса с правильной группировкой
   */
  checkCollectibleSpawns() {
    // В референсе используется: while(spawnIndex < Gl.length) { if(distanceTraveled >= distance * yt - yt) spawnEntity() }
    // где yt = 720 (ширина экрана в референсе, единица расстояния)
    // Используем фиксированное значение для единицы расстояния (720px как в референсе)
    // Это обеспечит консистентные расстояния между коллектблами независимо от размера экрана
    const yt = 720 // Единица расстояния в пикселях (фиксированное значение из референса)
    
    // Проверяем все записи спавна, которые ещё не заспавнены
    // Используем цикл по всем элементам, а не только по индексу
    for (let i = 0; i < this.collectibleSpawnData.length; i++) {
      const data = this.collectibleSpawnData[i]
      
      // Пропускаем уже заспавненные элементы
      if (data.spawned) continue
      
      // Конвертируем distance из единиц в пиксели (1 единица = 800px)
      const distanceInPixels = data.distance * yt
      
      // Если достигли нужного расстояния (как в референсе: distanceTraveled >= distance * yt - yt)
      if (this.distanceTraveled >= distanceInPixels - yt) {
        // Спавним коллекцию
        this.spawnCollectible(data).catch(error => {
          console.error('Ошибка спавна коллекции:', error)
        })
        data.spawned = true // Помечаем как заспавненную
        
        // Продолжаем проверять следующие элементы на том же расстоянии
        // (для одновременного спавна нескольких коллекций в группе)
      } else {
        // Если ещё не достигли - пропускаем этот элемент, но продолжаем проверять остальные
        // (не делаем break, чтобы проверить все элементы)
      }
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

      // Расчёт пройденного расстояния (в пикселях)
      this.distanceTraveled += this.currentSpeed * deltaMS / 1000

      // Проверка и спавн коллекций по расстоянию
      this.checkCollectibleSpawns()

      // Обновление коллекций (коллектблы статичные, стоят на месте)
      for (let i = this.collectibles.length - 1; i >= 0; i--) {
        const collectible = this.collectibles[i]
        if (collectible.isActive && !collectible.isCollected) {
          // Обновляем коллекцию (анимация вращения)
          collectible.update(deltaMS, 0)
          
          // Удаляем коллекции, которые ушли за левый край экрана (если они движутся)
          // Для статичных коллектблов эта проверка не нужна, но оставляем на случай будущих изменений
          // if (collectible.x + collectible.width < 0) {
          //   collectible.destroy()
          //   this.collectibles.splice(i, 1)
          // }
        }
      }

      // Проверка коллизий с коллекциями
      this.checkCollectibleCollisions()

      // Спавн других сущностей (враги, препятствия)
      // this.checkSpawns()

      // Обновление других сущностей
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
   * Проверка коллизий с коллекциями
   */
  checkCollectibleCollisions() {
    if (!this.player || !this.player.sprite) return

    const playerHitbox = this.player.getHitbox()
    if (!playerHitbox) return

    // Проверяем каждую коллекцию
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const collectible = this.collectibles[i]
      
      if (!collectible.isActive || collectible.isCollected) continue

      const collectibleHitbox = collectible.getHitbox()
      
      // Проверяем пересечение хитбоксов
      if (rectanglesIntersect(playerHitbox, collectibleHitbox)) {
        this.collectItem(collectible)
        // Удаляем из массива после сбора
        this.collectibles.splice(i, 1)
        break // Собираем только одну коллекцию за кадр
      }
    }
  }

  /**
   * Обработка сбора коллекции
   * @param {Collectible} collectible - Собранная коллекция
   */
  collectItem(collectible) {
    if (collectible.isCollected) return

    // Вызываем метод сбора коллекции
    collectible.collect()

    // Увеличиваем счёт
    this.score += collectible.value

    console.log(`✨ ${collectible.type === 'paypalCard' ? 'PayPal карта' : 'Доллар'} собран! Счёт: ${this.score}`)

    // Эмитим событие (для будущих этапов - UI обновление)
    this.emit('collect', {
      value: collectible.value,
      type: collectible.type,
      totalScore: this.score
    })
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
