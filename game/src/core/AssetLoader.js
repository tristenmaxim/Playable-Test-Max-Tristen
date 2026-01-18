/**
 * Система загрузки ассетов
 * Основано на анализе из ../анализ/09_assets.md
 */

import { Assets, Texture } from 'pixi.js'

export class AssetLoader {
  constructor() {
    this.cache = new Map()
    this.loaded = false
  }

  /**
   * Загружает ассет по URL
   * @param {string} url - URL ассета (может быть data URI)
   * @returns {Promise} Промис с загруженным ассетом
   */
  async load(url) {
    // Проверка кэша
    if (this.cache.has(url)) {
      return this.cache.get(url)
    }

    try {
      // Загрузка через PixiJS Assets
      const asset = await Assets.load(url)
      this.cache.set(url, asset)
      return asset
    } catch (error) {
      console.error(`Failed to load asset: ${url}`, error)
      throw error
    }
  }

  /**
   * Загружает изображение как текстуру
   * @param {string} url - URL изображения
   * @returns {Promise<Texture>} Текстура
   */
  async loadTexture(url) {
    return await this.load(url)
  }

  /**
   * Загружает spritesheet
   * @param {string} jsonUrl - URL JSON описания spritesheet
   * @param {string} imageUrl - URL изображения spritesheet
   * @returns {Promise} Spritesheet объект
   */
  async loadSpritesheet(jsonUrl, imageUrl) {
    // Сначала загружаем JSON
    const jsonResponse = await fetch(jsonUrl)
    const jsonData = await jsonResponse.json()

    // Затем загружаем изображение
    const texture = await this.loadTexture(imageUrl)

    // Создаём spritesheet через PixiJS
    const spritesheet = new Assets.Spritesheet(texture, jsonData)
    await spritesheet.parse()

    return spritesheet
  }

  /**
   * Загружает аудио файл
   * @param {string} url - URL аудио файла
   * @returns {Promise<string>} URL (для Howler.js)
   */
  async loadAudio(url) {
    // Для Howler.js просто возвращаем URL
    // Howler сам загрузит файл
    return url
  }

  /**
   * Очищает кэш
   */
  clearCache() {
    this.cache.clear()
  }

  /**
   * Получает размер кэша
   * @returns {number} Количество закэшированных ассетов
   */
  getCacheSize() {
    return this.cache.size
  }
}
