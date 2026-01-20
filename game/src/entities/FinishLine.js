/**
 * FinishLine - класс финишной линии
 * Основано на анализе из ../анализ/17_finish_line.md
 * Этап 13: Финишная линия появляется и завершает игру
 * 
 * Финиш состоит из:
 * - Столбы финиша и лента (asset_0010.png)
 * - Анимация разрыва ленты при достижении игроком
 */

import { Sprite, Graphics, Container } from 'pixi.js'
import { CONSTANTS } from '../core/Constants.js'
import { rectanglesIntersect } from '../utils/Collision.js'

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
    this.tapeSprite = null // Больше не используется - лента уже в asset_0010.png
    this.cornerSprite = null // asset_0011.png в левом верхнем углу
    this.cornerSpriteCopy = null // Копия asset_0011.png, смещенная вправо на 20%
    this.yellowTape = null // Желтая лента между верхними точками стоек
    
    // Текстуры
    this.finishTexture = null
    this.cornerTexture = null
    
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
   * asset_0010.png - шахматная доска (финишная черта)
   * asset_0011.png - элемент в левом верхнем углу
   */
  async loadTextures() {
    // Загружаем текстуру финиша (шахматная доска)
    const finishPath = '../reference/reference_assets/data_uri_assets/asset_0010.png'
    // Загружаем текстуру для левого верхнего угла
    const cornerPath = '../reference/reference_assets/data_uri_assets/asset_0011.png'
    
    console.log('🔄 Загрузка текстур финиша:', { finishPath, cornerPath })
    
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
    
    // Загружаем текстуру для левого верхнего угла
    try {
      this.cornerTexture = await this.assetLoader.loadTexture(cornerPath)
      console.log(`✅ Текстура угла загружена успешно:`, {
        width: this.cornerTexture.width,
        height: this.cornerTexture.height,
        valid: this.cornerTexture.width > 0 && this.cornerTexture.height > 0
      })
    } catch (error) {
      console.warn('⚠️ Не удалось загрузить текстуру угла (asset_0011.png):', error)
      this.cornerTexture = null
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
    
    // Убрали шахматную доску на земле (asset_0011.png) - это был лишний ассет
    // Оставляем только asset_0010.png (столбы финиша)
    
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
    
    // Убрали программно созданную ленту (tapeSprite) - лента уже в asset_0010.png
    // Оставляем только asset_0010.png со столбами и лентой
    
    // Позиционируем столбы (anchor 0.5, 1 - центр по X, низ по Y)
    this.sprite.x = 0
    this.sprite.y = 0 // Низ столбов в точке (0, 0) контейнера
    
    // Добавляем спрайт финиша в контейнер
    this.container.addChild(this.sprite)
    
    // Создаём спрайт для левого верхнего угла (asset_0011.png)
    if (this.cornerTexture) {
      this.cornerSprite = new Sprite(this.cornerTexture)
      // Anchor (0, 0) - левый верхний угол для точного позиционирования
      this.cornerSprite.anchor.set(0, 0)
      this.cornerSprite.zIndex = this.zIndex + 1 // Выше основного спрайта
      this.cornerSprite.visible = true
      this.cornerSprite.alpha = 1
      
      // Поворачиваем на -90 градусов (-π/2 радиан) для вертикальной ориентации вверх
      // Отрицательный угол поворачивает против часовой стрелки, чтобы спрайт смотрел вверх
      this.cornerSprite.rotation = -Math.PI / 2
      
      // Уменьшаем размер стойки до 65% от текущего (высота и ширина)
      this.cornerSprite.scale.set(0.65, 0.65)
      
      // Позиционируем в левом верхнем углу asset_0010.png
      // asset_0010.png имеет anchor (0.5, 1), поэтому:
      // - Левый край: x = -width/2
      // - Верхний край: y = -height
      const spriteLeft = -this.sprite.width / 2
      const spriteTop = -this.sprite.height
      
      // После поворота на -90 градусов, спрайт будет смотреть вверх
      // Поворот происходит вокруг anchor (0, 0), поэтому левый верхний угол остается на месте
      // Масштабирование также происходит относительно anchor (0, 0), поэтому позиция остается той же
      this.cornerSprite.x = spriteLeft
      this.cornerSprite.y = spriteTop
      
      // Добавляем в контейнер
      this.container.addChild(this.cornerSprite)
      
      // Создаём копию asset_0011.png и смещаем вправо на 20% относительно asset_0010.png
      this.cornerSpriteCopy = new Sprite(this.cornerTexture)
      this.cornerSpriteCopy.anchor.set(0, 0)
      this.cornerSpriteCopy.zIndex = this.zIndex + 1 // Выше основного спрайта
      this.cornerSpriteCopy.visible = true
      this.cornerSpriteCopy.alpha = 1
      
      // Поворачиваем на -90 градусов для вертикальной ориентации вверх (как оригинал)
      this.cornerSpriteCopy.rotation = -Math.PI / 2
      
      // Уменьшаем размер копии стойки до 65% от текущего (высота и ширина)
      this.cornerSpriteCopy.scale.set(0.65, 0.65)
      
      // Смещаем вправо на 16% ширины asset_0010.png (ближе к левому краю)
      const offsetRight = this.sprite.width * 0.16
      this.cornerSpriteCopy.x = spriteLeft + offsetRight
      
      // Опускаем ниже нижнего края asset_0010.png, ближе к нижнему левому углу
      // asset_0010.png имеет anchor (0.5, 1), поэтому его нижний край на y = 0
      // Чтобы опустить копию ниже, нужно сместить её вниз от нижнего края
      // Добавляем небольшое смещение вниз для более точного позиционирования в углу
      // После масштабирования высота изменилась, поэтому используем масштабированную высоту
      const offsetDown = 10 // Небольшое смещение вниз в пикселях
      this.cornerSpriteCopy.y = -this.cornerSpriteCopy.height + offsetDown
      
      // Добавляем копию в контейнер
      this.container.addChild(this.cornerSpriteCopy)
      
      // Создаём желтую ленту между верхними точками стоек
      // Учитываем, что стойки повернуты на -90 градусов и масштабированы до 65%
      // После поворота на -90 градусов вокруг anchor (0, 0):
      // - Исходная ширина текстуры становится высотой повернутого спрайта
      // - Исходная высота текстуры становится шириной повернутого спрайта
      // Anchor (0, 0) означает левый верхний угол исходной текстуры
      // После поворота на -90 градусов против часовой стрелки:
      // - Левый верхний угол (anchor) остается на месте (cornerSprite.x, cornerSprite.y)
      // - Верхняя точка будет справа от anchor на расстоянии исходная_ширина * масштаб
      // Используем реальные размеры повернутого и масштабированного спрайта
      // После поворота на -90 градусов и масштабирования до 0.65:
      // - cornerSprite.height уже содержит масштабированную высоту
      // - Высота = исходная_ширина_текстуры * 0.65
      // Используем реальную высоту спрайта (она уже масштабирована)
      const leftPostHeight = this.cornerSprite.height
      const rightPostHeight = this.cornerSpriteCopy.height
      
      // Верхняя точка левой стойки (оригинал asset_0011)
      // После поворота на -90 градусов против часовой стрелки вокруг anchor (0, 0):
      // - Anchor точка (cornerSprite.x, cornerSprite.y) остается на месте
      // - Исходный спрайт был горизонтальным, после поворота стал вертикальным
      // - После поворота на -90 градусов против часовой стрелки:
      //   * Исходная ширина текстуры становится высотой повернутого спрайта
      //   * Исходная высота текстуры становится шириной повернутого спрайта
      // - Anchor (0, 0) означает левый верхний угол исходной текстуры
      // - После поворота, anchor точка становится ЛЕВЫМ ВЕРХНИМ углом повернутого спрайта
      // - Верхняя точка повернутого спрайта находится справа от anchor на расстоянии высоты
      // - X координата верхней точки = cornerSprite.x + высота_повернутого_спрайта
      // - Y координата верхней точки = cornerSprite.y (та же, что и anchor - это ВЕРХНЯЯ точка)
      const leftPostTopX = this.cornerSprite.x + leftPostHeight
      const leftPostTopY = this.cornerSprite.y // Y координата верхней точки (та же, что и anchor)
      
      // Верхняя точка правой стойки (копия asset_0011)
      const rightPostTopX = this.cornerSpriteCopy.x + rightPostHeight
      const rightPostTopY = this.cornerSpriteCopy.y // Y координата остается той же (верхняя точка)
      
      console.log(`🔍 Вычисление верхних точек стоек:`, {
        cornerTextureSize: `${this.cornerTexture.width}x${this.cornerTexture.height}`,
        leftPostSpriteSize: `${this.cornerSprite.width.toFixed(0)}x${this.cornerSprite.height.toFixed(0)}`,
        leftPostPosition: `(${this.cornerSprite.x.toFixed(0)}, ${this.cornerSprite.y.toFixed(0)})`,
        leftPostHeight: `${leftPostHeight.toFixed(0)}px`,
        leftPostTop: `(${leftPostTopX.toFixed(0)}, ${leftPostTopY.toFixed(0)})`,
        rightPostSpriteSize: `${this.cornerSpriteCopy.width.toFixed(0)}x${this.cornerSpriteCopy.height.toFixed(0)}`,
        rightPostPosition: `(${this.cornerSpriteCopy.x.toFixed(0)}, ${this.cornerSpriteCopy.y.toFixed(0)})`,
        rightPostHeight: `${rightPostHeight.toFixed(0)}px`,
        rightPostTop: `(${rightPostTopX.toFixed(0)}, ${rightPostTopY.toFixed(0)})`
      })
      
      // Создаём желтую ленту как Graphics прямоугольник
      const tapeGraphics = new Graphics()
      const baseTapeHeight = 8 // Базовая высота ленты в пикселях
      const baseTapeWidth = Math.abs(rightPostTopX - leftPostTopX) // Базовая ширина ленты = расстояние между верхними точками
      // Увеличиваем размер ленты на 25%
      const tapeHeight = baseTapeHeight * 1.25 // Высота увеличена на 25%
      // Увеличиваем длину (ширину) ленты на 25% + 20% = на 50% от исходного размера
      const tapeWidth = baseTapeWidth * 1.25 * 1.2 // Длина увеличена на 25%, затем еще на 20%
      
      // Проверяем, что ширина ленты положительная
      if (tapeWidth > 0) {
        // Рисуем прямоугольник для ленты
        // Позиционируем от левой верхней точки до правой верхней точки
        // Лента рисуется от (0, 0) до (tapeWidth, tapeHeight), где (0, 0) - левый верхний угол
        tapeGraphics.rect(0, 0, tapeWidth, tapeHeight)
        tapeGraphics.fill(0xFFD700) // Желтый цвет (#FFD700)
        tapeGraphics.stroke({ width: 1, color: 0xFFA500 }) // Оранжевая обводка
        
        this.yellowTape = tapeGraphics
        this.yellowTape.zIndex = this.zIndex + 2 // Выше стоек
        this.yellowTape.visible = true
        this.yellowTape.alpha = 1
        
        // Позиционируем ленту на 35% от низа экрана
        // Graphics не имеет anchor, поэтому позиционируем напрямую
        // Лента рисуется от (0, 0) до (tapeWidth, tapeHeight)
        // Позиция (x, y) - это левый верхний угол ленты
        // Вычисляем позицию на 35% от низа экрана
        const screenHeight = this.app.screen.height
        // 35% от низа экрана = 65% от верха экрана
        const targetCenterY = screenHeight * 0.65
        
        // Контейнер находится на позиции this.y (groundY), поэтому нужно вычислить относительную позицию
        const tapeCenterY = targetCenterY - this.y // Относительно контейнера
        const tapeTopY = tapeCenterY - tapeHeight / 2 // Верхний край ленты
        
        // Устанавливаем pivot в центр ленты для правильного поворота
        this.yellowTape.pivot.set(tapeWidth / 2, tapeHeight / 2)
        
        // Позиционируем центр ленты, смещая левее на 20% от размера ленты
        const leftOffset = tapeWidth * 0.2 // 20% от длины ленты
        this.yellowTape.x = leftPostTopX + tapeWidth / 2 - leftOffset
        this.yellowTape.y = tapeCenterY // Центр ленты на нужной высоте
        
        // Поворачиваем ленту на 45 градусов (π/4 радиан)
        this.yellowTape.rotation = Math.PI / 4
        
        // Добавляем ленту в контейнер
        this.container.addChild(this.yellowTape)
        
        console.log(`✅ Желтая лента создана:`, {
          leftPostTop: `(${leftPostTopX.toFixed(0)}, ${leftPostTopY.toFixed(0)})`,
          rightPostTop: `(${rightPostTopX.toFixed(0)}, ${rightPostTopY.toFixed(0)})`,
          tapeWidth: `${tapeWidth.toFixed(0)}px`,
          tapeHeight: `${tapeHeight}px`,
          tapePosition: `(${this.yellowTape.x.toFixed(0)}, ${this.yellowTape.y.toFixed(0)})`
        })
      } else {
        console.warn('⚠️ Не удалось создать желтую ленту: некорректная ширина', tapeWidth)
      }
      
      console.log(`✅ Спрайт угла добавлен:`, {
        cornerTextureSize: `${this.cornerTexture.width}x${this.cornerTexture.height}`,
        cornerPosition: `(${spriteLeft.toFixed(0)}, ${spriteTop.toFixed(0)})`,
        cornerCopyPosition: `(${(spriteLeft + offsetRight).toFixed(0)}, ${(-this.cornerSpriteCopy.height + offsetDown).toFixed(0)})`,
        offsetRight: `${offsetRight.toFixed(0)}px (16% от ширины)`,
        offsetDown: `${offsetDown.toFixed(0)}px`,
        cornerCopyHeight: `${this.cornerSpriteCopy.height.toFixed(0)}px`,
        spriteSize: `${this.sprite.width.toFixed(0)}x${this.sprite.height.toFixed(0)}`,
        spriteBottom: 'y = 0 (нижний край asset_0010.png)',
        spriteLeft: `x = ${spriteLeft.toFixed(0)} (левый край asset_0010.png)`
      })
    }
    
    // Сохраняем размеры для коллизий
    this.width = this.sprite.width
    this.height = this.sprite.height
    
    // tapeSprite больше не используется - лента уже в asset_0010.png
    this.tapeSprite = null
    
    // Убеждаемся, что контейнер видим
    this.container.visible = true
    this.container.alpha = 1
    
      // Убеждаемся, что спрайт видим
      this.sprite.visible = true
      this.sprite.alpha = 1
    
    console.log(`✅ Финишная линия создана:`, {
      textureSize: `${this.finishTexture.width}x${this.finishTexture.height}`,
      spriteSize: `${this.sprite.width.toFixed(0)}x${this.sprite.height.toFixed(0)}`,
      scale: FINISH_SCALE.toFixed(2),
      width: this.width.toFixed(0),
      height: this.height.toFixed(0),
      containerVisible: this.container.visible,
      containerAlpha: this.container.alpha,
      spriteVisible: this.sprite.visible,
      spriteAlpha: this.sprite.alpha,
      spriteZIndex: this.sprite.zIndex,
      spriteX: this.sprite.x,
      spriteY: this.sprite.y,
      cornerSprite: this.cornerSprite ? '✅' : '❌',
      cornerSpriteVisible: this.cornerSprite?.visible,
      cornerSpritePosition: this.cornerSprite ? `(${this.cornerSprite.x.toFixed(0)}, ${this.cornerSprite.y.toFixed(0)})` : 'N/A',
        cornerSpriteCopy: this.cornerSpriteCopy ? '✅' : '❌',
        cornerSpriteCopyVisible: this.cornerSpriteCopy?.visible,
        cornerSpriteCopyPosition: this.cornerSpriteCopy ? `(${this.cornerSpriteCopy.x.toFixed(0)}, ${this.cornerSpriteCopy.y.toFixed(0)})` : 'N/A',
        yellowTape: this.yellowTape ? '✅' : '❌',
        yellowTapeVisible: this.yellowTape?.visible,
        yellowTapePosition: this.yellowTape ? `(${this.yellowTape.x.toFixed(0)}, ${this.yellowTape.y.toFixed(0)})` : 'N/A',
        yellowTapeWidth: this.yellowTape ? `${this.yellowTape.width.toFixed(0)}px` : 'N/A',
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
    
    // Убрали шахматную доску (asset_0011.png) - это был лишний ассет
    // Оставляем только столбы финиша
    
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
    
    // Убрали программно созданную ленту - лента уже в asset_0010.png
    // Добавляем только спрайт финиша
    this.container.addChild(this.sprite)
    
    // tapeSprite больше не используется
    this.tapeSprite = null
    
    this.width = finishWidth * 2 + 40 // Ширина обоих столбов
    this.height = finishHeight
    
    console.log('✅ Fallback спрайты финиша созданы:', {
      width: this.width,
      height: this.height,
      containerVisible: this.container.visible,
      spriteVisible: this.sprite.visible,
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
    
    // Убрали обновление анимации - asset_0010.png должна оставаться статичной
    
    // Деактивация при выходе за экран
    if (this.x + this.width < -100) {
      this.destroy()
    }
  }

  /**
   * Разрыв ленты
   * Лента исчезает сразу при столкновении
   */
  breakTape() {
    if (this.isBroken) return
    
    this.isBroken = true
    
    // Скрываем ленту сразу при столкновении
    if (this.yellowTape) {
      this.yellowTape.visible = false
      // Можно также удалить из контейнера, но скрытие достаточно
      // this.container.removeChild(this.yellowTape)
    }
    
    console.log('🏁 Финиш пройден! Лента исчезла.')
  }
  
  /**
   * Проверка коллизии игрока с желтой лентой
   * @param {Object} playerHitbox - Хитбокс игрока { x, y, width, height }
   * @returns {boolean} true если есть коллизия
   */
  checkTapeCollision(playerHitbox) {
    if (!this.yellowTape || !this.yellowTape.visible || this.isBroken) {
      return false
    }
    
    // Получаем глобальные координаты ленты
    const tapeBounds = this.yellowTape.getBounds()
    
    // Проверяем пересечение прямоугольников
    return rectanglesIntersect(playerHitbox, {
      x: tapeBounds.x,
      y: tapeBounds.y,
      width: tapeBounds.width,
      height: tapeBounds.height
    })
  }

  /**
   * Обновление анимации разрыва ленты
   * УБРАНО - asset_0010.png (шахматная доска) должна оставаться статичной без анимации
   * @param {number} deltaMS - Время с последнего кадра
   */
  updateBreakAnimation(deltaMS) {
    // Анимация убрана - шахматная доска остается на месте
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
    this.tapeSprite = null // Больше не используется
    this.cornerSprite = null
    this.cornerSpriteCopy = null
    this.yellowTape = null
  }
}
