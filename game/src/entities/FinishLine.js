/**
 * FinishLine - класс финишной линии
 * Основано на анализе из ../анализ/17_finish_line.md
 * Этап 13: Финишная линия появляется и завершает игру
 * 
 * Финиш состоит из:
 * - Столбы финиша (sprite)
 * - Лента между столбами (tapeSprite)
 * - Анимация разрыва ленты при достижении игроком
 */

import { Sprite, Graphics, Container } from 'pixi.js'
import { CONSTANTS } from '../core/Constants.js'

export class FinishLine {
  constructor(app, assetLoader, x = 0, y = 0) {
    this.app = app
    this.assetLoader = assetLoader
    
    // Позиция
    this.x = x
    this.y = y
    
    // Контейнер для всех элементов финиша
    this.container = null
    
    // Спрайты
    this.sprite = null // Столбы финиша (asset_0010.png)
    this.tapeSprite = null // Лента между столбами (пока fallback, потом будет отдельная текстура)
    this.floorPattern = null // Шахматная доска на земле (отдельный элемент с низким z-index)
    
    // Текстуры
    this.finishTexture = null
    this.floorPatternTexture = null
    
    // X координата разрыва ленты (относительно игрока)
    // Когда игрок достигает этой позиции, лента разрывается
    this.tapeBreakX = 0
    
    // Состояние
    this.isActive = false
    this.isBroken = false // Флаг разрыва ленты
    
    // Анимация разрыва ленты
    this.breakAnimation = {
      isAnimating: false,
      startTime: 0,
      duration: 500, // 500ms как в референсе
      startY: 0,
      startRotation: 0,
      targetY: 0,
      targetRotation: 0
    }
    
    // Размеры (будут установлены после загрузки текстуры)
    this.width = 0
    this.height = 0
    
    // Z-Index
    this.zIndex = CONSTANTS.Z_INDEX.FINISH_LINE
    
    // Ссылка на игрока (для проверки достижения ленты)
    this.player = null
  }

  /**
   * Инициализация финишной линии
   */
  async init() {
    try {
      // Загрузка текстур
      await this.loadTextures()
      
      // Проверяем, загрузилась ли текстура
      if (!this.finishTexture) {
        console.warn('⚠️ Текстура финиша не загружена, используем fallback')
        this.createFallbackSprites()
        this.setupPosition()
        this.calculateTapeBreakX()
        return
      }
      
      // Создание спрайтов
      this.createSprites()
      
      // Проверяем, что спрайты созданы
      if (!this.container || !this.sprite) {
        console.error('❌ Не удалось создать спрайты финиша, используем fallback')
        this.createFallbackSprites()
        this.setupPosition()
        this.calculateTapeBreakX()
        return
      }
      
      // Настройка позиции
      this.setupPosition()
      
      // Вычисление позиции разрыва ленты
      this.calculateTapeBreakX()
    } catch (error) {
      console.error('❌ Ошибка инициализации FinishLine:', error)
      console.error('Стек ошибки:', error.stack)
      // Fallback - создаём простые спрайты-заглушки
      this.createFallbackSprites()
      if (this.container) {
        this.setupPosition()
        this.calculateTapeBreakX()
      }
    }
  }

  /**
   * Загрузка текстур финиша
   * asset_0010.png - финишная черта (столбы финиша)
   * asset_0011.png или asset_0012.png - шахматная доска на земле
   */
  async loadTextures() {
    // Загружаем текстуру финиша из референса
    const finishPath = '../reference/reference_assets/data_uri_assets/asset_0010.png'
    // Пробуем найти текстуру шахматной доски (может быть asset_0011 или asset_0012)
    const floorPatternPath = '../reference/reference_assets/data_uri_assets/asset_0011.png'
    
    console.log('🔄 Загрузка текстур финиша:', { finishPath, floorPatternPath })
    
    try {
      this.finishTexture = await this.assetLoader.loadTexture(finishPath)
      
      if (!this.finishTexture) {
        throw new Error('Текстура финиша не загружена (null)')
      }
      
      console.log(`✅ Текстура финиша загружена успешно:`, {
        width: this.finishTexture.width,
        height: this.finishTexture.height,
        valid: this.finishTexture.width > 0 && this.finishTexture.height > 0
      })
    } catch (error) {
      console.error('❌ Ошибка загрузки текстуры финиша:', error)
      this.finishTexture = null
    }
    
    // Загружаем текстуру шахматной доски
    try {
      this.floorPatternTexture = await this.assetLoader.loadTexture(floorPatternPath)
      console.log(`✅ Текстура шахматной доски загружена:`, {
        width: this.floorPatternTexture.width,
        height: this.floorPatternTexture.height
      })
    } catch (error) {
      console.warn('⚠️ Не удалось загрузить текстуру шахматной доски, создадим fallback')
      this.floorPatternTexture = null
    }
  }

  /**
   * Создание спрайтов финиша
   * Использует asset_0010.png для столбов финиша
   */
  createSprites() {
    if (!this.finishTexture) {
      console.warn('⚠️ Finish texture not loaded, using fallback')
      this.createFallbackSprites()
      return
    }

    console.log('✅ Создание спрайтов финиша с текстурой:', {
      textureWidth: this.finishTexture.width,
      textureHeight: this.finishTexture.height,
      textureValid: this.finishTexture.width > 0 && this.finishTexture.height > 0
    })

    // Создаём контейнер для всех элементов
    this.container = new Container()
    this.container.zIndex = this.zIndex
    this.container.visible = true
    this.container.alpha = 1
    
    // Референс: floorPattern.y = a - 80, где a = Me - oe.GROUND_Y (roadY)
    // Шахматная доска должна быть на земле ПОД игроком с z-index 5
    // Создаём шахматную доску на земле
    if (this.floorPatternTexture) {
      this.floorPattern = new Sprite(this.floorPatternTexture)
      this.floorPattern.anchor.set(0.5, 0.5) // Центр (как в референсе)
      this.floorPattern.scale.set(2) // Референс: scale.set(2)
      this.floorPattern.zIndex = CONSTANTS.Z_INDEX.FINISH_LINE_GROUND // z-index 5 в оригинале, у нас 15
      this.floorPattern.visible = true
      this.floorPattern.alpha = 1
      // Позиция: на земле, немного выше roadY (y = roadY - 80 в оригинале)
      // Но так как контейнер уже на roadY, позиция относительно контейнера будет отрицательной
      this.floorPattern.x = 0 // Центр по X
      this.floorPattern.y = -80 // На 80px выше roadY (относительно контейнера)
      this.container.addChild(this.floorPattern)
    } else {
      // Fallback - создаём шахматную доску через Graphics
      const checkerboardSize = 200
      const checkerSize = 20
      const checkerboardGraphics = new Graphics()
      
      // Рисуем шахматную доску
      for (let i = 0; i < checkerboardSize / checkerSize; i++) {
        for (let j = 0; j < checkerboardSize / checkerSize; j++) {
          const color = (i + j) % 2 === 0 ? 0xFFFFFF : 0x000000
          checkerboardGraphics.rect(
            -checkerboardSize / 2 + i * checkerSize,
            -checkerboardSize / 2 + j * checkerSize,
            checkerSize,
            checkerSize
          )
          checkerboardGraphics.fill(color)
        }
      }
      
      this.floorPattern = checkerboardGraphics
      this.floorPattern.zIndex = CONSTANTS.Z_INDEX.FINISH_LINE_GROUND
      this.floorPattern.visible = true
      this.floorPattern.alpha = 1
      this.floorPattern.x = 0
      this.floorPattern.y = -80
      this.container.addChild(this.floorPattern)
    }
    
    // Создаём спрайт финиша из текстуры (как в референсе)
    // Столбы должны быть выше шахматной доски, но все равно под игроком
    this.sprite = new Sprite(this.finishTexture)
    this.sprite.anchor.set(0.5, 1) // Привязка к низу (как в референсе)
    this.sprite.zIndex = this.zIndex // z-index 24 (ниже игрока 30)
    this.sprite.visible = true
    this.sprite.alpha = 1
    
    // Масштабирование для правильного размера
    // Референс: финиш должен быть небольшим элементом, сопоставимым по размеру с игроком
    // В оригинале: высота ленты примерно на уровне пояса игрока, ширина в 2-3 раза больше ширины игрока
    // Игрок имеет масштаб 0.54 и высоту кадра ~254px → ~137px на экране
    // Финиш должен быть примерно такой же высоты или чуть выше игрока
    // Используем фиксированный масштаб, как у игрока, или небольшой пропорциональный расчет
    
    // Референс: финиш должен быть видимым элементом
    // Проверяем размер текстуры и подбираем масштаб так, чтобы финиш был виден
    // Если текстура очень большая, нужен меньший масштаб
    // Если текстура маленькая, нужен больший масштаб
    const textureWidth = this.finishTexture.width
    const textureHeight = this.finishTexture.height
    
    // Референс: финиш должен быть примерно такого же размера как игрок или чуть больше
    // Игрок имеет масштаб 0.54 и высоту спрайта ~1506px → ~813px на экране
    // Финиш должен быть видимым, поэтому используем масштаб, который даст разумный размер
    // Если текстура большая (например, 500px), то масштаб 0.5 даст 250px - это нормально
    // Если текстура маленькая (например, 100px), то масштаб 2.0 даст 200px - это тоже нормально
    
    // Используем фиксированный масштаб, но проверяем результат
    let FINISH_SCALE = 0.5 // Увеличено с 0.35 для лучшей видимости
    
    // Если текстура очень большая, уменьшаем масштаб
    if (textureHeight > 1000) {
      FINISH_SCALE = 0.3
    } else if (textureHeight > 500) {
      FINISH_SCALE = 0.4
    } else if (textureHeight < 200) {
      FINISH_SCALE = 1.0 // Если текстура маленькая, увеличиваем масштаб
    }
    
    this.sprite.scale.set(FINISH_SCALE, FINISH_SCALE)
    
    console.log(`📏 Масштабирование финиша:`, {
      textureSize: `${this.finishTexture.width}x${this.finishTexture.height}`,
      scale: FINISH_SCALE,
      finalSize: `${(this.finishTexture.width * FINISH_SCALE).toFixed(0)}x${(this.finishTexture.height * FINISH_SCALE).toFixed(0)}`,
      playerScale: 0.54,
      comparison: `Финиш масштабирован в ${(0.54 / FINISH_SCALE).toFixed(2)} раза меньше игрока`
    })
    
    // Лента между столбами (fallback - простой прямоугольник, пока нет текстуры)
    // Ширина ленты должна быть примерно равна ширине финиша
    const finishWidth = this.sprite.width // Используем уже масштабированную ширину
    const tapeWidth = finishWidth * 0.8 // Лента немного уже финиша
    const tapeHeight = 20 // Высота ленты
    const tapeGraphics = new Graphics()
    tapeGraphics.rect(-tapeWidth / 2, -tapeHeight / 2, tapeWidth, tapeHeight)
    tapeGraphics.fill(0xFFD700) // Золотой цвет
    tapeGraphics.stroke({ width: 2, color: 0xFFA500 }) // Оранжевая обводка
    
    // Создаём спрайт ленты
    this.tapeSprite = tapeGraphics
    // Anchor (0.5, 0.5) - центр (для Graphics это через позиционирование)
    this.tapeSprite.zIndex = this.zIndex + 1 // Лента выше столбов
    
    // Позиция ленты (выше финиша)
    // Используем высоту спрайта финиша для позиционирования ленты (уже масштабированную)
    // Референс: лента должна быть примерно на уровне пояса игрока
    const finishHeight = this.sprite.height
    // Лента должна быть в верхней части финиша, примерно на 70-80% высоты от низа
    const tapeYOffset = -finishHeight * 0.75 // Лента на 75% высоты финиша от низа
    
    // Позиционируем столбы (anchor 0.5, 1 - центр по X, низ по Y)
    this.sprite.x = 0
    this.sprite.y = 0 // Низ столбов в точке (0, 0) контейнера
    
    // Добавляем спрайты в контейнер
    this.container.addChild(this.sprite)
    this.container.addChild(this.tapeSprite)
    
    // Сохраняем размеры для коллизий
    this.width = this.sprite.width
    this.height = this.sprite.height
    
    // Устанавливаем позицию ленты относительно столбов
    this.tapeSprite.x = 0 // Центр по X (как столбы)
    this.tapeSprite.y = tapeYOffset // Выше столбов
    
    // Убеждаемся, что контейнер видим
    this.container.visible = true
    this.container.alpha = 1
    
    // Убеждаемся, что спрайты видимы
    this.sprite.visible = true
    this.sprite.alpha = 1
    this.tapeSprite.visible = true
    this.tapeSprite.alpha = 1
    
    console.log(`✅ Финишная линия создана:`, {
      textureSize: `${this.finishTexture.width}x${this.finishTexture.height}`,
      spriteSize: `${this.sprite.width.toFixed(0)}x${this.sprite.height.toFixed(0)}`,
      scale: FINISH_SCALE.toFixed(2),
      width: this.width.toFixed(0),
      height: this.height.toFixed(0),
      tapeYOffset: tapeYOffset.toFixed(0),
      containerVisible: this.container.visible,
      containerAlpha: this.container.alpha,
      floorPatternVisible: this.floorPattern?.visible,
      floorPatternZIndex: this.floorPattern?.zIndex,
      floorPatternY: this.floorPattern?.y,
      spriteVisible: this.sprite.visible,
      spriteAlpha: this.sprite.alpha,
      spriteZIndex: this.sprite.zIndex,
      spriteX: this.sprite.x,
      spriteY: this.sprite.y,
      tapeSpriteVisible: this.tapeSprite.visible,
      tapeSpriteAlpha: this.tapeSprite.alpha,
      tapeSpriteX: this.tapeSprite.x,
      tapeSpriteY: this.tapeSprite.y,
      childrenCount: this.container.children.length
    })
  }

  /**
   * Настройка позиции финишной линии
   */
  setupPosition() {
    if (!this.container) {
      return
    }

    // Позиция контейнера по X и Y
    this.container.x = this.x
    this.container.y = this.y
    
    console.log(`Финишная линия позиционирована:`, { 
      x: this.container.x, 
      y: this.container.y 
    })
  }

  /**
   * Вычисление X координаты разрыва ленты
   * Лента разрывается когда игрок достигает этой позиции
   */
  calculateTapeBreakX() {
    // В референсе: tapeBreakX = finishX - 50 (примерно)
    // Это позиция, где игрок "разрывает" ленту
    // Используем позицию ленты минус небольшое смещение
    this.tapeBreakX = this.x - 50
    
    console.log(`Позиция разрыва ленты:`, { tapeBreakX: this.tapeBreakX })
  }

  /**
   * Создание fallback спрайтов при ошибке загрузки
   */
  createFallbackSprites() {
    console.log('🔄 Создание fallback спрайтов финиша')
    
    // Создаём контейнер для всех элементов
    this.container = new Container()
    this.container.zIndex = this.zIndex
    this.container.visible = true
    this.container.alpha = 1
    
    // Референс: floorPattern.y = a - 80, где a = roadY
    // Шахматная доска должна быть на земле ПОД игроком
    const checkerboardSize = 200
    const checkerSize = 20
    const checkerboardGraphics = new Graphics()
    
    // Рисуем шахматную доску (fallback)
    for (let i = 0; i < checkerboardSize / checkerSize; i++) {
      for (let j = 0; j < checkerboardSize / checkerSize; j++) {
        const color = (i + j) % 2 === 0 ? 0xFFFFFF : 0x000000
        checkerboardGraphics.rect(
          -checkerboardSize / 2 + i * checkerSize,
          -checkerboardSize / 2 + j * checkerSize,
          checkerSize,
          checkerSize
        )
        checkerboardGraphics.fill(color)
      }
    }
    
    this.floorPattern = checkerboardGraphics
    this.floorPattern.zIndex = CONSTANTS.Z_INDEX.FINISH_LINE_GROUND // Низкий z-index (15), под игроком
    this.floorPattern.visible = true
    this.floorPattern.alpha = 1
    this.floorPattern.x = 0
    this.floorPattern.y = -80 // На 80px выше roadY (относительно контейнера)
    this.container.addChild(this.floorPattern)
    
    // Fallback - простые прямоугольники для столбов
    const finishWidth = 100
    const finishHeight = 400
    const tapeWidth = 200
    const tapeHeight = 30
    
    // Столбы финиша (fallback) - два столба
    const finishGraphics = new Graphics()
    // Левый столб
    finishGraphics.rect(-finishWidth - 20, -finishHeight, finishWidth, finishHeight)
    finishGraphics.fill(0xFF0000) // Красный цвет для видимости
    finishGraphics.stroke({ width: 4, color: 0x000000 })
    // Правый столб
    finishGraphics.rect(20, -finishHeight, finishWidth, finishHeight)
    finishGraphics.fill(0xFF0000)
    finishGraphics.stroke({ width: 4, color: 0x000000 })
    
    this.sprite = finishGraphics
    this.sprite.zIndex = this.zIndex // z-index 24 (ниже игрока 30)
    this.sprite.x = 0
    this.sprite.y = 0
    this.sprite.visible = true
    this.sprite.alpha = 1
    
    // Лента (fallback)
    const tapeGraphics = new Graphics()
    tapeGraphics.rect(-tapeWidth / 2, -tapeHeight / 2, tapeWidth, tapeHeight)
    tapeGraphics.fill(0xFFD700) // Золотой цвет
    tapeGraphics.stroke({ width: 2, color: 0xFFA500 }) // Оранжевая обводка
    
    this.tapeSprite = tapeGraphics
    this.tapeSprite.zIndex = this.zIndex + 1
    this.tapeSprite.x = 0
    this.tapeSprite.y = -finishHeight + 100
    this.tapeSprite.visible = true
    this.tapeSprite.alpha = 1
    
    // Добавляем в правильном порядке: сначала шахматная доска (низкий z-index), потом столбы и лента
    this.container.addChild(this.sprite)
    this.container.addChild(this.tapeSprite)
    
    this.width = finishWidth * 2 + 40 // Ширина обоих столбов
    this.height = finishHeight
    
    console.log('✅ Fallback спрайты финиша созданы:', {
      width: this.width,
      height: this.height,
      containerVisible: this.container.visible,
      floorPatternVisible: this.floorPattern?.visible,
      spriteVisible: this.sprite.visible,
      tapeSpriteVisible: this.tapeSprite.visible,
      floorPatternZIndex: this.floorPattern?.zIndex,
      spriteZIndex: this.sprite.zIndex
    })
  }

  /**
   * Установка ссылки на игрока (для проверки достижения ленты)
   * @param {Player} player - Ссылка на игрока
   */
  setPlayer(player) {
    this.player = player
  }

  /**
   * Обновление финишной линии
   * Финиш движется влево синхронно с фоном
   * Проверяет достижение игроком ленты
   * @param {number} deltaMS - Время с последнего кадра в миллисекундах
   * @param {number} backgroundSpeed - Скорость фона (пикселей/сек)
   */
  update(deltaMS, backgroundSpeed = 0) {
    if (!this.container || !this.isActive) return
    
    // Движение влево синхронно с фоном
    const deltaSeconds = deltaMS / 1000
    const deltaX = backgroundSpeed * deltaSeconds
    this.x -= deltaX
    this.container.x = this.x
    
    // Обновляем позицию разрыва ленты (она тоже движется)
    this.tapeBreakX -= deltaX
    
    // Проверка достижения игроком ленты
    // Игрок стоит на месте, финиш движется к нему
    // Лента разрывается когда позиция разрыва (tapeBreakX) достигает позиции игрока
    if (!this.isBroken && this.player && this.player.sprite) {
      const playerX = this.player.sprite.x
      // Когда позиция разрыва ленты достигает или проходит позицию игрока
      // (tapeBreakX движется влево, поэтому проверяем <=)
      if (this.tapeBreakX <= playerX) {
        this.breakTape()
      }
    }
    
    // Обновление анимации разрыва ленты
    if (this.breakAnimation.isAnimating) {
      this.updateBreakAnimation(deltaMS)
    }
    
    // Деактивация при выходе за экран
    if (this.x + this.width < -100) {
      this.destroy()
    }
  }

  /**
   * Разрыв ленты
   * Запускает анимацию разрыва ленты
   */
  breakTape() {
    if (this.isBroken) return
    
    this.isBroken = true
    
    // Инициализация анимации разрыва
    this.breakAnimation.isAnimating = true
    this.breakAnimation.startTime = Date.now()
    this.breakAnimation.startY = this.tapeSprite.y
    this.breakAnimation.startRotation = this.tapeSprite.rotation || 0
    
    // Случайный поворот (от -10 до +10 градусов, как в референсе)
    const randomRotation = (Math.random() * 20 - 10) * (Math.PI / 180) // Конвертируем в радианы
    this.breakAnimation.targetRotation = randomRotation
    
    // Подъём вверх на 50px (как в референсе)
    this.breakAnimation.targetY = this.breakAnimation.startY - 50
    
    console.log('🏁 Лента финиша разорвана!')
  }

  /**
   * Обновление анимации разрыва ленты
   * Простая анимация через изменение свойств спрайта
   * @param {number} deltaMS - Время с последнего кадра
   */
  updateBreakAnimation(deltaMS) {
    if (!this.tapeSprite || !this.breakAnimation.isAnimating) return
    
    const elapsed = Date.now() - this.breakAnimation.startTime
    const progress = Math.min(elapsed / this.breakAnimation.duration, 1) // От 0 до 1
    
    // Используем ease-out функцию (аналогично power2.out в GSAP)
    const easeOut = 1 - Math.pow(1 - progress, 2)
    
    // Интерполяция позиции Y
    const currentY = this.breakAnimation.startY + 
      (this.breakAnimation.targetY - this.breakAnimation.startY) * easeOut
    this.tapeSprite.y = currentY
    
    // Интерполяция поворота
    const currentRotation = this.breakAnimation.startRotation + 
      (this.breakAnimation.targetRotation - this.breakAnimation.startRotation) * easeOut
    this.tapeSprite.rotation = currentRotation
    
    // Интерполяция прозрачности (от 1 до 0)
    this.tapeSprite.alpha = 1 - easeOut
    
    // Завершение анимации
    if (progress >= 1) {
      this.breakAnimation.isAnimating = false
      this.tapeSprite.visible = false
    }
  }

  /**
   * Получение хитбокса для коллизий (если нужно)
   * @returns {Object} Прямоугольник хитбокса
   */
  getHitbox() {
    if (!this.container || !this.isActive) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }

    // Anchor (0.5, 1) означает, что низ спрайта в точке (x, y)
    return {
      x: this.container.x - this.width / 2,
      y: this.container.y - this.height,
      width: this.width,
      height: this.height
    }
  }

  /**
   * Уничтожение финишной линии
   */
  destroy() {
    this.isActive = false
    if (this.container) {
      this.container.destroy({ children: true })
      this.container = null
    }
    this.sprite = null
    this.tapeSprite = null
  }
}
