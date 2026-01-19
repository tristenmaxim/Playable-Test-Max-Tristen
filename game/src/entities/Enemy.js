/**
 * Enemy - класс анимированного врага
 * Основано на анализе из ../анализ/05_enemies_obstacles.md
 * Реализация анимации по аналогии с Player.js
 * Этап 9: Враги появляются и движутся
 */

import { AnimatedSprite, Spritesheet, Graphics } from 'pixi.js'
import { CONSTANTS } from '../core/Constants.js'

export class Enemy {
  // Координаты кадров анимаций из референса (atlas-упаковка)
  // Используем asset_0005.png (1682x1771) - спрайтшит врага
  // Структура: 5 строк с кадрами
  // 1 строка - 10 кадров (run анимация?)
  // 2 строка - 9 кадров
  // 3 строка - 9 кадров
  // 4 строка - 9 кадров
  // 5 строка - 7 кадров (attack анимация?)
  // Всего: 44 кадра
  // 
  // ВАЖНО: Нужно найти точные координаты из референса!
  // Пока используем вычисленные координаты на основе структуры
  static RUN_FRAMES = [
    // Строка 1: 10 кадров (run анимация) - frame_0 до frame_9
    // Точные координаты из референса (объект eq)
    { x: 3, y: 3, w: 174, h: 357 },        // frame_0
    { x: 182, y: 2, w: 145, h: 357 },      // frame_1
    { x: 333, y: 2, w: 183, h: 354 },      // frame_2
    { x: 520, y: 3, w: 146, h: 353 },      // frame_3
    { x: 672, y: 2, w: 134, h: 354 },      // frame_4
    { x: 812, y: 2, w: 145, h: 353 },      // frame_5
    { x: 963, y: 3, w: 163, h: 350 },      // frame_6
    { x: 1131, y: 3, w: 154, h: 348 },     // frame_7
    { x: 1290, y: 2, w: 150, h: 349 },     // frame_8
    { x: 1446, y: 3, w: 233, h: 336 }      // frame_9
  ]

  static ATTACK_FRAMES = [
    // Строка 5: 7 кадров (attack анимация) - frame_37 до frame_43
    // Точные координаты из референса (объект eq)
    { x: 3, y: 1455, w: 252, h: 309 },     // frame_37
    { x: 260, y: 1451, w: 230, h: 318 },   // frame_38
    { x: 496, y: 1441, w: 242, h: 325 },   // frame_39
    { x: 743, y: 1436, w: 264, h: 323 },   // frame_40
    { x: 1012, y: 1426, w: 190, h: 342 },  // frame_41
    { x: 1208, y: 1424, w: 167, h: 345 },  // frame_42
    { x: 1381, y: 1414, w: 226, h: 333 }   // frame_43
  ]

  constructor(app, assetLoader, x = 0, y = 0) {
    this.app = app
    this.assetLoader = assetLoader
    
    // Позиция
    this.x = x
    this.y = y
    
    // Спрайт
    this.sprite = null
    
    // Состояние
    this.isActive = true
    
    // Размеры (будут установлены после загрузки текстуры)
    this.width = 0
    this.height = 0
    
    // Анимации
    this.animations = {
      run: null,
      attack: null
    }
    
    // Z-Index
    this.zIndex = CONSTANTS.Z_INDEX.ENEMIES
    
    // Скорость анимации (увеличена для более динамичного бега)
    this.animationSpeed = 0.15
    
    // Флаг остановки (для паузы туториала)
    this.isStopped = false
  }

  /**
   * Инициализация врага
   */
  async init() {
    try {
      // Загрузка текстуры и создание анимаций
      await this.loadTexture()
      
      // Настройка позиции
      this.setupPosition()
    } catch (error) {
      console.error('Failed to initialize Enemy:', error)
      // Fallback - создаём простой спрайт-заглушку
      this.createFallbackSprite()
    }
  }

  /**
   * Загрузка текстуры врага и создание анимаций
   * Используем asset_0005.png (1682x1771) - спрайтшит врага
   */
  async loadTexture() {
    const texturePath = '../reference/reference_assets/data_uri_assets/asset_0005.png'
    console.log('Loading enemy sprite sheet from:', texturePath)
    
    try {
      const texture = await this.assetLoader.loadTexture(texturePath)
      console.log('✅ Текстура врага загружена, размер:', texture.width, 'x', texture.height)

      // Создаём все анимации
      await this.createAnimations(texture)
    } catch (error) {
      console.error('❌ Ошибка загрузки текстуры врага:', error)
      throw error
    }
  }

  /**
   * Создаёт все анимации из спрайт-листа
   * Использует координаты кадров из RUN_FRAMES, ATTACK_FRAMES
   * По аналогии с Player.js
   */
  async createAnimations(texture) {
    console.log('=== Создание анимаций врага (run: 10 кадров, attack: 7 кадров) - координаты из референса ===')

    // Собираем все кадры в один spritesheet
    const spritesheetData = {
      frames: {},
      meta: {
        image: '../reference/reference_assets/data_uri_assets/asset_0005.png',
        size: { w: 1682, h: 1771 },
        scale: 1
      }
    }

    // Добавляем run кадры
    Enemy.RUN_FRAMES.forEach((f, i) => {
      spritesheetData.frames[`run_${i}`] = {
        frame: { x: f.x, y: f.y, w: f.w, h: f.h },
        sourceSize: { w: f.w, h: f.h },
        spriteSourceSize: { x: 0, y: 0, w: f.w, h: f.h }
      }
    })

    // Добавляем attack кадры
    Enemy.ATTACK_FRAMES.forEach((f, i) => {
      spritesheetData.frames[`attack_${i}`] = {
        frame: { x: f.x, y: f.y, w: f.w, h: f.h },
        sourceSize: { w: f.w, h: f.h },
        spriteSourceSize: { x: 0, y: 0, w: f.w, h: f.h }
      }
    })

    try {
      // Создаем Spritesheet
      const spritesheet = new Spritesheet(texture, spritesheetData)
      await spritesheet.parse()

      console.log('✅ Spritesheet врага создан, текстуры:', Object.keys(spritesheet.textures).length)

      // Собираем текстуры для каждой анимации
      this.animations.run = this.getFrameTextures(spritesheet, 'run', Enemy.RUN_FRAMES.length)
      this.animations.attack = this.getFrameTextures(spritesheet, 'attack', Enemy.ATTACK_FRAMES.length)

      console.log(`✅ Анимации врага: run=${this.animations.run.length}, attack=${this.animations.attack.length}`)

      // Создаём AnimatedSprite с анимацией бега
      this.sprite = new AnimatedSprite(this.animations.run)
      this.sprite.animationSpeed = this.animationSpeed
      this.sprite.loop = true
      this.sprite.play()

      console.log('✅ Враг создан в состоянии run')

      // Настраиваем спрайт
      this.setupSprite()

    } catch (error) {
      console.error('❌ Ошибка создания Spritesheet врага:', error)
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
        console.warn(`⚠️ Текстура врага ${prefix}_${i} не найдена`)
      }
    }
    return frames
  }

  /**
   * Настройка спрайта врага
   */
  setupSprite() {
    if (!this.sprite) return

    // Anchor: низ по центру (0.5, 1) - как у игрока
    this.sprite.anchor.set(0.5, 1)
    
    // Масштабирование из оригинала: oe.SCALE * 1.3 = 0.54 * 1.3 = 0.702
    // Референс: const r=oe.SCALE*1.3;this.sprite.scale.set(-r,r)
    // Уменьшаем масштаб, так как враг должен быть меньше игрока
    const PLAYER_SCALE = 0.54 // Из референса: oe.SCALE
    const ENEMY_SCALE = PLAYER_SCALE * 0.8 // Уменьшено: враг должен быть меньше игрока (0.54 * 0.8 = 0.432)
    
    // Логируем размеры ДО масштабирования
    const originalWidth = this.sprite.width
    const originalHeight = this.sprite.height
    
    // Зеркальное отражение: враг должен смотреть влево (к игроку)
    // Отрицательный масштаб по X для отражения, положительный по Y
    this.sprite.scale.set(-ENEMY_SCALE, ENEMY_SCALE)
    
    // Сохраняем размеры для коллизий (после масштабирования)
    this.width = Math.abs(this.sprite.width) // Абсолютное значение, т.к. scale.x отрицательный
    this.height = this.sprite.height
    
    // Z-Index для правильного порядка отрисовки
    this.sprite.zIndex = this.zIndex
    
    console.log(`✅ Спрайт врага настроен:`, {
      originalSize: `${originalWidth}x${originalHeight}`,
      finalSize: `${this.width.toFixed(1)}x${this.height.toFixed(1)}`,
      scale: ENEMY_SCALE,
      expectedSize: `${(originalWidth * ENEMY_SCALE).toFixed(1)}x${(originalHeight * ENEMY_SCALE).toFixed(1)}`
    })
  }

  /**
   * Настройка позиции врага
   */
  setupPosition() {
    if (!this.sprite) {
      return
    }

    // Позиция по X и Y
    this.sprite.x = this.x
    this.sprite.y = this.y
    
    console.log(`Enemy positioned at:`, { x: this.sprite.x, y: this.sprite.y })
  }

  /**
   * Создание fallback спрайта при ошибке загрузки
   */
  createFallbackSprite() {
    const graphics = new Graphics()
    const width = 60
    const height = 100
    
    // Рисуем простой прямоугольник (враг)
    graphics.rect(-width / 2, -height, width, height)
    graphics.fill(0xFF0000) // Красный цвет для врага
    
    graphics.zIndex = this.zIndex
    
    this.sprite = graphics
    this.width = width
    this.height = height
    this.setupPosition()
    
    console.warn('Используется fallback спрайт врага')
  }

  /**
   * Обновление врага
   * Враги бегут навстречу игроку (движутся влево быстрее чем фон)
   * @param {number} deltaMS - Время с последнего кадра в миллисекундах
   * @param {number} backgroundSpeed - Скорость фона (пикселей/сек)
   */
  update(deltaMS, backgroundSpeed = 0) {
    if (!this.sprite || !this.isActive) return
    
    // Если враг остановлен (пауза туториала) - не обновляем движение
    if (this.isStopped) {
      return
    }
    
    // Враг бежит навстречу игроку
    // Движется влево вместе с фоном, но дополнительно движется влево со своей скоростью
    // чтобы приближаться к игроку
    const ENEMY_RUN_SPEED = 150 // Дополнительная скорость врага (пикселей/сек) - движется влево быстрее
    const deltaSeconds = deltaMS / 1000
    
    // Движение влево: фон + дополнительная скорость врага
    const deltaX = (backgroundSpeed + ENEMY_RUN_SPEED) * deltaSeconds
    this.x -= deltaX // Движение влево (навстречу игроку)
    this.sprite.x = this.x
    
    // Анимация проигрывается автоматически через AnimatedSprite
  }

  /**
   * Получение хитбокса для коллизий
   * Основано на референсе: использует ENEMY_SCALE и ENEMY_OFFSET для уменьшения хитбокса
   * @returns {Object} Прямоугольник хитбокса
   */
  getHitbox() {
    if (!this.sprite || !this.isActive) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }

    // Получаем реальные границы спрайта (учитывая anchor и позицию)
    const bounds = this.sprite.getBounds()
    
    // Применяем масштаб для хитбокса (из референса: ENEMY_SCALE)
    const hitboxWidth = bounds.width * CONSTANTS.HITBOX.ENEMY_SCALE.X  // 30% ширины
    const hitboxHeight = bounds.height * CONSTANTS.HITBOX.ENEMY_SCALE.Y  // 50% высоты
    
    // Вычисляем смещение для центрирования хитбокса по X
    const offsetX = (bounds.width - hitboxWidth) / 2
    
    // Вычисляем смещение для позиционирования хитбокса по Y (от низа спрайта)
    const offsetY = bounds.height - hitboxHeight
    
    // Применяем дополнительные смещения из референса (ENEMY_OFFSET)
    const finalOffsetX = bounds.width * CONSTANTS.HITBOX.ENEMY_OFFSET.X  // 0
    const finalOffsetY = bounds.height * CONSTANTS.HITBOX.ENEMY_OFFSET.Y  // 0.2 (вниз на 20%)
    
    return {
      x: bounds.x + offsetX + finalOffsetX,
      y: bounds.y + offsetY + finalOffsetY,
      width: hitboxWidth,
      height: hitboxHeight
    }
  }

  /**
   * Остановка врага (пауза анимации и движения)
   * Используется при паузе туториала
   */
  stop() {
    if (!this.sprite) return
    
    // Останавливаем анимацию
    if (this.sprite.stop) {
      this.sprite.stop()
    }
    
    // Помечаем как остановленного
    this.isStopped = true
    
    console.log('⏸️ Враг остановлен (пауза)')
  }

  /**
   * Возобновление врага (запуск анимации и движения)
   * Используется после паузы туториала
   */
  play() {
    if (!this.sprite) return
    
    // Запускаем анимацию обратно
    if (this.sprite.play) {
      this.sprite.play()
    }
    
    // Снимаем флаг остановки
    this.isStopped = false
    
    console.log('▶️ Враг возобновлен')
  }

  /**
   * Запуск анимации атаки
   * Вызывается при столкновении с игроком
   */
  attack() {
    if (!this.sprite || !this.animations.attack) return
    
    // Переключаем на анимацию атаки
    this.sprite.textures = this.animations.attack
    this.sprite.loop = false
    this.sprite.play()
    
    // После завершения анимации возвращаемся к бегу
    this.sprite.onComplete = () => {
      if (this.sprite && this.animations.run) {
        this.sprite.textures = this.animations.run
        this.sprite.loop = true
        this.sprite.play()
      }
    }
  }

  /**
   * Уничтожение врага
   */
  destroy() {
    this.isActive = false
    if (this.sprite) {
      this.sprite.destroy()
      this.sprite = null
    }
  }
}
