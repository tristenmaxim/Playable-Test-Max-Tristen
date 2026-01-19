/**
 * Player - класс игрока
 * Основано на анализе из ../анализ/03_player.md
 * Реализация анимации на основе рабочего кода из тестового задания
 * Этап 2: Игрок с анимацией idle
 */

import { AnimatedSprite, Spritesheet, Graphics } from 'pixi.js'
import { CONSTANTS } from '../core/Constants.js'

export class Player {
  // Координаты кадров анимаций из референса (atlas-упаковка)
  // Используем те же координаты, что и в рабочем коде для hero.png (932x1506)
  static IDLE_FRAMES = [
    { x: 301, y: 245, w: 128, h: 254 },
    { x: 283, y: 746, w: 128, h: 254 },
    { x: 413, y: 746, w: 128, h: 254 },
    { x: 671, y: 469, w: 128, h: 254 },
    { x: 673, y: 725, w: 128, h: 254 },
    { x: 1, y: 1244, w: 129, h: 255 },
    { x: 691, y: 208, w: 129, h: 255 },
    { x: 535, y: 1002, w: 128, h: 255 },
    { x: 431, y: 214, w: 128, h: 256 },
    { x: 561, y: 211, w: 128, h: 256 },
    { x: 132, y: 1244, w: 128, h: 256 },
    { x: 541, y: 472, w: 128, h: 255 },
    { x: 404, y: 1002, w: 129, h: 255 },
    { x: 543, y: 729, w: 128, h: 255 },
    { x: 803, y: 465, w: 128, h: 254 },
    { x: 803, y: 721, w: 128, h: 254 },
    { x: 803, y: 977, w: 128, h: 254 },
    { x: 673, y: 981, w: 128, h: 254 }
  ]

  static RUN_FRAMES = [
    { x: 1, y: 491, w: 149, h: 246 },
    { x: 412, y: 501, w: 127, h: 243 },
    { x: 524, y: 1259, w: 128, h: 246 },
    { x: 1, y: 991, w: 135, h: 251 },
    { x: 171, y: 1, w: 160, h: 242 },
    { x: 138, y: 998, w: 132, h: 243 },
    { x: 665, y: 1237, w: 128, h: 249 },
    { x: 146, y: 748, w: 135, h: 248 }
  ]

  static JUMP_FRAMES = [
    { x: 803, y: 1233, w: 128, h: 252 },
    { x: 394, y: 1259, w: 128, h: 242 },
    { x: 170, y: 246, w: 129, h: 243 },
    { x: 272, y: 1002, w: 130, h: 251 },
    { x: 333, y: 1, w: 169, h: 211 },
    { x: 504, y: 1, w: 169, h: 208 },
    { x: 675, y: 1, w: 167, h: 205 },
    { x: 262, y: 1255, w: 130, h: 246 },
    { x: 394, y: 1259, w: 128, h: 242 },
    { x: 282, y: 501, w: 128, h: 243 }
  ]

  constructor(app, assetLoader, groundY = null) {
    this.app = app
    this.assetLoader = assetLoader
    
    // Спрайт игрока
    this.sprite = null
    
    // Позиция
    this.x = window.innerWidth * 0.18 // Фиксированная позиция по X (18% от ширины экрана, как в референсе: oe.X_POSITION = 0.18)
    // Используем переданный groundY или вычисляем из констант
    // groundY должен быть roadY из ParallaxBackground (где стоят кусты)
    this.y = groundY || CONSTANTS.POSITIONS.GROUND_Y
    
    // Состояние (для будущих этапов)
    this.isOnGround = true
    this.isInvincible = false
    this.invincibilityTimer = 0 // Таймер неуязвимости
    this.state = 'idle' // Текущее состояние анимации
    this.currentAnimation = 'idle' // Текущая анимация (для проверки в update)
    this.gameStarted = false // Флаг начала игры
    
    // Физика прыжков
    this.velocityY = 0 // Вертикальная скорость (не используется для синусоидального прыжка)
    // Синусоидальная траектория прыжка (как в референсе)
    this.isJumping = false
    this.jumpStartY = this.y
    this.jumpProgress = 0
    
    // Анимации
    this.animations = {
      idle: null,
      run: null,
      jump: null
    }
    
    // Z-Index
    this.zIndex = CONSTANTS.Z_INDEX.PLAYER
  }

  /**
   * Инициализация игрока
   */
  async init() {
    try {
      // Загрузка текстуры и создание анимаций
      await this.loadTexture()
      
      // Настройка позиции
      this.setupPosition()
    } catch (error) {
      console.error('Failed to initialize Player:', error)
      // Fallback - создаём простой спрайт-заглушку
      this.createFallbackSprite()
    }
  }

  /**
   * Загрузка текстуры игрока и создание анимаций
   * Используем asset_0004.png (932x1506) - это тот же файл, что и hero.png в рабочем коде
   */
  async loadTexture() {
    // Используем asset_0004.png из референса (sprite sheet игрока)
    // Путь относительно HTML файла (index.html в game/)
    const texturePath = '../reference/reference_assets/data_uri_assets/asset_0004.png'
    console.log('Loading player sprite sheet from:', texturePath)
    
    try {
      const texture = await this.assetLoader.loadTexture(texturePath)
      console.log('✅ Текстура героя загружена, размер:', texture.width, 'x', texture.height)

      // Создаём все анимации
      await this.createAnimations(texture)
    } catch (error) {
      console.error('❌ Ошибка загрузки текстуры героя:', error)
      throw error
    }
  }

  /**
   * Создаёт все анимации из спрайт-листа
   * Использует точные координаты кадров из IDLE_FRAMES, RUN_FRAMES, JUMP_FRAMES
   */
  async createAnimations(texture) {
    console.log('=== Создание анимаций (idle: 18, run: 8, jump: 10 кадров) ===')

    // Собираем все кадры в один spritesheet
    const spritesheetData = {
      frames: {},
      meta: {
        image: '../reference/reference_assets/data_uri_assets/asset_0004.png',
        size: { w: 932, h: 1506 },
        scale: 1
      }
    }

    // Добавляем idle кадры
    Player.IDLE_FRAMES.forEach((f, i) => {
      spritesheetData.frames[`idle_${i}`] = {
        frame: { x: f.x, y: f.y, w: f.w, h: f.h },
        sourceSize: { w: f.w, h: f.h },
        spriteSourceSize: { x: 0, y: 0, w: f.w, h: f.h }
      }
    })

    // Добавляем run кадры
    Player.RUN_FRAMES.forEach((f, i) => {
      spritesheetData.frames[`run_${i}`] = {
        frame: { x: f.x, y: f.y, w: f.w, h: f.h },
        sourceSize: { w: f.w, h: f.h },
        spriteSourceSize: { x: 0, y: 0, w: f.w, h: f.h }
      }
    })

    // Добавляем jump кадры
    Player.JUMP_FRAMES.forEach((f, i) => {
      spritesheetData.frames[`jump_${i}`] = {
        frame: { x: f.x, y: f.y, w: f.w, h: f.h },
        sourceSize: { w: f.w, h: f.h },
        spriteSourceSize: { x: 0, y: 0, w: f.w, h: f.h }
      }
    })

    try {
      // Создаем Spritesheet
      const spritesheet = new Spritesheet(texture, spritesheetData)
      await spritesheet.parse()

      console.log('✅ Spritesheet создан, текстуры:', Object.keys(spritesheet.textures).length)

      // Собираем текстуры для каждой анимации
      this.animations.idle = this.getFrameTextures(spritesheet, 'idle', Player.IDLE_FRAMES.length)
      this.animations.run = this.getFrameTextures(spritesheet, 'run', Player.RUN_FRAMES.length)
      this.animations.jump = this.getFrameTextures(spritesheet, 'jump', Player.JUMP_FRAMES.length)

      console.log(`✅ Анимации: idle=${this.animations.idle.length}, run=${this.animations.run.length}, jump=${this.animations.jump.length}`)

      // Создаём AnimatedSprite с idle анимацией
      this.sprite = new AnimatedSprite(this.animations.idle)
      this.sprite.animationSpeed = 0.12
      this.sprite.loop = true
      this.sprite.play()

      console.log('✅ Игрок создан в состоянии idle')

      // Настраиваем спрайт
      this.setupSprite()

    } catch (error) {
      console.error('❌ Ошибка создания Spritesheet:', error)
      throw error
    }
  }

  /**
   * Получает текстуры кадров для анимации
   */
  getFrameTextures(spritesheet, prefix, count) {
    const frames = []
    for (let i = 0; i < count; i++) {
      const frameTexture = spritesheet.textures[`${prefix}_${i}`]
      if (frameTexture) {
        frames.push(frameTexture)
      } else {
        console.warn(`⚠️ Текстура ${prefix}_${i} не найдена`)
      }
    }
    return frames
  }

  /**
   * Настройка спрайта игрока
   */
  setupSprite() {
    if (!this.sprite) return

    // Референс использует фиксированный масштаб oe.SCALE = 0.54
    // НЕ пропорциональный расчет, а фиксированное значение!
    // В референсе: sprite.scale.set(oe.SCALE) где oe.SCALE = 0.54
    // Увеличено на 15%: 0.54 * 1.15 = 0.621
    const PLAYER_SCALE = 0.621 // Увеличен на 15% относительно референса (0.54 * 1.15)
    
    this.sprite.scale.set(PLAYER_SCALE, PLAYER_SCALE)

    // Anchor: центр по X, низ по Y (из анализа)
    this.sprite.anchor.set(0.5, 1)

    // Z-Index для правильного порядка отрисовки
    this.sprite.zIndex = this.zIndex

    console.log('✅ Спрайт героя настроен:', {
      scale: PLAYER_SCALE,
      finalWidth: this.sprite.width * PLAYER_SCALE,
      finalHeight: this.sprite.height * PLAYER_SCALE,
      screenHeight: window.innerHeight
    })
  }

  /**
   * Настройка позиции игрока
   */
  setupPosition() {
    if (!this.sprite) {
      return
    }

    // Позиция по X: фиксированная (20% от ширины экрана)
    this.sprite.x = this.x
    
    // Позиция по Y: на земле (roadY из ParallaxBackground)
    // Anchor (0.5, 1) означает, что низ спрайта будет в точке this.y
    this.sprite.y = this.y
    
    console.log('Player positioned at:', { x: this.sprite.x, y: this.sprite.y, groundY: this.y })
  }

  /**
   * Создание fallback спрайта при ошибке загрузки
   */
  createFallbackSprite() {
    const graphics = new Graphics()
    const width = 50
    const height = 100
    
    // Рисуем прямоугольник так, чтобы его центр по X был в 0, а низ по Y был в 0
    // Это имитирует anchor (0.5, 1)
    graphics.rect(-width / 2, -height, width, height)
    graphics.fill(0xFF6B9D) // Розовый цвет для видимости
    
    graphics.zIndex = this.zIndex
    
    this.sprite = graphics
    this.setupPosition()
    
    console.warn('Используется fallback спрайт игрока')
  }

  /**
   * Переключение анимации
   */
  setAnimation(name) {
    if (!this.sprite || !this.animations[name]) return
    if (this.state === name) return

    const oldState = this.state
    this.state = name
    this.currentAnimation = name // Обновляем currentAnimation

    // Сохраняем текущий масштаб и позицию
    const scaleX = this.sprite.scale.x
    const scaleY = this.sprite.scale.y
    const x = this.sprite.x
    const y = this.sprite.y

    // Меняем текстуры
    this.sprite.textures = this.animations[name]

    // Настройки анимации в зависимости от состояния
    if (name === 'idle') {
      this.sprite.animationSpeed = 0.12
      this.sprite.loop = true
    } else if (name === 'run') {
      this.sprite.animationSpeed = 0.2
      this.sprite.loop = true
    } else if (name === 'jump') {
      this.sprite.animationSpeed = 0.25
      this.sprite.loop = false
    }
    
    // Запускаем анимацию с начала
    this.sprite.gotoAndPlay(0)

    // Восстанавливаем масштаб и позицию
    this.sprite.scale.set(scaleX, scaleY)
    this.sprite.x = x
    this.sprite.y = y

    this.sprite.gotoAndPlay(0)
    console.log(`Анимация: ${oldState} → ${name}`)
  }

  /**
   * Запуск игры (первое нажатие) - переключение на анимацию бега
   */
  startRunning() {
    if (this.gameStarted) return
    this.gameStarted = true
    this.setAnimation('run')
    console.log('🏃 Игрок начал бежать!')
  }

  /**
   * Прыжок игрока (синусоидальная траектория как в референсе)
   */
  jump() {
    if (!this.sprite) return
    
    // Если игра ещё не началась, запускаем бег
    if (!this.gameStarted) {
      this.startRunning()
      return
    }
    
    // Прыгаем только если на земле и не прыгаем уже
    if (this.isOnGround && !this.isJumping) {
      this.isJumping = true
      this.jumpStartY = this.sprite.y
      this.jumpProgress = 0
      this.isOnGround = false
      this.setAnimation('jump')
      console.log('🦘 Игрок прыгнул!')
    }
  }

  /**
   * Обновление игрока
   * @param {number} deltaMS - Время с последнего кадра в миллисекундах
   */
  update(deltaMS) {
    // Обновляем только если игра началась и спрайт существует
    // Если состояние idle - тоже обновляем (для анимации idle)
    if (!this.sprite) return
    if (!this.gameStarted && this.state !== 'idle') return
    
    // Обновление неуязвимости
    if (this.isInvincible) {
      this.invincibilityTimer -= deltaMS
      if (this.invincibilityTimer <= 0) {
        this.isInvincible = false
        this.invincibilityTimer = 0
        // Восстанавливаем нормальную прозрачность
        if (this.sprite) {
          this.sprite.alpha = 1
        }
      } else {
        // Мигание во время неуязвимости (мигание каждые 100мс)
        if (this.sprite) {
          const blinkRate = 100 // мс
          this.sprite.alpha = Math.floor(this.invincibilityTimer / blinkRate) % 2 === 0 ? 0.5 : 1
        }
      }
    }
    
    // Синусоидальная траектория прыжка (как в референсе)
    if (this.isJumping) {
      // Увеличиваем прогресс прыжка от 0 до 1 за JUMP_DURATION
      this.jumpProgress += deltaMS / CONSTANTS.PHYSICS.JUMP_DURATION
      
      if (this.jumpProgress >= 1) {
        // Прыжок завершен
        this.isJumping = false
        this.sprite.y = this.y // Возвращаем на землю
        this.jumpProgress = 0
        this.isOnGround = true
        
        // Переключаемся на бег если была анимация прыжка
        if (this.state === 'jump' || this.currentAnimation === 'jump') {
          this.setAnimation('run')
        }
      } else {
        // Вычисляем позицию Y по синусоиде
        // Формула из референса: y = jumpStartY - sin(jumpProgress * PI) * JUMP_HEIGHT
        const jumpOffset = Math.sin(this.jumpProgress * Math.PI) * CONSTANTS.PHYSICS.JUMP_HEIGHT
        this.sprite.y = this.jumpStartY - jumpOffset
      }
    }
  }

  /**
   * Обработка получения урона
   * Запускает анимацию hurt, включает неуязвимость
   */
  hurt() {
    if (this.isInvincible) return // Уже неуязвим
    
    // Включаем неуязвимость
    this.isInvincible = true
    this.invincibilityTimer = CONSTANTS.HEALTH.INVINCIBILITY_DURATION
    
    // TODO: В будущем добавить анимацию hurt, если она есть в спрайтшите
    // Пока просто мигание будет через update()
    
    console.log('💔 Игрок получил урон! Неуязвимость на', CONSTANTS.HEALTH.INVINCIBILITY_DURATION, 'мс')
  }

  /**
   * Получение хитбокса для коллизий
   * Основано на референсе: использует PLAYER_SCALE и PLAYER_OFFSET для уменьшения хитбокса
   * @returns {Object} Прямоугольник хитбокса
   */
  getHitbox() {
    if (!this.sprite) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }

    // Получаем реальные границы спрайта (учитывая anchor и позицию)
    const bounds = this.sprite.getBounds()
    
    // Применяем масштаб для хитбокса (из референса: PLAYER_SCALE)
    const hitboxWidth = bounds.width * CONSTANTS.HITBOX.PLAYER_SCALE.X  // 25% ширины
    const hitboxHeight = bounds.height * CONSTANTS.HITBOX.PLAYER_SCALE.Y  // 70% высоты
    
    // Вычисляем смещение для центрирования хитбокса по X
    const offsetX = (bounds.width - hitboxWidth) / 2
    
    // Вычисляем смещение для позиционирования хитбокса по Y (от низа спрайта)
    const offsetY = bounds.height - hitboxHeight
    
    // Применяем дополнительные смещения из референса (PLAYER_OFFSET)
    const finalOffsetX = bounds.width * CONSTANTS.HITBOX.PLAYER_OFFSET.X  // 0
    const finalOffsetY = bounds.height * CONSTANTS.HITBOX.PLAYER_OFFSET.Y  // -0.15 (вверх на 15%)
    
    return {
      x: bounds.x + offsetX + finalOffsetX,
      y: bounds.y + offsetY + finalOffsetY,
      width: hitboxWidth,
      height: hitboxHeight
    }
  }

  /**
   * Сброс игрока в начальное состояние (для будущих этапов)
   */
  reset(groundY = null) {
    this.x = window.innerWidth * 0.18
    this.y = groundY || this.y || CONSTANTS.POSITIONS.GROUND_Y
    this.isOnGround = true
    this.isInvincible = false
    this.gameStarted = false
    this.velocityY = 0
    
    if (this.sprite) {
      this.setAnimation('idle')
      this.setupPosition()
    }
  }
}
