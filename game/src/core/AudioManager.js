/**
 * AudioManager - управление звуками и музыкой
 * Использует Howler.js для воспроизведения аудио
 */

export class AudioManager {
  constructor(assetLoader) {
    this.assetLoader = assetLoader
    
    // Звуковые эффекты
    this.sounds = {
      jump: null,      // asset_0030.mp3 - при прыжке
      hit: null,       // asset_0032.mp3 - при столкновении с врагами
      collect: null,   // asset_0033.mp3 - при подборе денег
      finish: null,    // asset_0035.mp3 - финал
      bgm: null        // asset_0037.mp3 - фоновая музыка
    }
    
    // Флаг загрузки
    this.loaded = false
    
    // Громкость
    this.soundVolume = 1.0
    this.musicVolume = 0.5
    
    // Флаг разблокировки аудио (для автовоспроизведения в браузерах)
    this.audioUnlocked = false
    
    // Разблокируем аудио при первом взаимодействии пользователя
    this.setupAudioUnlock()
  }

  /**
   * Настройка разблокировки аудио при первом взаимодействии
   */
  setupAudioUnlock() {
    const unlockAudio = () => {
      if (this.audioUnlocked) return
      
      if (typeof Howler !== 'undefined' && Howler.ctx) {
        // Разблокируем аудио контекст
        Howler.ctx.resume().then(() => {
          this.audioUnlocked = true
          console.log('🔓 Аудио разблокировано пользователем')
        }).catch(err => {
          console.warn('⚠️ Не удалось разблокировать аудио:', err)
        })
      }
    }
    
    // Слушаем события взаимодействия
    const events = ['click', 'touchstart', 'keydown']
    events.forEach(event => {
      document.addEventListener(event, unlockAudio, { once: true })
    })
  }

  /**
   * Инициализация и загрузка всех звуков
   */
  async init() {
    if (this.loaded) return
    
    try {
      // Проверяем наличие Howler.js
      if (typeof Howl === 'undefined') {
        console.error('❌ Howler.js не загружен! Проверьте подключение скрипта в index.html')
        return
      }

      console.log('🔊 Инициализация AudioManager...')
      console.log('📍 Текущий путь:', window.location.pathname)
      console.log('📍 Текущий URL:', window.location.href)

      // Используем прямые пути к файлам, которые будут заменены на Data URI скриптом сборки
      // Скрипт сборки заменит эти пути на встроенные Data URI для работы на GitHub Pages
      const audioJumpPath = '../reference/reference_assets/data_uri_assets/asset_0030.mp3'
      const audioHitPath = '../reference/reference_assets/data_uri_assets/asset_0032.mp3'
      const audioCollectPath = '../reference/reference_assets/data_uri_assets/asset_0033.mp3'
      const audioFinishPath = '../reference/reference_assets/data_uri_assets/asset_0035.mp3'
      const audioBGMPath = '../reference/reference_assets/data_uri_assets/asset_0037.mp3'
      
      console.log('📁 Пути к аудио файлам (будут заменены на Data URI при сборке)')
      
      // Загружаем звуковые эффекты с обработкой ошибок
      // Важно: для звуков, которые могут воспроизводиться несколько раз подряд,
      // нужно разрешить множественное воспроизведение
      this.sounds.jump = new Howl({
        src: [audioJumpPath],
        volume: this.soundVolume,
        preload: true,
        html5: false, // Используем Web Audio API для лучшей производительности
        loop: false, // Не зацикливаем звук
        onload: () => console.log('✅ Звук прыжка загружен'),
        onloaderror: (id, error) => console.error('❌ Ошибка загрузки звука прыжка:', error),
        onplayerror: (id, error) => {
          console.error('❌ Ошибка воспроизведения звука прыжка:', error)
          // Пробуем перезагрузить звук при ошибке
          this.sounds.jump.unload()
          this.sounds.jump.load()
        }
      })
      
      this.sounds.hit = new Howl({
        src: [audioHitPath],
        volume: this.soundVolume,
        preload: true,
        html5: false,
        onload: () => console.log('✅ Звук столкновения загружен'),
        onloaderror: (id, error) => console.error('❌ Ошибка загрузки звука столкновения:', error),
        onplayerror: (id, error) => console.error('❌ Ошибка воспроизведения звука столкновения:', error)
      })
      
      this.sounds.collect = new Howl({
        src: [audioCollectPath],
        volume: this.soundVolume,
        preload: true,
        html5: false,
        onload: () => console.log('✅ Звук сбора загружен'),
        onloaderror: (id, error) => console.error('❌ Ошибка загрузки звука сбора:', error),
        onplayerror: (id, error) => console.error('❌ Ошибка воспроизведения звука сбора:', error)
      })
      
      this.sounds.finish = new Howl({
        src: [audioFinishPath],
        volume: this.soundVolume,
        preload: true,
        onload: () => console.log('✅ Звук финала загружен'),
        onloaderror: (id, error) => console.error('❌ Ошибка загрузки звука финала:', error),
        onplayerror: (id, error) => console.error('❌ Ошибка воспроизведения звука финала:', error)
      })
      
      // Фоновая музыка (зациклена)
      this.sounds.bgm = new Howl({
        src: [audioBGMPath],
        volume: this.musicVolume,
        loop: true,
        preload: true,
        onload: () => console.log('✅ Фоновая музыка загружена'),
        onloaderror: (id, error) => console.error('❌ Ошибка загрузки фоновой музыки:', error),
        onplayerror: (id, error) => console.error('❌ Ошибка воспроизведения фоновой музыки:', error)
      })
      
      this.loaded = true
      console.log('✅ AudioManager инициализирован, все звуки загружаются...')
      
      // Не ждем полной загрузки всех звуков - они загрузятся асинхронно
      // Главное - создать объекты Howl, они загрузятся автоматически
      console.log('✅ Объекты звуков созданы, загрузка начнется автоматически')
    } catch (error) {
      console.error('❌ Ошибка инициализации AudioManager:', error)
    }
  }

  /**
   * Воспроизведение звука прыжка
   */
  playJump() {
    if (!this.loaded) {
      console.warn('⚠️ AudioManager еще не загружен')
      return
    }
    if (!this.sounds.jump) {
      console.warn('⚠️ Звук прыжка не загружен')
      return
    }
    try {
      // Проверяем состояние звука
      const state = this.sounds.jump.state()
      
      // Если звук еще не загружен, ждем загрузки
      if (state === 'unloaded') {
        console.warn('⚠️ Звук прыжка еще не загружен, пытаемся загрузить...')
        this.sounds.jump.load()
        // Пробуем воспроизвести после загрузки
        this.sounds.jump.once('load', () => {
          const soundId = this.sounds.jump.play()
          console.log('🔊 Воспроизведение звука прыжка (после загрузки), ID:', soundId)
        })
        return
      }
      
      // Останавливаем все текущие воспроизведения звука прыжка перед новым
      // Это гарантирует, что звук будет воспроизведен заново каждый раз
      this.sounds.jump.stop()
      
      // Воспроизводим звук заново
      const soundId = this.sounds.jump.play()
      
      if (soundId) {
        console.log('🔊 Воспроизведение звука прыжка, ID:', soundId, 'состояние:', state)
      } else {
        console.warn('⚠️ Не удалось воспроизвести звук прыжка, play() вернул undefined')
      }
    } catch (error) {
      console.error('❌ Ошибка воспроизведения звука прыжка:', error)
    }
  }

  /**
   * Воспроизведение звука столкновения
   */
  playHit() {
    if (!this.loaded) {
      console.warn('⚠️ AudioManager еще не загружен')
      return
    }
    if (!this.sounds.hit) {
      console.warn('⚠️ Звук столкновения не загружен')
      return
    }
    try {
      const soundId = this.sounds.hit.play()
      if (soundId) {
        console.log('🔊 Воспроизведение звука столкновения, ID:', soundId)
      }
    } catch (error) {
      console.error('❌ Ошибка воспроизведения звука столкновения:', error)
    }
  }

  /**
   * Воспроизведение звука сбора коллекции
   */
  playCollect() {
    if (!this.loaded) {
      console.warn('⚠️ AudioManager еще не загружен')
      return
    }
    if (!this.sounds.collect) {
      console.warn('⚠️ Звук сбора не загружен')
      return
    }
    try {
      // Проверяем состояние звука
      const state = this.sounds.collect.state()
      
      // Если звук еще не загружен, ждем загрузки
      if (state === 'unloaded') {
        console.warn('⚠️ Звук сбора еще не загружен, пытаемся загрузить...')
        this.sounds.collect.load()
        this.sounds.collect.once('load', () => {
          const soundId = this.sounds.collect.play()
          if (soundId) {
            console.log('🔊 Воспроизведение звука сбора (после загрузки), ID:', soundId)
          }
        })
        return
      }
      
      // Останавливаем предыдущее воспроизведение перед новым (как для звука прыжка)
      this.sounds.collect.stop()
      
      // Воспроизводим звук заново
      const soundId = this.sounds.collect.play()
      
      if (soundId) {
        console.log('🔊 Воспроизведение звука сбора, ID:', soundId, 'состояние:', state)
      } else {
        console.warn('⚠️ Не удалось воспроизвести звук сбора, play() вернул undefined')
      }
    } catch (error) {
      console.error('❌ Ошибка воспроизведения звука сбора:', error)
    }
  }

  /**
   * Воспроизведение звука финала
   */
  playFinish() {
    if (!this.loaded) {
      console.warn('⚠️ AudioManager еще не загружен')
      return
    }
    if (!this.sounds.finish) {
      console.warn('⚠️ Звук финала не загружен')
      return
    }
    try {
      const soundId = this.sounds.finish.play()
      console.log('🔊 Воспроизведение звука финала, ID:', soundId)
    } catch (error) {
      console.error('❌ Ошибка воспроизведения звука финала:', error)
    }
  }

  /**
   * Запуск фоновой музыки
   */
  playBGM() {
    if (!this.loaded) {
      console.error('❌ AudioManager еще не загружен! Это критическая ошибка.')
      console.trace('Стек вызовов:')
      return
    }
    if (!this.sounds.bgm) {
      console.warn('⚠️ Фоновая музыка не загружена')
      return
    }
    
    // Разблокируем аудио если еще не разблокировано
    if (!this.audioUnlocked && typeof Howler !== 'undefined' && Howler.ctx) {
      Howler.ctx.resume().then(() => {
        this.audioUnlocked = true
        console.log('🔓 Аудио разблокировано перед воспроизведением музыки')
      }).catch(err => {
        console.warn('⚠️ Не удалось разблокировать аудио:', err)
      })
    }
    
    try {
      // Проверяем состояние загрузки
      const state = this.sounds.bgm.state()
      console.log('🎵 Состояние фоновой музыки:', state)
      
      if (state === 'unloaded') {
        console.warn('⚠️ Фоновая музыка еще не загружена, пытаемся загрузить...')
        this.sounds.bgm.load()
        // Пробуем воспроизвести после небольшой задержки
        setTimeout(() => {
          try {
            const soundId = this.sounds.bgm.play()
            console.log('🎵 Запуск фоновой музыки (после загрузки), ID:', soundId)
          } catch (err) {
            console.error('❌ Ошибка воспроизведения после загрузки:', err)
          }
        }, 500)
        return
      }
      
      const soundId = this.sounds.bgm.play()
      console.log('🎵 Запуск фоновой музыки, ID:', soundId, 'состояние:', state)
      
      // Проверяем, что звук действительно играет
      setTimeout(() => {
        if (this.sounds.bgm && !this.sounds.bgm.playing()) {
          console.warn('⚠️ Фоновая музыка не воспроизводится, возможно требуется взаимодействие пользователя')
        }
      }, 100)
    } catch (error) {
      console.error('❌ Ошибка воспроизведения фоновой музыки:', error)
    }
  }

  /**
   * Остановка фоновой музыки
   */
  stopBGM() {
    if (this.sounds.bgm && this.loaded) {
      this.sounds.bgm.stop()
    }
  }

  /**
   * Пауза фоновой музыки
   */
  pauseBGM() {
    if (this.sounds.bgm && this.loaded) {
      this.sounds.bgm.pause()
    }
  }

  /**
   * Возобновление фоновой музыки
   */
  resumeBGM() {
    if (this.sounds.bgm && this.loaded) {
      this.sounds.bgm.play()
    }
  }

  /**
   * Установка громкости звуковых эффектов
   * @param {number} volume - Громкость от 0.0 до 1.0
   */
  setSoundVolume(volume) {
    this.soundVolume = Math.max(0, Math.min(1, volume))
    Object.values(this.sounds).forEach(sound => {
      if (sound && sound !== this.sounds.bgm) {
        sound.volume(this.soundVolume)
      }
    })
  }

  /**
   * Установка громкости музыки
   * @param {number} volume - Громкость от 0.0 до 1.0
   */
  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume))
    if (this.sounds.bgm) {
      this.sounds.bgm.volume(this.musicVolume)
    }
  }

  /**
   * Остановка всех звуков
   */
  stopAll() {
    Object.values(this.sounds).forEach(sound => {
      if (sound) {
        sound.stop()
      }
    })
  }
}
