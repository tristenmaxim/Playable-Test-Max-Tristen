#!/usr/bin/env node

/**
 * Скрипт сборки единого HTML-файла
 * Объединяет все JS модули, конвертирует ассеты в data URI и создает единый HTML
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const require = createRequire(import.meta.url)

const ROOT_DIR = path.resolve(__dirname, '..')
const GAME_DIR = path.join(ROOT_DIR, 'game')
const SRC_DIR = path.join(GAME_DIR, 'src')
const ASSETS_DIR = path.join(ROOT_DIR, 'reference', 'reference_assets', 'data_uri_assets')
const OUTPUT_FILE = path.join(ROOT_DIR, 'playable_game.html')

// Карта для отслеживания обработанных файлов
const processedFiles = new Set()
const assetMap = new Map() // путь → data URI

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
    '.woff2': 'font/woff2',
    '.js': 'application/javascript',
    '.css': 'text/css'
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

/**
 * Рекурсивный поиск всех JS файлов
 */
function findJSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir)
  
  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory()) {
      findJSFiles(filePath, fileList)
    } else if (file.endsWith('.js')) {
      fileList.push(filePath)
    }
  })
  
  return fileList
}

/**
 * Обработка импортов в JS файле
 */
function processImports(content, filePath) {
  // Заменяем относительные импорты
  const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"]([^'"]+)['"]/g
  
  return content.replace(importRegex, (match, importPath) => {
    // Пропускаем внешние импорты (CDN, node_modules)
    if (importPath.startsWith('http') || importPath.startsWith('https') || importPath.startsWith('pixi.js')) {
      return match
    }
    
    // Обрабатываем относительные пути
    const dir = path.dirname(filePath)
    const resolvedPath = path.resolve(dir, importPath)
    
    // Если файл уже обработан, возвращаем оригинальный импорт (будет заменен позже)
    if (processedFiles.has(resolvedPath)) {
      return match
    }
    
    return match // Пока оставляем как есть, обработаем позже
  })
}

/**
 * Загрузка внешних библиотек
 */
async function loadExternalLibraries() {
  const libraries = {
    gsap: 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js',
    howler: 'https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.4/howler.min.js',
    pixi: 'https://cdn.jsdelivr.net/npm/pixi.js@8.0.0/dist/pixi.mjs'
  }
  
  console.log('📦 Загрузка внешних библиотек...')
  
  // В продакшене нужно будет встроить эти библиотеки
  // Пока оставляем через CDN для разработки
  return libraries
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
        // Сохраняем относительный путь как ключ
        const relativePath = `../reference/reference_assets/data_uri_assets/${file}`
        assetMap.set(relativePath, dataURI)
        assetMap.set(`../../reference/reference_assets/data_uri_assets/${file}`, dataURI)
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
    // Заменяем различные варианты путей
    const patterns = [
      new RegExp(`['"]${assetPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g'),
      new RegExp(`url\\(${assetPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g')
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
 * Объединение всех JS файлов
 */
function bundleJavaScript() {
  console.log('📝 Объединение JavaScript файлов...')
  
  const jsFiles = findJSFiles(SRC_DIR)
  console.log(`Найдено ${jsFiles.length} JS файлов`)
  
  let bundledCode = ''
  
  // Начинаем с точки входа
  const entryPoint = path.join(SRC_DIR, 'core', 'App.js')
  
  function processFile(filePath) {
    if (processedFiles.has(filePath)) {
      return ''
    }
    
    processedFiles.add(filePath)
    
    let content = fs.readFileSync(filePath, 'utf-8')
    
    // Заменяем пути к ассетам
    content = replaceAssetPaths(content)
    
    // Обрабатываем импорты (пока просто добавляем файл)
    // В будущем нужно будет правильно обрабатывать зависимости
    
    return `\n// === ${path.relative(SRC_DIR, filePath)} ===\n${content}\n`
  }
  
  // Обрабатываем все файлы
  jsFiles.forEach(file => {
    bundledCode += processFile(file)
  })
  
  return bundledCode
}

/**
 * Создание финального HTML
 */
function createHTML(jsCode, cssCode) {
  console.log('🏗️  Создание HTML файла...')
  
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

/**
 * Извлечение CSS из HTML
 */
function extractCSS() {
  const htmlPath = path.join(GAME_DIR, 'index.html')
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8')
  
  // Извлекаем содержимое тега <style>
  const styleMatch = htmlContent.match(/<style>([\s\S]*?)<\/style>/)
  if (styleMatch) {
    let css = styleMatch[1]
    
    // Заменяем пути к ассетам в CSS
    css = replaceAssetPaths(css)
    
    return css
  }
  
  return ''
}

/**
 * Извлечение и обработка JS из HTML
 */
function extractJS() {
  const htmlPath = path.join(GAME_DIR, 'index.html')
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8')
  
  // Извлекаем содержимое тега <script type="module">
  const scriptMatch = htmlContent.match(/<script type="module">([\s\S]*?)<\/script>/)
  if (scriptMatch) {
    return scriptMatch[1]
  }
  
  return ''
}

/**
 * Главная функция сборки
 */
async function build() {
  console.log('🚀 Начало сборки...\n')
  
  try {
    // 1. Конвертируем ассеты
    convertAssets()
    
    // 2. Извлекаем CSS
    const cssCode = extractCSS()
    console.log(`✅ CSS извлечен (${cssCode.length} символов)`)
    
    // 3. Объединяем JavaScript
    const bundledJS = bundleJavaScript()
    const entryJS = extractJS()
    
    // 4. Объединяем весь JS код
    const fullJSCode = entryJS + '\n\n' + bundledJS
    
    // 5. Создаем HTML
    const html = createHTML(fullJSCode, cssCode)
    
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
      console.warn(`   Требуется дополнительная оптимизация.`)
    } else {
      console.log(`\n✅ Размер в пределах лимита (≤ 5 МБ)`)
    }
    
  } catch (error) {
    console.error('❌ Ошибка сборки:', error)
    process.exit(1)
  }
}

// Запуск сборки
build()
