#!/usr/bin/env node

/**
 * Правильная сборка с использованием esbuild
 * Разрешает все импорты и создает единый бандл
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { build } from 'esbuild'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT_DIR = path.resolve(__dirname, '..')
const GAME_DIR = path.join(ROOT_DIR, 'game')
const SRC_DIR = path.join(GAME_DIR, 'src')
const ASSETS_DIR = path.join(ROOT_DIR, 'reference', 'reference_assets', 'data_uri_assets')
const OUTPUT_FILE = path.join(ROOT_DIR, 'playable_game.html')
const TEMP_JS_FILE = path.join(ROOT_DIR, 'temp_bundle.js')

// Карта для отслеживания ассетов
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
 * Определение MIME типа
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
    '.ttf': 'font/ttf'
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
 * Замена путей к ассетам на data URI
 */
function replaceAssetPaths(content) {
  let result = content
  
  assetMap.forEach((dataURI, assetPath) => {
    const escapedPath = assetPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const patterns = [
      new RegExp(`['"]${escapedPath}['"]`, 'g'),
      new RegExp(`url\\(['"]?${escapedPath}['"]?\\)`, 'g')
    ]
    
    patterns.forEach(pattern => {
      result = result.replace(pattern, (match) => {
        if (match.includes('url(')) {
          return `url('${dataURI}')`
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
 * Извлечение entry point из HTML
 */
function getEntryPoint() {
  return path.join(SRC_DIR, 'core', 'App.js')
}

/**
 * Главная функция сборки
 */
async function buildBundle() {
  console.log('🚀 Начало сборки с esbuild...\n')
  
  try {
    // 1. Конвертируем ассеты
    convertAssets()
    
    // 2. Извлекаем CSS
    const cssCode = extractCSS()
    console.log(`✅ CSS извлечен (${cssCode.length} символов)`)
    
    // 3. Собираем JS с помощью esbuild
    console.log('📦 Сборка JavaScript с esbuild...')
    
    const entryPoint = getEntryPoint()
    
    await build({
      entryPoints: [entryPoint],
      bundle: true,
      format: 'esm', // Используем ESM формат
      platform: 'browser',
      outfile: TEMP_JS_FILE,
      external: ['pixi.js'], // PixiJS загружается через CDN через importmap
      minify: false, // Пока без минификации для отладки
      sourcemap: false,
      treeShaking: true,
      target: 'es2020',
      resolveExtensions: ['.js', '.mjs'],
      alias: {
        // Алиасы для путей
      }
    })
    
    console.log('✅ JavaScript собран')
    
    // 4. Читаем собранный JS
    let jsCode = fs.readFileSync(TEMP_JS_FILE, 'utf-8')
    
    // 5. Заменяем пути к ассетам в JS
    jsCode = replaceAssetPaths(jsCode)
    
    // 6. Исправляем импорты pixi.js - заменяем на правильный импорт через importmap
    // esbuild создает import_pixi, но нам нужно использовать обычный импорт
    jsCode = jsCode.replace(/import\s+\*\s+as\s+import_pixi\s+from\s+['"]pixi\.js['"]/g, 'import * as import_pixi from "pixi.js"')
    
    // 7. Добавляем entry point код из HTML
    const htmlPath = path.join(GAME_DIR, 'index.html')
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8')
    const scriptMatch = htmlContent.match(/<script type="module">([\s\S]*?)<\/script>/)
    
    if (scriptMatch) {
      let entryCode = scriptMatch[1]
      // Удаляем импорт App, так как он уже в бандле
      entryCode = entryCode.replace(/import\s+\{[^}]*App[^}]*\}\s+from\s+['"][^'"]+['"];?\s*/g, '')
      // Добавляем entry code после бандла
      jsCode = jsCode + '\n\n// === Entry Point ===\n' + entryCode
    }
    
    // 7. Создаем HTML
    const html = createHTML(jsCode, cssCode)
    
    // 8. Сохраняем результат
    fs.writeFileSync(OUTPUT_FILE, html, 'utf-8')
    
    // 9. Удаляем временный файл
    if (fs.existsSync(TEMP_JS_FILE)) {
      fs.unlinkSync(TEMP_JS_FILE)
    }
    
    // 10. Проверяем размер
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
    
  } catch (error) {
    console.error('❌ Ошибка сборки:', error)
    if (fs.existsSync(TEMP_JS_FILE)) {
      fs.unlinkSync(TEMP_JS_FILE)
    }
    process.exit(1)
  }
}

/**
 * Создание финального HTML
 */
function createHTML(jsCode, cssCode) {
  return `<!DOCTYPE html>
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
}

// Запуск сборки
buildBundle()
