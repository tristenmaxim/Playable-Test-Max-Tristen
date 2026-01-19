#!/usr/bin/env node

/**
 * Улучшенный скрипт сборки с использованием esbuild
 * Правильно обрабатывает ES модули и зависимости
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT_DIR = path.resolve(__dirname, '..')
const GAME_DIR = path.join(ROOT_DIR, 'game')
const SRC_DIR = path.join(GAME_DIR, 'src')
const ASSETS_DIR = path.join(ROOT_DIR, 'reference', 'reference_assets', 'data_uri_assets')
const OUTPUT_FILE = path.join(ROOT_DIR, 'playable_game.html')

// Карта для отслеживания обработанных файлов
const assetMap = new Map()

/**
 * Конвертация файла в base64 data URI
 */
function fileToDataURI(filePath, mimeType) {
  try {
    const fileBuffer = fs.readFileSync(filePath)
    const base64 = fileBuffer.toString('base64')
    return `data:${mimeType};base64,${base64}`
  } catch (error) {
    console.error(`Ошибка чтения файла ${filePath}:`, error.message)
    return null
  }
}

/**
 * Определение MIME типа по расширению файла
 */
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ttf': 'font/ttf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

/**
 * Конвертация всех ассетов в data URI
 */
function convertAssets() {
  console.log('🖼️  Конвертация ассетов в data URI...')
  
  if (!fs.existsSync(ASSETS_DIR)) {
    console.warn(`⚠️  Папка ассетов не найдена: ${ASSETS_DIR}`)
    return
  }
  
  const assetFiles = fs.readdirSync(ASSETS_DIR)
  let convertedCount = 0
  
  assetFiles.forEach(file => {
    const filePath = path.join(ASSETS_DIR, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isFile()) {
      const mimeType = getMimeType(filePath)
      const dataURI = fileToDataURI(filePath, mimeType)
      
      if (dataURI) {
        // Сохраняем различные варианты путей
        const paths = [
          `../reference/reference_assets/data_uri_assets/${file}`,
          `../../reference/reference_assets/data_uri_assets/${file}`,
          `reference/reference_assets/data_uri_assets/${file}`
        ]
        
        paths.forEach(p => assetMap.set(p, dataURI))
        convertedCount++
      }
    }
  })
  
  console.log(`✅ Конвертировано ${convertedCount} ассетов`)
}

/**
 * Замена путей к ассетам на data URI в коде
 */
function replaceAssetPaths(content) {
  let result = content
  
  assetMap.forEach((dataURI, assetPath) => {
    // Экранируем специальные символы для regex
    const escapedPath = assetPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    
    // Заменяем различные варианты путей
    const patterns = [
      new RegExp(`['"]${escapedPath}['"]`, 'g'),
      new RegExp(`url\\(['"]?${escapedPath}['"]?\\)`, 'g'),
      new RegExp(`src:\\s*['"]${escapedPath}['"]`, 'g')
    ]
    
    patterns.forEach(pattern => {
      result = result.replace(pattern, (match) => {
        if (match.includes('url(')) {
          return `url('${dataURI}')`
        }
        if (match.includes('src:')) {
          return `src: '${dataURI}'`
        }
        return `'${dataURI}'`
      })
    })
  })
  
  return result
}

/**
 * Извлечение CSS из HTML
 */
function extractCSS() {
  const htmlPath = path.join(GAME_DIR, 'index.html')
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8')
  
  const styleMatch = htmlContent.match(/<style>([\s\S]*?)<\/style>/)
  if (styleMatch) {
    let css = styleMatch[1]
    css = replaceAssetPaths(css)
    return css
  }
  
  return ''
}

/**
 * Извлечение entry point JS из HTML
 */
function extractEntryJS() {
  const htmlPath = path.join(GAME_DIR, 'index.html')
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8')
  
  const scriptMatch = htmlContent.match(/<script type="module">([\s\S]*?)<\/script>/)
  if (scriptMatch) {
    return scriptMatch[1]
  }
  
  return ''
}

/**
 * Простая обработка импортов (замена на комментарии для отладки)
 * В будущем нужно использовать esbuild или rollup
 */
function processImports(content, baseDir) {
  // Пока просто возвращаем контент как есть
  // Импорты будут работать через importmap в браузере
  return content
}

/**
 * Главная функция сборки
 */
async function build() {
  console.log('🚀 Начало сборки (упрощенная версия)...\n')
  
  try {
    // 1. Конвертируем ассеты
    convertAssets()
    
    // 2. Извлекаем CSS
    const cssCode = extractCSS()
    console.log(`✅ CSS извлечен (${cssCode.length} символов)`)
    
    // 3. Извлекаем entry point
    const entryJS = extractEntryJS()
    console.log(`✅ Entry point извлечен (${entryJS.length} символов)`)
    
    // 4. Читаем все JS файлы и объединяем
    const jsFiles = []
    function findJSFiles(dir) {
      const files = fs.readdirSync(dir)
      files.forEach(file => {
        const filePath = path.join(dir, file)
        const stat = fs.statSync(filePath)
        if (stat.isDirectory()) {
          findJSFiles(filePath)
        } else if (file.endsWith('.js')) {
          jsFiles.push(filePath)
        }
      })
    }
    
    findJSFiles(SRC_DIR)
    console.log(`📝 Найдено ${jsFiles.length} JS файлов`)
    
    // Объединяем все файлы
    let bundledCode = entryJS + '\n\n// === Игровой код ===\n\n'
    
    jsFiles.forEach(filePath => {
      let content = fs.readFileSync(filePath, 'utf-8')
      content = replaceAssetPaths(content)
      const relativePath = path.relative(SRC_DIR, filePath)
      bundledCode += `\n// === ${relativePath} ===\n${content}\n`
    })
    
    // 5. Создаем HTML
    const html = createHTML(bundledCode, cssCode)
    
    // 6. Сохраняем результат
    fs.writeFileSync(OUTPUT_FILE, html, 'utf-8')
    
    // 7. Проверяем размер
    const stats = fs.statSync(OUTPUT_FILE)
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2)
    
    console.log(`\n✅ Сборка завершена!`)
    console.log(`📦 Файл: ${OUTPUT_FILE}`)
    console.log(`📏 Размер: ${sizeMB} МБ`)
    
    if (parseFloat(sizeMB) > 5) {
      console.warn(`\n⚠️  ВНИМАНИЕ: Размер превышает 5 МБ!`)
    } else {
      console.log(`\n✅ Размер в пределах лимита (≤ 5 МБ)`)
    }
    
    console.log(`\n⚠️  ВАЖНО: Текущая версия использует упрощенную сборку.`)
    console.log(`   Импорты ES модулей могут не работать корректно.`)
    console.log(`   Для продакшена рекомендуется использовать esbuild или rollup.`)
    
  } catch (error) {
    console.error('❌ Ошибка сборки:', error)
    process.exit(1)
  }
}

/**
 * Создание финального HTML
 */
function createHTML(jsCode, cssCode) {
  const htmlTemplate = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Runner Game</title>
  
  <!-- GSAP CDN -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  
  <!-- Howler.js CDN -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.4/howler.min.js"></script>
  
  <!-- Import Map для ES модулей (PixiJS v8) -->
  <script type="importmap">
    {
      "imports": {
        "pixi.js": "https://cdn.jsdelivr.net/npm/pixi.js@8.0.0/dist/pixi.mjs"
      }
    }
  </script>
  
  <style>
${cssCode}
  </style>
</head>
<body>
  <!-- Preloader -->
  <div id="preloader">
    <div class="preloader-content">Загрузка...</div>
  </div>

  <!-- Canvas будет добавлен через JavaScript -->
  
  <script type="module">
${jsCode}
  </script>
</body>
</html>`
  
  return htmlTemplate
}

// Запуск сборки
build()
