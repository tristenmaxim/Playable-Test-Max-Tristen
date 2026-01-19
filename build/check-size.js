#!/usr/bin/env node

/**
 * Скрипт проверки размера финального файла
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const OUTPUT_FILE = path.join(__dirname, '..', 'playable_game.html')
const MAX_SIZE_MB = 5

function checkSize() {
  if (!fs.existsSync(OUTPUT_FILE)) {
    console.error(`❌ Файл не найден: ${OUTPUT_FILE}`)
    console.error('   Запустите сборку: npm run build')
    process.exit(1)
  }

  const stats = fs.statSync(OUTPUT_FILE)
  const sizeMB = stats.size / (1024 * 1024)
  const sizeKB = stats.size / 1024

  console.log('\n📊 Проверка размера файла:')
  console.log(`   Файл: ${OUTPUT_FILE}`)
  console.log(`   Размер: ${sizeMB.toFixed(2)} МБ (${sizeKB.toFixed(2)} КБ)`)
  console.log(`   Лимит: ${MAX_SIZE_MB} МБ`)

  if (sizeMB > MAX_SIZE_MB) {
    const overage = ((sizeMB - MAX_SIZE_MB) / MAX_SIZE_MB * 100).toFixed(1)
    console.error(`\n❌ ПРЕВЫШЕН ЛИМИТ!`)
    console.error(`   Превышение на: ${overage}%`)
    console.error(`   Требуется оптимизация!`)
    process.exit(1)
  } else {
    const remaining = ((MAX_SIZE_MB - sizeMB) / MAX_SIZE_MB * 100).toFixed(1)
    console.log(`\n✅ Размер в пределах лимита`)
    console.log(`   Осталось места: ${remaining}%`)
    process.exit(0)
  }
}

checkSize()
