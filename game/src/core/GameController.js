/**
 * Контроллер игрового процесса
 * Основано на анализе из ../анализ/02_game_controller.md
 */

import { Container } from 'pixi.js'
import { CONSTANTS } from './Constants.js'
import { ParallaxBackground } from '../entities/ParallaxBackground.js'
import { Player } from '../entities/Player.js'
import { Collectible } from '../entities/Collectible.js'
import { Enemy } from '../entities/Enemy.js'
import { Obstacle } from '../entities/Obstacle.js'
import { FinishLine } from '../entities/FinishLine.js'
import { HPDisplay } from '../ui/HPDisplay.js'
import { ScoreDisplay } from '../ui/ScoreDisplay.js'
import { TutorialOverlay } from '../ui/TutorialOverlay.js'
import { rectanglesIntersect } from '../utils/Collision.js'
import { SPAWN_DATA } from './spawnData.js'

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
    this.enemies = [] // Массив врагов
    this.obstacles = [] // Массив препятствий
    this.finishLine = null // Финишная линия
    
    // UI элементы
    this.hpDisplay = null // HP Display
    this.scoreDisplay = null // Score Display
    
    // Единый массив данных спавна всех сущностей из референса (массив Gl)
    // Каждая запись будет помечена как spawned после спавна
    this.spawnData = SPAWN_DATA.map(data => ({
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

    // Инициализация UI элементов
    await this.initUI()

    // Установка начального состояния
    this.setState(CONSTANTS.STATES.INTRO)
    
    // Показываем туториал при старте (состояние INTRO)
    if (this.tutorialOverlay) {
      this.tutorialOverlay.show('start')
    }
    
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
   * Инициализация UI элементов
   */
  async initUI() {
    // Инициализация HP Display
    this.hpDisplay = new HPDisplay(this.app, this.assetLoader)
    await this.hpDisplay.init()
    
    // Добавляем HP Display в gameContainer (высокий z-index)
    this.gameContainer.addChild(this.hpDisplay)
    
    // Устанавливаем начальное значение HP
    this.hpDisplay.updateHP(this.hp)
    
    // Инициализация Score Display
    this.scoreDisplay = new ScoreDisplay(this.app, this.assetLoader)
    await this.scoreDisplay.init()
    
    // Добавляем Score Display в gameContainer (высокий z-index)
    this.gameContainer.addChild(this.scoreDisplay)
    
    // Устанавливаем начальное значение счёта
    this.scoreDisplay.updateScore(this.score)
    
    // Инициализация Tutorial Overlay
    this.tutorialOverlay = new TutorialOverlay(this.app, this.assetLoader)
    await this.tutorialOverlay.init()
    
    // Добавляем Tutorial Overlay в gameContainer (высокий z-index)
    this.gameContainer.addChild(this.tutorialOverlay)
    
    console.log('✅ UI элементы инициализированы')
  }

  /**
   * Спавн коллекции по данным из референса
   * @param {Object} spawnData - Данные спавна { type, yOffset }
   */
  async spawnCollectible(spawnData) {
    const groundY = this.parallaxBackground ? this.parallaxBackground.roadY : CONSTANTS.POSITIONS.GROUND_Y
    
    // Позиция X: справа за экраном (как в референсе: yt + yt * 0.5)
    // где yt = 720 (единица расстояния из референса)
    // Коллектблы будут двигаться влево синхронно с фоном
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
   * Проверка и спавн всех сущностей по пройденному расстоянию
   * Использует единый массив SPAWN_DATA из референса (массив Gl)
   * Основано на референсе: while(spawnIndex < Gl.length) { if(distanceTraveled >= distance * yt - yt) spawnEntity() }
   */
  checkSpawns() {
    // В референсе используется yt = 720 (ширина экрана в референсе, единица расстояния)
    // Используем фиксированное значение для единицы расстояния (720px как в референсе)
    const yt = 720 // Единица расстояния в пикселях (фиксированное значение из референса)
    
    // Проверяем все записи спавна, которые ещё не заспавнены
    for (let i = 0; i < this.spawnData.length; i++) {
      const data = this.spawnData[i]
      
      // Пропускаем уже заспавненные элементы
      if (data.spawned) continue
      
      // Конвертируем distance из единиц в пиксели
      const distanceInPixels = data.distance * yt
      
      // Если достигли нужного расстояния (как в референсе: distanceTraveled >= distance * yt - yt)
      if (this.distanceTraveled >= distanceInPixels - yt) {
        // Отладочный лог для финиша
        if (data.type === 'finish') {
          console.log(`🏁 Проверка спавна финиша:`, {
            distanceTraveled: this.distanceTraveled.toFixed(0),
            distanceInPixels: distanceInPixels.toFixed(0),
            threshold: (distanceInPixels - yt).toFixed(0),
            shouldSpawn: this.distanceTraveled >= distanceInPixels - yt
          })
        }
        
        // Спавним сущность в зависимости от типа
        if (data.type === 'collectible') {
          this.spawnCollectible(data).catch(error => {
            console.error('Ошибка спавна коллекции:', error)
          })
        } else if (data.type === 'enemy') {
          this.spawnEnemy(data).catch(error => {
            console.error('Ошибка спавна врага:', error)
          })
        } else if (data.type === 'obstacle') {
          this.spawnObstacle(data).catch(error => {
            console.error('Ошибка спавна препятствия:', error)
          })
        } else if (data.type === 'finish') {
          this.spawnFinishLine(data).catch(error => {
            console.error('Ошибка спавна финиша:', error)
          })
        }
        
        data.spawned = true // Помечаем как заспавненную
        
        // Продолжаем проверять следующие элементы на том же расстоянии
        // (для одновременного спавна нескольких сущностей в группе)
      }
    }
  }

  /**
   * Спавн врага
   * @param {Object} spawnData - Данные спавна { type: 'enemy', pauseForTutorial?: boolean }
   */
  async spawnEnemy(spawnData) {
    const groundY = this.parallaxBackground ? this.parallaxBackground.roadY : CONSTANTS.POSITIONS.GROUND_Y
    
    // Позиция X: справа за экраном (враг бежит навстречу игроку справа налево)
    const yt = 720
    const spawnX = window.innerWidth + yt * 0.5 // Справа за экраном
    
    // Y координата врага - на земле
    const y = groundY
    
    const enemy = new Enemy(this.app, this.assetLoader, spawnX, y)
    await enemy.init()
    
    // Добавляем спрайт в контейнер сущностей
    if (enemy.sprite) {
      this.entityContainer.addChild(enemy.sprite)
      this.enemies.push(enemy)
      
      // Если это первый враг с pauseForTutorial, помечаем его как tutorialEnemy
      if (spawnData.pauseForTutorial && !this.tutorialTriggered && !this.tutorialEnemy) {
        this.tutorialEnemy = enemy
        console.log(`🎓 Враг помечен как tutorialEnemy для паузы туториала`)
      }
      
      console.log(`👾 Враг создан:`, {
        x: spawnX.toFixed(0),
        y: y.toFixed(0),
        groundY: groundY.toFixed(0),
        isTutorialEnemy: enemy === this.tutorialEnemy
      })
    }
  }

  /**
   * Спавн препятствия (конус)
   * @param {Object} spawnData - Данные спавна { type: 'obstacle' }
   */
  async spawnObstacle(spawnData) {
    const groundY = this.parallaxBackground ? this.parallaxBackground.roadY : CONSTANTS.POSITIONS.GROUND_Y
    
    // Позиция X: справа за экраном
    const yt = 720
    const spawnX = window.innerWidth + yt * 0.5
    
    // Y координата препятствия - на земле
    const y = groundY
    
    const obstacle = new Obstacle(this.app, this.assetLoader, spawnX, y)
    await obstacle.init()
    
    // Добавляем контейнер препятствия в контейнер сущностей
    if (obstacle.container) {
      this.entityContainer.addChild(obstacle.container)
      this.obstacles.push(obstacle)
      
      console.log(`🚧 Препятствие создано:`, {
        x: spawnX.toFixed(0),
        y: y.toFixed(0),
        groundY: groundY.toFixed(0)
      })
    }
  }

  /**
   * Спавн финишной линии
   * @param {Object} spawnData - Данные спавна { type: 'finish' }
   */
  async spawnFinishLine(spawnData) {
    const groundY = this.parallaxBackground ? this.parallaxBackground.roadY : CONSTANTS.POSITIONS.GROUND_Y
    
    // Позиция X: справа за экраном
    const yt = 720
    const spawnX = window.innerWidth + yt * 0.5
    
    // Y координата финиша - на земле
    const y = groundY
    
    const finishLine = new FinishLine(this.app, this.assetLoader, spawnX, y)
    await finishLine.init()
    
    // Устанавливаем ссылку на игрока для проверки достижения ленты
    finishLine.setPlayer(this.player)
    
    // Добавляем контейнер финиша в контейнер сущностей
    if (finishLine.container) {
      this.entityContainer.addChild(finishLine.container)
      finishLine.isActive = true
      this.finishLine = finishLine
      
      console.log(`🏁 Финишная линия создана:`, {
        x: spawnX.toFixed(0),
        y: y.toFixed(0),
        groundY: groundY.toFixed(0),
        tapeBreakX: finishLine.tapeBreakX.toFixed(0),
        container: finishLine.container ? '✅' : '❌',
        sprite: finishLine.sprite ? '✅' : '❌',
        tapeSprite: finishLine.tapeSprite ? '✅' : '❌',
        isActive: finishLine.isActive,
        containerVisible: finishLine.container?.visible,
        containerAlpha: finishLine.container?.alpha,
        containerX: finishLine.container?.x?.toFixed(0),
        containerY: finishLine.container?.y?.toFixed(0),
        spriteX: finishLine.sprite?.x?.toFixed(0),
        spriteY: finishLine.sprite?.y?.toFixed(0)
      })
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
      // Формула: расстояние = скорость * время
      // speed в пикселях/сек, deltaMS в миллисекундах, делим на 1000 для получения секунд
      const distanceDelta = this.currentSpeed * deltaMS / 1000
      this.distanceTraveled += distanceDelta
      
      // Отладочный лог для первой монетки (distance: 1.0 = 720px)
      if (this.distanceTraveled < 800 && Math.floor(this.distanceTraveled / 100) !== Math.floor((this.distanceTraveled - distanceDelta) / 100)) {
        const timeToFirstCoin = 720 / this.currentSpeed // Время до первой монетки в секундах
        console.log(`📏 Пройдено: ${this.distanceTraveled.toFixed(0)}px, скорость: ${this.currentSpeed.toFixed(0)}px/сек, время до первой монетки: ${timeToFirstCoin.toFixed(1)}сек`)
      }

      // Проверка и спавн всех сущностей по расстоянию (из единого массива SPAWN_DATA)
      this.checkSpawns()

      // Обновление коллекций (движение влево синхронно с фоном)
      // Коллекции должны двигаться с той же скоростью, что и фон
      // Используем ту же скорость, что передаётся в ParallaxBackground.update()
      const backgroundSpeed = this.currentSpeed
      for (let i = this.collectibles.length - 1; i >= 0; i--) {
        const collectible = this.collectibles[i]
        if (collectible.isActive && !collectible.isCollected) {
          // Обновляем коллекцию с той же скоростью, что и фон
          collectible.update(deltaMS, backgroundSpeed)
          
          // Удаляем коллекции, которые ушли за левый край экрана
          if (collectible.x + collectible.width < 0) {
            collectible.destroy()
            this.collectibles.splice(i, 1)
          }
        }
      }

      // Проверка коллизий с коллекциями
      this.checkCollectibleCollisions()

      // Обновление врагов (бегут навстречу игроку - движутся влево быстрее чем фон)
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const enemy = this.enemies[i]
        if (enemy.isActive) {
          enemy.update(deltaMS, backgroundSpeed)
          
          // Удаляем врагов, которые ушли за левый край экрана
          if (enemy.x + enemy.width < -100) {
            enemy.destroy()
            this.enemies.splice(i, 1)
          }
        }
      }

      // Обновление препятствий (движение влево синхронно с фоном)
      for (let i = this.obstacles.length - 1; i >= 0; i--) {
        const obstacle = this.obstacles[i]
        if (obstacle.isActive) {
          obstacle.update(deltaMS, backgroundSpeed)
          
          // Удаляем препятствия, которые ушли за левый край экрана
          if (obstacle.x + obstacle.width < 0) {
            obstacle.destroy()
            this.obstacles.splice(i, 1)
          }
        }
      }

      // Обновление финишной линии (движение влево синхронно с фоном)
      if (this.finishLine && this.finishLine.isActive) {
        this.finishLine.update(deltaMS, backgroundSpeed)
        
        // Проверка разрыва ленты и запуск замедления
        if (this.finishLine.isBroken && !this.isDecelerating) {
          this.startDeceleration()
        }
      }

      // Проверка коллизий с врагами, препятствиями и коллекциями
      this.checkCollisions()
      
      // Проверка триггера туториала перед первым врагом
      this.checkTutorialTrigger()
    }
  }

  /**
   * Проверка всех коллизий: враги, препятствия, коллекции
   * Основано на референсе: checkCollisions()
   */
  checkCollisions() {
    if (!this.player || !this.player.sprite) return

    const playerHitbox = this.player.getHitbox()
    if (!playerHitbox) return

    // Если игрок неуязвим - пропускаем проверку коллизий с врагами и препятствиями
    // В референсе используется break, что выходит из всего метода
    if (!this.player.isInvincible) {
      // Проверка коллизий с врагами
      for (const enemy of this.enemies) {
        if (!enemy.isActive) continue

        const enemyHitbox = enemy.getHitbox()
        if (rectanglesIntersect(playerHitbox, enemyHitbox)) {
          this.handlePlayerHit(enemy)
          return // Прерываем после первого столкновения
        }
      }

      // Проверка коллизий с препятствиями
      for (const obstacle of this.obstacles) {
        if (!obstacle.isActive) continue

        const obstacleHitbox = obstacle.getHitbox()
        if (rectanglesIntersect(playerHitbox, obstacleHitbox)) {
          this.handlePlayerHit(obstacle)
          return // Прерываем после первого столкновения
        }
      }
    }

    // Проверка коллизий с коллекциями (не зависит от неуязвимости)
    // Используем существующий метод checkCollectibleCollisions()
    this.checkCollectibleCollisions()
  }

  /**
   * Обработка попадания игрока во врага/препятствие
   * Основано на референсе: handlePlayerHit()
   * @param {Enemy|Obstacle} entity - Сущность, с которой столкнулся игрок
   */
  handlePlayerHit(entity) {
    // Проверка неуязвимости (дополнительная проверка на всякий случай)
    if (this.player.isInvincible) return

    // Уменьшаем HP
    this.hp--
    
    // Обновляем HP Display
    if (this.hpDisplay) {
      this.hpDisplay.updateHP(this.hp)
    }
    
    // Вызываем метод hurt у игрока (включает неуязвимость и анимацию)
    this.player.hurt()

    // Эмитим событие попадания
    this.emit('hit', { hp: this.hp, entity })

    // Если враг - запускаем анимацию атаки
    if (entity instanceof Enemy && entity.attack) {
      entity.attack()
    }
    
    // Примечание: препятствие (конус) уже пульсирует красным цветом постоянно

    // Проверка поражения
    if (this.hp <= 0) {
      this.handleLose()
    }

    console.log(`💥 Столкновение с ${entity.constructor.name}! HP: ${this.hp}`)
  }

  /**
   * Установка состояния игры
   * @param {string} newState - Новое состояние
   */
  setState(newState) {
    const oldState = this.state
    this.state = newState
    this.emit('stateChange', { from: oldState, to: newState })
    
    // Управление Tutorial Overlay в зависимости от состояния
    if (this.tutorialOverlay) {
      if (newState === CONSTANTS.STATES.INTRO) {
        // Показываем туториал при состоянии INTRO (тип 'start')
        this.tutorialOverlay.show('start')
      } else if (oldState === CONSTANTS.STATES.INTRO && newState === CONSTANTS.STATES.RUNNING) {
        // Скрываем туториал при переходе из INTRO в RUNNING
        this.tutorialOverlay.hide()
      } else if (oldState === CONSTANTS.STATES.PAUSED && newState === CONSTANTS.STATES.RUNNING) {
        // Скрываем туториал при возобновлении после паузы
        this.tutorialOverlay.hide()
      }
    }
  }

  /**
   * Запуск игры
   */
  start() {
    this.isRunning = true
    // Прыжки отключены до появления туториала про врага
    this.jumpingEnabled = false
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
   * Проверка триггера туториала перед первым врагом
   * Основано на референсе: checkTutorialTrigger()
   */
  checkTutorialTrigger() {
    // Если туториал уже был показан или нет tutorialEnemy - выходим
    if (this.tutorialTriggered || !this.tutorialEnemy || !this.player) return
    
    // Проверяем расстояние до tutorialEnemy
    const distance = this.tutorialEnemy.x - this.player.x
    
    // Если враг приблизился на расстояние меньше PAUSE_DISTANCE и еще не прошел мимо
    if (distance < CONSTANTS.TUTORIAL.PAUSE_DISTANCE && distance > 0) {
      console.log(`🎓 Триггер туториала: расстояние до врага = ${distance.toFixed(0)}px`)
      this.triggerTutorialPause('enemy')
    }
  }

  /**
   * Триггер паузы для показа туториала
   * Основано на референсе: triggerTutorialPause(type)
   * @param {string} type - Тип туториала: 'start' или 'enemy'
   */
  triggerTutorialPause(type) {
    // Помечаем что туториал был показан
    this.tutorialTriggered = true
    
    // Паузим игру
    this.isRunning = false
    
    // Останавливаем игрока (переключаем на idle)
    if (this.player && this.player.idle) {
      this.player.idle()
    }
    
    // Паузим фон
    if (this.parallaxBackground && this.parallaxBackground.pause) {
      this.parallaxBackground.pause()
    }
    
    // Останавливаем всех врагов
    this.enemies.forEach(enemy => {
      if (enemy.stop) {
        enemy.stop()
      }
    })
    
    // Переводим в состояние PAUSED
    this.setState(CONSTANTS.STATES.PAUSED)
    
    // Показываем туториал
    if (this.tutorialOverlay) {
      this.tutorialOverlay.show(type)
    }
    
    console.log(`⏸️ Пауза для туториала (тип: ${type})`)
  }

  /**
   * Возобновление после туториала
   * Основано на референсе: resumeFromTutorial()
   */
  resumeFromTutorial() {
    this.isRunning = true
    this.jumpingEnabled = true
    
    // Возобновляем фон
    if (this.parallaxBackground && this.parallaxBackground.resume) {
      this.parallaxBackground.resume()
    }
    
    // Запускаем игрока (переключаем на бег)
    if (this.player && this.player.startRunning) {
      this.player.startRunning()
    }
    
    // Запускаем всех врагов
    this.enemies.forEach(enemy => {
      if (enemy.play) {
        enemy.play()
      }
    })
    
    // Переводим в состояние RUNNING
    this.setState(CONSTANTS.STATES.RUNNING)
    
    // Выполняем прыжок игрока (как в референсе)
    if (this.player && this.player.jump) {
      this.player.jump()
    }
    
    this.emit('tutorialComplete')
    console.log(`▶️ Возобновление после туториала, игрок прыгает`)
  }

  /**
   * Запуск замедления перед финишем
   * Вызывается когда игрок разрывает ленту финиша
   */
  startDeceleration() {
    if (this.isDecelerating) return
    
    this.isDecelerating = true
    
    // Если финиш ещё не разорван, разрываем его
    if (this.finishLine && !this.finishLine.isBroken) {
      this.finishLine.breakTape()
    }
    
    // Переключаем игрока на idle анимацию при замедлении
    if (this.player && this.player.setAnimation) {
      this.player.setAnimation('idle')
    }
    
    this.emit('crossedFinish')
    console.log('🏁 Замедление запущено!')
  }

  /**
   * Обработка победы
   */
  handleWin() {
    this.isRunning = false
    
    // Переключаем игрока на idle анимацию при победе
    if (this.player && this.player.setAnimation) {
      this.player.setAnimation('idle')
    }
    
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

    // Обновляем Score Display
    if (this.scoreDisplay) {
      this.scoreDisplay.updateScore(this.score)
    }

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
