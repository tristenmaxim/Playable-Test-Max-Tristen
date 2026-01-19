#!/usr/bin/env node

/**
 * Упрощенная сборка без esbuild
 * Просто объединяет файлы и заменяет импорты на встроенный код
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

const assetMap = new Map()
const processedFiles = new Set()
const moduleExports = new Map() // имя модуля -> экспорты

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
 * Получение зависимостей файла (какие модули он импортирует)
 */
function getDependencies(filePath, content) {
  const dependencies = []
  const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"]([^'"]+)['"]/g
  
  let match
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1]
    // Пропускаем внешние импорты
    if (importPath.startsWith('http') || importPath.startsWith('https') || importPath === 'pixi.js') {
      continue
    }
    
    // Разрешаем относительный путь
    const dir = path.dirname(filePath)
    const resolvedPath = path.resolve(dir, importPath)
    dependencies.push(resolvedPath)
  }
  
  return dependencies
}

/**
 * Топологическая сортировка файлов по зависимостям
 */
function topologicalSort(files) {
  const graph = new Map()
  const inDegree = new Map()
  
  // Инициализация
  files.forEach(file => {
    graph.set(file, [])
    inDegree.set(file, 0)
  })
  
  // Построение графа зависимостей
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8')
    const deps = getDependencies(file, content)
    
    deps.forEach(dep => {
      if (graph.has(dep)) {
        graph.get(file).push(dep)
        inDegree.set(dep, (inDegree.get(dep) || 0) + 1)
      }
    })
  })
  
  // Топологическая сортировка
  const queue = []
  const result = []
  
  files.forEach(file => {
    if ((inDegree.get(file) || 0) === 0) {
      queue.push(file)
    }
  })
  
  while (queue.length > 0) {
    const file = queue.shift()
    result.push(file)
    
    graph.get(file).forEach(dep => {
      inDegree.set(dep, inDegree.get(dep) - 1)
      if (inDegree.get(dep) === 0) {
        queue.push(dep)
      }
    })
  }
  
  return result
}

/**
 * Объединение всех JS файлов
 */
function bundleJavaScript() {
  console.log('📝 Объединение JavaScript файлов...')
  
  // Находим все JS файлы
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
  console.log(`Найдено ${jsFiles.length} JS файлов`)
  
  // Сортируем по зависимостям
  let sortedFiles = topologicalSort(jsFiles)
  
  // Убеждаемся, что Constants.js идет перед App.js и другими файлами, которые его используют
  const constantsFile = sortedFiles.find(f => f.includes('Constants.js'))
  const appFile = sortedFiles.find(f => f.includes('App.js'))
  
  if (constantsFile && appFile) {
    const constantsIndex = sortedFiles.indexOf(constantsFile)
    const appIndex = sortedFiles.indexOf(appFile)
    
    if (constantsIndex > appIndex) {
      // Перемещаем Constants.js перед App.js
      sortedFiles = sortedFiles.filter((f, i) => i !== constantsIndex)
      const newAppIndex = sortedFiles.indexOf(appFile)
      sortedFiles.splice(newAppIndex, 0, constantsFile)
      console.log('⚠️  Исправлен порядок: Constants.js перемещен перед App.js')
    }
  }
  
  // Также убеждаемся, что Constants.js идет перед GameController.js
  const gameControllerFile = sortedFiles.find(f => f.includes('GameController.js'))
  if (constantsFile && gameControllerFile) {
    const constantsIndex = sortedFiles.indexOf(constantsFile)
    const gcIndex = sortedFiles.indexOf(gameControllerFile)
    
    if (constantsIndex > gcIndex) {
      sortedFiles = sortedFiles.filter((f, i) => i !== constantsIndex)
      const newGcIndex = sortedFiles.indexOf(gameControllerFile)
      sortedFiles.splice(newGcIndex, 0, constantsFile)
      console.log('⚠️  Исправлен порядок: Constants.js перемещен перед GameController.js')
    }
  }
  
  // Собираем все импорты из pixi.js
  const pixiImports = new Set()
  
  sortedFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf-8')
    const importMatches = content.matchAll(/import\s+\{([^}]+)\}\s+from\s+['"]pixi\.js['"]/g)
    for (const match of importMatches) {
      const imports = match[1].split(',').map(i => i.trim())
      imports.forEach(imp => pixiImports.add(imp))
    }
  })
  
  // Создаем единый импорт из pixi.js
  const pixiImportLine = pixiImports.size > 0 
    ? `import { ${Array.from(pixiImports).join(', ')} } from 'pixi.js'\n`
    : ''
  
  // Объединяем файлы
  let bundledCode = pixiImportLine + '\n\n// === Начало выполнения модуля ===\nconsole.log("🚀 Модуль начал выполнение...")\n'
  
  sortedFiles.forEach(filePath => {
    if (processedFiles.has(filePath)) return
    
    processedFiles.add(filePath)
    let content = fs.readFileSync(filePath, 'utf-8')
    
    // Заменяем пути к ассетам
    content = replaceAssetPaths(content)
    
    // Заменяем экспорты на глобальные объявления
    content = content.replace(/export\s+class\s+/g, 'class ')
    content = content.replace(/export\s+const\s+/g, 'const ')
    content = content.replace(/export\s+function\s+/g, 'function ')
    content = content.replace(/export\s+\{[^}]*\}\s*;?/g, '')
    content = content.replace(/export\s+default\s+/g, '')
    
    // Удаляем все импорты (включая pixi.js, так как он уже в начале файла)
    // Важно: удаляем импорты из pixi.js, чтобы избежать дубликатов
    const importRegex = /import\s+(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+['"]([^'"]+)['"];?\s*/g
    content = content.replace(importRegex, (match, importPath) => {
      // Удаляем все импорты, включая pixi.js (он уже в начале файла)
      return '// Импорт удален - код встроен\n'
    })
    
    // Заменяем динамические импорты import() - просто удаляем их
    // Классы уже доступны глобально после объединения файлов
    const dynamicImportRegex = /const\s+\{([^}]+)\}\s*=\s*await\s+import\(['"]([^'"]+)['"]\);?\s*/g
    content = content.replace(dynamicImportRegex, (match, imports, importPath) => {
      // Просто удаляем строку - классы уже доступны глобально
      // Не создаем переменные, так как классы уже определены выше
      return '// Динамический импорт удален - классы уже встроены в бандл\n    '
    })
    
    // Удаляем некорректные строки вида "const ClassName = ClassName"
    content = content.replace(/const\s+(\w+)\s*=\s*\1\s*\/\/\s*Класс уже встроен в бандл\s*/g, '// Класс уже доступен глобально\n    ')
    
    const relativePath = path.relative(SRC_DIR, filePath)
    bundledCode += `\n// === ${relativePath} ===\n${content}\n`
  })
  
  return bundledCode
}

/**
 * Извлечение entry point из HTML
 */
function extractEntryJS() {
  const htmlPath = path.join(GAME_DIR, 'index.html')
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8')
  
  const scriptMatch = htmlContent.match(/<script type="module">([\s\S]*?)<\/script>/)
  if (scriptMatch) {
    let entryCode = scriptMatch[1]
    // Удаляем импорт App - он будет доступен глобально
    entryCode = entryCode.replace(/import\s+\{[^}]*App[^}]*\}\s+from\s+['"][^'"]+['"];?\s*/g, '')
    return entryCode
  }
  
  return ''
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

/**
 * Главная функция сборки
 */
async function buildBundle() {
  console.log('🚀 Начало сборки (упрощенная версия)...\n')
  
  try {
    // 1. Конвертируем ассеты
    convertAssets()
    
    // 2. Извлекаем CSS
    const cssCode = extractCSS()
    console.log(`✅ CSS извлечен (${cssCode.length} символов)`)
    
    // 3. Объединяем JavaScript
    const bundledJS = bundleJavaScript()
    const entryJS = extractEntryJS()
    
    // 4. Объединяем весь JS код (entry point в конце, после всех объявлений)
    // Переименовываем init в initGame в entryJS
    let modifiedEntryJS = entryJS.replace(/async function init\(\)/g, 'async function initGame()')
    // Заменяем только вызовы функции init() (не методы объектов)
    // Используем замену с проверкой: заменяем init() только если перед ним нет точки
    modifiedEntryJS = modifiedEntryJS.replace(/([^.\w])init\(\)/g, '$1initGame()')
    // Также заменяем init() в начале строки или после пробела/табуляции
    modifiedEntryJS = modifiedEntryJS.replace(/^\s*init\(\)/gm, 'initGame()')
    // Удаляем весь старый блок вызова init() - от комментария "// Ждем загрузки Howler.js" до конца
    modifiedEntryJS = modifiedEntryJS.replace(/\s*\/\/\s*Ждем загрузки Howler\.js[\s\S]*?window\.addEventListener\([^}]*\}\)\s*\}\s*$/gm, '')
    
    // Добавляем детальное логирование в функцию initGame
    modifiedEntryJS = modifiedEntryJS.replace(
      /const app = new App\(\)/,
      `console.log('📦 Создание экземпляра App...')
        const app = new App()
        console.log('✅ App создан:', app)`
    )
    modifiedEntryJS = modifiedEntryJS.replace(
      /await app\.init\(\)/,
      `console.log('🚀 Запуск app.init()...')
        await app.init()
        console.log('✅ app.init() завершен')`
    )
    // Добавляем детальное логирование ошибок и вывод на страницу
    modifiedEntryJS = modifiedEntryJS.replace(
      /console\.error\('Failed to initialize game:', error\)[\s\S]*?document\.getElementById\('preloader'\)\.innerHTML[\s\S]*?<\/div>['"]/,
      `console.error('Failed to initialize game:', error)
        console.error('Error stack:', error.stack)
        console.error('Error message:', error.message)
        console.error('Error name:', error.name)
        const errorMsg = error.message || 'Unknown error'
        const errorStack = error.stack || 'No stack trace'
        document.getElementById('preloader').innerHTML = 
          '<div class="preloader-content" style="color: #ff0000; padding: 20px; text-align: left; max-width: 800px; margin: 0 auto;">' +
          '<div style="font-size: 18px; margin-bottom: 10px;">Ошибка загрузки игры</div>' +
          '<div style="font-size: 12px; color: #ffaaaa; margin-bottom: 5px;">' + errorMsg + '</div>' +
          '<div style="font-size: 10px; color: #ff8888; white-space: pre-wrap; max-height: 300px; overflow: auto;">' + errorStack.substring(0, 500) + '</div>' +
          '</div>'`
    )
    
    // Добавляем детальное логирование для отладки
    const debugCode = `
    // Детальное логирование для отладки
    console.log('🔍 Проверка доступности классов и модулей...')
    console.log('CONSTANTS доступен:', typeof CONSTANTS !== 'undefined' ? '✅' : '❌', CONSTANTS)
    console.log('initDynamicConstants доступна:', typeof initDynamicConstants !== 'undefined' ? '✅' : '❌', initDynamicConstants)
    console.log('App доступен:', typeof App !== 'undefined' ? '✅' : '❌', App)
    console.log('Container доступен:', typeof Container !== 'undefined' ? '✅' : '❌', Container)
    console.log('Application доступен:', typeof Application !== 'undefined' ? '✅' : '❌', Application)
    console.log('AssetLoader доступен:', typeof AssetLoader !== 'undefined' ? '✅' : '❌')
    console.log('GameController доступен:', typeof GameController !== 'undefined' ? '✅' : '❌')
    `
    
    const fullJSCode = bundledJS + '\n\n// === Entry Point ===\n' + debugCode + modifiedEntryJS + '\n\n// Запускаем инициализацию после загрузки модуля\nif (typeof Howl !== \'undefined\') {\n  initGame()\n} else {\n  window.addEventListener(\'load\', () => {\n    setTimeout(() => {\n      if (!checkHowler()) {\n        console.warn(\'⚠️ Howler.js все еще не загружен, продолжаем без проверки\')\n      }\n      initGame()\n    }, 100)\n  })\n}'
    
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
    } else {
      console.log(`\n✅ Размер в пределах лимита (≤ 5 МБ)`)
    }
    
    console.log(`\n⚠️  ВАЖНО: Текущая версия использует упрощенную сборку.`)
    console.log(`   Для продакшена рекомендуется использовать esbuild с правильной настройкой.`)
    
  } catch (error) {
    console.error('❌ Ошибка сборки:', error)
    process.exit(1)
  }
}

// Запуск сборки
buildBundle()
