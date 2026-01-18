/**
 * ParallaxBackground - класс для создания параллакс-фона
 * Основано на анализе из ../анализ/04_background.md
 */

import { Container, Sprite, Graphics } from 'pixi.js'
import { CONSTANTS } from '../core/Constants.js'

// Константы для декораций (из анализа)
const LAMP_SPACING = 800
const TREE_MIN_SPACING = 300
const TREE_MAX_SPACING = 500
const SCREEN_BUFFER = 1200
const BUSH_GROUP_SPACING = 550 // 500-600px
const BUSHES_PER_GROUP_MIN = 2
const BUSHES_PER_GROUP_MAX = 3

export class ParallaxBackground extends Container {
  constructor(app, assetLoader) {
    super()
    
    this.app = app
    this.assetLoader = assetLoader
    
    // Текстуры
    this.bgTexture = null
    this.treeTextures = []
    this.lampTexture = null
    this.bushTextures = []
    
    // Тайлы фона
    this.backgroundTiles = []
    this.bgScale = 1
    this.tileY = 0 // Позиция фона по Y (для позиционирования деревьев)
    
    // Пул декораций
    this.treesPool = []
    this.lampsPool = []
    this.bushesPool = []
    
    // Состояние
    this.isPaused = false
    this.scrollOffset = 0
    // roadY будет вычислен в createPropPools() как (Me - oe.GROUND_Y) * scale
    // Референс: Me=1280, oe.GROUND_Y=280, roadY=1000
    this.roadY = 0 // Будет установлен в createPropPools()
    
    // Z-Index
    this.sortableChildren = true
  }

  /**
   * Инициализация фона
   */
  async init() {
    try {
      // Загрузка текстур
      await this.loadTextures()
      // Создание тайлового фона
      this.createTiledBackground()
      
      // Создание пулов декораций
      this.createPropPools()
    } catch (error) {
      console.error('Failed to initialize ParallaxBackground:', error)
      // Fallback фон при ошибке
      this.createFallbackBackground()
    }
  }

  /**
   * Загрузка текстур фона
   * Используем реальные ассеты из reference_assets
   * Правильные ассеты:
   * - Фон: asset_0015.png
   * - Кусты: asset_0016.png, asset_0017.png, asset_0018.png (3 текстуры)
   * - Лампа: asset_0019.png
   * - Деревья: asset_0020.png, asset_0021.png (2 текстуры)
   */
  async loadTextures() {
    // Фон - asset_0015.png
    this.bgTexture = await this.assetLoader.loadTexture(
      '../../reference/reference_assets/data_uri_assets/asset_0015.png'
    )
    
    // Кусты - asset_0016.png, asset_0017.png, asset_0018.png (3 текстуры)
    this.bushTextures = [
      await this.assetLoader.loadTexture(
        '../../reference/reference_assets/data_uri_assets/asset_0016.png'
      ),
      await this.assetLoader.loadTexture(
        '../../reference/reference_assets/data_uri_assets/asset_0017.png'
      ),
      await this.assetLoader.loadTexture(
        '../../reference/reference_assets/data_uri_assets/asset_0018.png'
      )
    ]
    
    // Лампа - asset_0019.png
    this.lampTexture = await this.assetLoader.loadTexture(
      '../../reference/reference_assets/data_uri_assets/asset_0019.png'
    )
    
    // Деревья - asset_0020.png, asset_0021.png (2 текстуры)
    this.treeTextures = [
      await this.assetLoader.loadTexture(
        '../../reference/reference_assets/data_uri_assets/asset_0020.png'
      ),
      await this.assetLoader.loadTexture(
        '../../reference/reference_assets/data_uri_assets/asset_0021.png'
      )
    ]
  }

  /**
   * Создание тайлового фона для бесшовной прокрутки
   * Точная копия из референса
   */
  createTiledBackground() {
    if (!this.bgTexture) {
      console.error('bgTexture не загружена')
      return
    }

    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    const textureWidth = this.bgTexture.width
    const textureHeight = this.bgTexture.height

    // Из референса: const t=$e/this.bgTexture.width, A=Me/this.bgTexture.height
    // Референс: $e=window.innerWidth, Me=1280 (фиксированное значение)
    // Для адаптации к разным размерам экрана используем текущую высоту экрана
    const scaleX = screenWidth / textureWidth
    const scaleY = screenHeight / textureHeight
    // В референсе: bgScale = Math.max(scaleX, scaleY)
    // Используем текущие размеры экрана для адаптации
    this.bgScale = Math.max(scaleX, scaleY)
    
    // Из референса: const r=this.bgTexture.width*this.bgScale
    const tileWidth = textureWidth * this.bgScale
    
    // Из референса: const s=(Me-this.bgTexture.height*this.bgScale)/2 - центрирование по Y!
    // Используем текущую высоту экрана для адаптации
    this.tileY = (screenHeight - textureHeight * this.bgScale) / 2 // Сохраняем для использования в createPropPools
    
    // Из референса: n=6
    const tileCount = 6
    
    for (let i = 0; i < tileCount; i++) {
      const tile = new Sprite(this.bgTexture)
      tile.y = this.tileY // Центрирование по Y
      tile.zIndex = CONSTANTS.Z_INDEX.FAR_BACKGROUND
      tile.anchor.set(0, 0) // Из референса: l.anchor.set(0,0)
      
      // Из референса: зеркальный эффект для чередующихся тайлов
      if (i % 2 === 1) {
        // Зеркальное отражение по X
        tile.scale.set(-this.bgScale, this.bgScale)
        tile.x = (i + 1) * tileWidth - tileWidth
      } else {
        tile.scale.set(this.bgScale, this.bgScale)
        tile.x = i * tileWidth - tileWidth // Начинается с отрицательного значения
      }
      
      this.backgroundTiles.push(tile)
      this.addChild(tile)
    }
  }

  /**
   * Создание пулов декоративных элементов
   * Точная копия из референса
   */
  createPropPools() {
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    
    // Из референса: roadY = Me - oe.GROUND_Y
    // Референсные значения: Me=1280, oe.GROUND_Y=280, roadY=1000
    // Масштабируем пропорционально высоте экрана
    const referenceHeight = CONSTANTS.POSITIONS.REFERENCE_SCREEN_HEIGHT // 1280
    const referenceGroundY = CONSTANTS.POSITIONS.REFERENCE_GROUND_Y // 280
    const heightScale = screenHeight / referenceHeight
    
    // roadY в референсе = 1280 - 280 = 1000
    // Масштабируем: roadY = (Me - oe.GROUND_Y) * scale = 1000 * scale
    const referenceRoadY = referenceHeight - referenceGroundY // 1000
    this.roadY = referenceRoadY * heightScale
    
    
    // Из референса: const t=$e*2+this.SCREEN_BUFFER*2
    const totalWidth = screenWidth * 2 + SCREEN_BUFFER * 2
    
    // Лампы
    // Из референса: const A=Math.ceil(t/this.LAMP_SPACING)+1
    const lampCount = Math.ceil(totalWidth / LAMP_SPACING) + 1
    for (let i = 0; i < lampCount; i++) {
      const lamp = new Sprite(this.lampTexture)
      lamp.anchor.set(0.5, 1) // Привязываем к низу, как кусты
      // Деревья и лампы должны быть на уровне кустов
      // Кусты: bush.y = this.roadY - 305 * heightScale
      const bushOffset = 305 * heightScale
      lamp.y = this.roadY - bushOffset // На уровне кустов
      // Из референса: n.scale.set(1.8)
      // Референсные значения рассчитаны для Me=1280px, масштабируем пропорционально
      lamp.scale.set(1.8 * heightScale)
      lamp.zIndex = CONSTANTS.Z_INDEX.NEAR_BACKGROUND // Из референса: n.zIndex=me.NEAR_BACKGROUND
      
      // Из референса: const a=s*this.LAMP_SPACING-this.SCREEN_BUFFER
      lamp.x = i * LAMP_SPACING - SCREEN_BUFFER
      
      this.lampsPool.push(lamp)
      this.addChild(lamp)
    }
    
    // Деревья
    // Из референса: let r=-this.SCREEN_BUFFER;for(;r<t;)
    let x = -SCREEN_BUFFER
    while (x < totalWidth) {
      // Из референса: const s=Math.floor(Math.random()*this.treeTextures.length)
      const textureIndex = Math.floor(Math.random() * this.treeTextures.length)
      const tree = new Sprite(this.treeTextures[textureIndex])
      
      // Деревья должны быть на уровне кустов
      // Кусты: bush.y = this.roadY - 305 * heightScale, anchor = (.5, 1)
      tree.anchor.set(0.5, 1) // Привязываем к низу, как кусты
      const bushOffset = 305 * heightScale
      tree.y = this.roadY - bushOffset // На уровне кустов
      // Из референса: n.scale.set(1.81)
      // Референсные значения рассчитаны для Me=1280px, масштабируем пропорционально
      tree.scale.set(1.81 * heightScale)
      tree.zIndex = CONSTANTS.Z_INDEX.MID_BACKGROUND // Из референса: n.zIndex=me.MID_BACKGROUND
      tree.x = x // Из референса: n.x=r
      
      this.treesPool.push(tree)
      this.addChild(tree)
      
      // Из референса: r+=this.TREE_MIN_SPACING+Math.random()*(this.TREE_MAX_SPACING-this.TREE_MIN_SPACING)
      x += TREE_MIN_SPACING + Math.random() * (TREE_MAX_SPACING - TREE_MIN_SPACING)
    }
    
    // Кусты
    this.createBushGroups(totalWidth, screenHeight, heightScale)
  }

  /**
   * Создание групп кустов
   * Точная копия из референса
   */
  createBushGroups(totalWidth, screenHeight, heightScale) {
    // Из референса: let s=-this.SCREEN_BUFFER+100;for(;s<t;)
    let x = -SCREEN_BUFFER + 100
    
    while (x < totalWidth) {
      // Из референса: const n=Math.random()>.3?3:2
      const bushesInGroup = Math.random() > 0.3 ? 3 : 2
      
      for (let i = 0; i < bushesInGroup; i++) {
        // Из референса: if(a>0&&Math.random()<.2)continue - пропуск некоторых кустов
        if (i > 0 && Math.random() < 0.2) {
          continue
        }
        
        // Из референса: const l=a%this.bushTextures.length - циклический выбор текстуры
        const textureIndex = i % this.bushTextures.length
        const bush = new Sprite(this.bushTextures[textureIndex])
        
        bush.anchor.set(0.5, 1) // Из референса: h.anchor.set(.5,1)
        // Из референса: h.y=this.roadY-305
        // Масштабируем значение 305 пропорционально высоте экрана
        // Референс: Me=1280, roadY=1000, bush.y=1000-305=695
        const bushOffset = 305 * heightScale
        bush.y = this.roadY - bushOffset
        // Из референса: h.scale.set(.45+Math.random()*.15)
        // Референсные значения рассчитаны для Me=1280px, масштабируем пропорционально
        const bushScale = (0.45 + Math.random() * 0.15) * heightScale
        bush.scale.set(bushScale)
        bush.zIndex = CONSTANTS.Z_INDEX.NEAR_BACKGROUND // Из референса: h.zIndex=me.NEAR_BACKGROUND
        
        // Из референса: const u=s+a*(200/3)+Math.random()*30;h.x=u
        bush.x = x + i * (200 / 3) + Math.random() * 30
        
        this.bushesPool.push(bush)
        this.addChild(bush)
      }
      
      // Из референса: s+=500+Math.random()*100
      x += 500 + Math.random() * 100
    }
  }

  /**
   * Обновление фона каждый кадр
   * @param {number} deltaMS - Время с последнего кадра в миллисекундах
   * @param {number} speed - Скорость прокрутки
   */
  update(deltaMS, speed = CONSTANTS.SPEED.BASE) {
    if (this.isPaused) {
      return
    }

    // Вычисление смещения
    const deltaX = speed * deltaMS / 1000
    this.scrollOffset += deltaX

    // Обновление тайлов фона (базовая скорость)
    this.updateBackgroundTiles(deltaX)
    
    // Обновление пулов декораций с той же скоростью, что и фон
    // В референсе все элементы фона движутся с одной скоростью
    const lampWrapDistance = LAMP_SPACING * this.lampsPool.length
    this.updatePool(this.lampsPool, deltaX, lampWrapDistance)
    
    // Для деревьев вычисляем общую ширину на основе реальных позиций
    const totalTreesWidth = this.treesPool.length > 0 
      ? Math.max(...this.treesPool.map(t => t.x)) + TREE_MAX_SPACING
      : TREE_MAX_SPACING * this.treesPool.length
    this.updatePool(this.treesPool, deltaX, totalTreesWidth)
    
    // Для кустов вычисляем общую ширину на основе реальных позиций
    const totalBushesWidth = this.bushesPool.length > 0
      ? Math.max(...this.bushesPool.map(b => b.x)) + BUSH_GROUP_SPACING
      : BUSH_GROUP_SPACING * this.bushesPool.length
    this.updatePool(this.bushesPool, deltaX, totalBushesWidth)
  }

  /**
   * Обновление тайлов фона для бесшовной прокрутки
   * Точная копия из референса с учетом зеркального эффекта
   * @param {number} deltaX - Смещение по X
   */
  updateBackgroundTiles(deltaX) {
    if (this.backgroundTiles.length === 0 || deltaX === 0) {
      return
    }

    // Из референса: const s=this.bgTexture.width*this.bgScale,n=s*this.backgroundTiles.length
    const tileWidth = this.bgTexture.width * this.bgScale
    const totalWidth = tileWidth * this.backgroundTiles.length

    this.backgroundTiles.forEach(tile => {
      // Двигаем тайл влево
      tile.x -= deltaX

      // Из референса: (h.scale.x<0?h.x-s:h.x)<-s*2&&(h.x+=n)
      // Для зеркальных тайлов (scale.x < 0) проверяем h.x - s, иначе h.x
      // Если тайл ушел слишком далеко влево (< -s*2), перемещаем его вправо на n
      const checkX = tile.scale.x < 0 ? tile.x - tileWidth : tile.x
      
      if (checkX < -tileWidth * 2) {
        // Просто перемещаем тайл вправо на totalWidth (как в референсе)
        tile.x += totalWidth
      }
    })
  }

  /**
   * Обновление пула декораций
   * @param {Array} pool - Пул спрайтов
   * @param {number} deltaX - Смещение по X
   * @param {number} wrapDistance - Расстояние для обёртки
   */
  updatePool(pool, deltaX, wrapDistance) {
    pool.forEach(sprite => {
      sprite.x -= deltaX
      
      // Если элемент ушёл за левый край → перемещаем вправо
      if (sprite.x + sprite.width < 0) {
        const rightmost = Math.max(...pool.map(s => s.x))
        sprite.x = rightmost + wrapDistance / pool.length
      }
    })
  }

  /**
   * Пауза прокрутки фона
   */
  pause() {
    this.isPaused = true
  }

  /**
   * Возобновление прокрутки фона
   */
  resume() {
    this.isPaused = false
  }

  /**
   * Сброс фона в начальное состояние
   */
  reset() {
    this.scrollOffset = 0

    // Возвращаем тайлы в начальные позиции
    const tileWidth = this.bgTexture.width * this.bgScale
    this.backgroundTiles.forEach((tile, i) => {
      tile.x = i * tileWidth
    })

    // Возвращаем декорации в начальные позиции
    this.resetPool(this.lampsPool, LAMP_SPACING)
    this.resetPool(this.treesPool, TREE_MIN_SPACING)
    this.resetPool(this.bushesPool, BUSH_GROUP_SPACING)
  }

  /**
   * Сброс пула декораций
   */
  resetPool(pool, spacing) {
    pool.forEach((sprite, i) => {
      sprite.x = i * spacing
    })
  }

  /**
   * Создание fallback фона при ошибке загрузки текстур
   */
  createFallbackBackground() {
    const graphics = new Graphics()
    graphics.rect(0, 0, window.innerWidth, window.innerHeight)
    graphics.fill(0xFCFCF6) // Цвет фона из Constants
    graphics.zIndex = CONSTANTS.Z_INDEX.FAR_BACKGROUND
    this.addChild(graphics)
    
    console.warn('Используется fallback фон')
  }
}
