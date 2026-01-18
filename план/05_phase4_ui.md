# Фаза 4: UI система

## Цель

Реализовать все UI элементы: HP Display, Score Display, Tutorial Overlay, End Screens, CTA интеграция.

---

## Задачи

### 1. UIManager класс

#### Задача 1.1: Базовый класс
```javascript
class UIManager {
  constructor() {
    this.hpDisplay = null
    this.scoreDisplay = null
    this.tutorialOverlay = null
    this.endOverlay = null
    this.failOverlay = null
    this.ctaButton = null
  }
  
  init() {
    this.createHPDisplay()
    this.createScoreDisplay()
    this.createTutorialOverlay()
    this.createEndOverlay()
    this.createFailOverlay()
    this.setupResponsiveScaling()
  }
}
```

**Чеклист:**
- [ ] Класс создаётся
- [ ] Все элементы создаются
- [ ] Responsive работает

---

### 2. HP Display

#### Задача 2.1: Создание HP Display
```javascript
createHPDisplay() {
  const container = document.createElement('div')
  container.className = 'hp-display'
  container.style.position = 'absolute'
  container.style.top = '20px'
  container.style.left = '20px'
  container.style.zIndex = '1000'
  container.style.display = 'flex'
  container.style.gap = '5px'
  
  this.hpHearts = []
  for (let i = 0; i < CONSTANTS.HEALTH.MAX; i++) {
    const heart = document.createElement('div')
    heart.className = 'heart'
    heart.style.width = '30px'
    heart.style.height = '30px'
    heart.style.backgroundImage = `url('${ASSETS.images.heart}')`
    heart.style.backgroundSize = 'contain'
    heart.style.backgroundRepeat = 'no-repeat'
    this.hpHearts.push(heart)
    container.appendChild(heart)
  }
  
  this.hpDisplay = container
  document.body.appendChild(container)
}
```

**Чеклист:**
- [ ] Контейнер создаётся
- [ ] Сердечки создаются
- [ ] Позиционирование корректное
- [ ] Стили применяются

#### Задача 2.2: Обновление HP
```javascript
updateHP(hp) {
  this.hpHearts.forEach((heart, index) => {
    heart.style.opacity = index < hp ? '1' : '0.3'
  })
  
  // Анимация пульсации
  if (hp < CONSTANTS.HEALTH.MAX) {
    this.hpDisplay.classList.add('pulse')
    setTimeout(() => {
      this.hpDisplay.classList.remove('pulse')
    }, 200)
  }
}
```

**Чеклист:**
- [ ] HP обновляется визуально
- [ ] Анимация пульсации работает
- [ ] Обновление происходит мгновенно

---

### 3. Score Display

#### Задача 3.1: Создание Score Display
```javascript
createScoreDisplay() {
  const container = document.createElement('div')
  container.className = 'score-container'
  container.style.position = 'absolute'
  container.style.top = '20px'
  container.style.right = '20px'
  container.style.zIndex = '1000'
  container.style.fontSize = '28px'
  container.style.fontWeight = 'bold'
  container.style.color = '#fff'
  container.style.fontFamily = 'Arial, sans-serif'
  
  const display = document.createElement('div')
  display.className = 'score-display'
  display.textContent = `${CONSTANTS.SCORE.CURRENCY_SYMBOL}${CONSTANTS.SCORE.START_BALANCE}`
  
  container.appendChild(display)
  this.scoreContainer = container
  this.scoreDisplay = display
  document.body.appendChild(container)
}
```

**Чеклист:**
- [ ] Контейнер создаётся
- [ ] Текст отображается
- [ ] Позиционирование корректное
- [ ] Стили применяются

#### Задача 3.2: Обновление Score
```javascript
updateScore(score) {
  this.scoreDisplay.textContent = `${CONSTANTS.SCORE.CURRENCY_SYMBOL}${Math.floor(score)}`
  this.fitTextToContainer(this.scoreDisplay, 28, 12)
  
  // Анимация пульсации
  this.scoreContainer.classList.add('pulse')
  setTimeout(() => {
    this.scoreContainer.classList.remove('pulse')
  }, 200)
}

fitTextToContainer(element, maxSize, minSize) {
  let fontSize = maxSize
  element.style.fontSize = `${fontSize}px`
  const containerWidth = element.parentElement.offsetWidth
  
  while (element.scrollWidth > containerWidth && fontSize > minSize) {
    fontSize -= 1
    element.style.fontSize = `${fontSize}px`
  }
}
```

**Чеклист:**
- [ ] Score обновляется
- [ ] Адаптация размера текста работает
- [ ] Анимация пульсации работает

#### Задача 3.3: Анимация летящих коллекций
```javascript
animateFlyingCollectible(position, type) {
  const element = document.createElement('div')
  element.className = 'flying-collectible'
  element.textContent = type === 'dollar' ? '$' : '💳'
  element.style.position = 'absolute'
  element.style.left = `${position.x}px`
  element.style.top = `${position.y}px`
  element.style.fontSize = '24px'
  element.style.color = '#FFD700'
  element.style.pointerEvents = 'none'
  element.style.zIndex = '2000'
  
  const targetX = this.scoreContainer.offsetLeft + this.scoreContainer.offsetWidth / 2
  const targetY = this.scoreContainer.offsetTop + this.scoreContainer.offsetHeight / 2
  
  document.body.appendChild(element)
  
  gsap.to(element, {
    x: targetX - position.x,
    y: targetY - position.y,
    scale: 0.5,
    opacity: 0,
    duration: 0.4,
    ease: 'power2.in',
    onComplete: () => {
      element.remove()
      this.scoreContainer.classList.add('pulse')
    }
  })
}
```

**Чеклист:**
- [ ] Элемент создаётся
- [ ] Анимация работает
- [ ] Удаление происходит корректно

---

### 4. Tutorial Overlay

#### Задача 4.1: Создание Tutorial Overlay
```javascript
createTutorialOverlay() {
  const overlay = document.createElement('div')
  overlay.className = 'tutorial-overlay'
  overlay.style.position = 'absolute'
  overlay.style.inset = '0'
  overlay.style.zIndex = '2000'
  overlay.style.display = 'none'
  overlay.style.flexDirection = 'column'
  overlay.style.alignItems = 'center'
  overlay.style.justifyContent = 'center'
  overlay.style.background = 'rgba(0, 0, 0, 0.7)'
  
  const text = document.createElement('div')
  text.className = 'tutorial-text'
  text.style.fontSize = '32px'
  text.style.fontWeight = 'bold'
  text.style.color = '#fff'
  text.style.textAlign = 'center'
  text.style.padding = '20px'
  
  overlay.appendChild(text)
  this.tutorialOverlay = overlay
  this.tutorialText = text
  document.body.appendChild(overlay)
}
```

**Чеклист:**
- [ ] Overlay создаётся
- [ ] Текст создаётся
- [ ] Стили применяются

#### Задача 4.2: Показ/Скрытие туториала
```javascript
showTutorial(type) {
  const messages = {
    start: 'Tap to start!',
    enemy: 'Tap to jump and avoid enemies!',
    obstacle: 'Jump over obstacles!',
    collectible: 'Collect money!'
  }
  
  this.tutorialText.textContent = messages[type] || messages.start
  this.tutorialOverlay.style.display = 'flex'
  
  gsap.from(this.tutorialOverlay, {
    opacity: 0,
    duration: 0.3,
    ease: 'power2.out'
  })
}

hideTutorial() {
  gsap.to(this.tutorialOverlay, {
    opacity: 0,
    duration: 0.3,
    ease: 'power2.in',
    onComplete: () => {
      this.tutorialOverlay.style.display = 'none'
    }
  })
}
```

**Чеклист:**
- [ ] Показ работает
- [ ] Скрытие работает
- [ ] Анимации работают
- [ ] Сообщения корректные

---

### 5. End Screens

#### Задача 5.1: Создание End Overlay (победа)
```javascript
createEndOverlay() {
  const overlay = document.createElement('div')
  overlay.className = 'end-overlay'
  overlay.style.position = 'absolute'
  overlay.style.inset = '0'
  overlay.style.zIndex = '3000'
  overlay.style.display = 'none'
  overlay.style.flexDirection = 'column'
  overlay.style.alignItems = 'center'
  overlay.style.justifyContent = 'center'
  overlay.style.background = 'rgba(0, 0, 0, 0.9)'
  
  const title = document.createElement('div')
  title.className = 'end-title'
  title.style.fontSize = '48px'
  title.style.fontWeight = 'bold'
  title.style.color = '#FFD700'
  title.style.marginBottom = '20px'
  title.textContent = 'You Win!'
  
  const score = document.createElement('div')
  score.className = 'end-score'
  score.style.fontSize = '32px'
  score.style.color = '#fff'
  score.style.marginBottom = '40px'
  
  const paypalCard = document.createElement('div')
  paypalCard.className = 'paypal-card'
  paypalCard.style.width = '300px'
  paypalCard.style.height = '200px'
  paypalCard.style.background = 'linear-gradient(135deg, #0070ba 0%, #009cde 100%)'
  paypalCard.style.borderRadius = '10px'
  paypalCard.style.padding = '20px'
  paypalCard.style.marginBottom = '40px'
  
  const ctaButton = document.createElement('button')
  ctaButton.className = 'cta-button'
  ctaButton.textContent = 'Download Now'
  ctaButton.style.padding = '15px 30px'
  ctaButton.style.fontSize = '20px'
  ctaButton.style.fontWeight = 'bold'
  ctaButton.style.color = '#fff'
  ctaButton.style.background = 'linear-gradient(135deg, #FF9500 0%, #FF6B00 100%)'
  ctaButton.style.border = 'none'
  ctaButton.style.borderRadius = '25px'
  ctaButton.style.cursor = 'pointer'
  
  overlay.appendChild(title)
  overlay.appendChild(score)
  overlay.appendChild(paypalCard)
  overlay.appendChild(ctaButton)
  
  this.endOverlay = overlay
  this.endTitle = title
  this.endScore = score
  this.paypalCard = paypalCard
  this.ctaButton = ctaButton
  document.body.appendChild(overlay)
}
```

**Чеклист:**
- [ ] Overlay создаётся
- [ ] Все элементы создаются
- [ ] Стили применяются

#### Задача 5.2: Создание Fail Overlay (поражение)
```javascript
createFailOverlay() {
  const overlay = document.createElement('div')
  overlay.className = 'fail-overlay'
  // Аналогично end-overlay, но с другим текстом
  overlay.style.background = 'rgba(0, 0, 0, 0.9)'
  
  const title = document.createElement('div')
  title.textContent = 'Game Over'
  title.style.color = '#FF0000'
  
  // ... остальные элементы
  
  this.failOverlay = overlay
  document.body.appendChild(overlay)
}
```

**Чеклист:**
- [ ] Overlay создаётся
- [ ] Стили применяются

#### Задача 5.3: Показ End Screens
```javascript
showEndScreen(type, score) {
  const overlay = type === 'win' ? this.endOverlay : this.failOverlay
  
  if (type === 'win') {
    this.endScore.textContent = `Score: ${CONSTANTS.SCORE.CURRENCY_SYMBOL}${Math.floor(score)}`
    
    // Анимация счёта
    gsap.from({ value: 0 }, {
      value: score,
      duration: 1,
      ease: 'power2.out',
      onUpdate: function() {
        this.endScore.textContent = `Score: ${CONSTANTS.SCORE.CURRENCY_SYMBOL}${Math.floor(this.value)}`
      }.bind(this)
    })
  }
  
  overlay.style.display = 'flex'
  
  gsap.from(overlay, {
    opacity: 0,
    scale: 0.8,
    duration: 0.5,
    ease: 'back.out(1.7)'
  })
}
```

**Чеклист:**
- [ ] Показ работает
- [ ] Анимация счёта работает
- [ ] Анимации появления работают

---

### 6. CTA интеграция

#### Задача 6.1: Обработка CTA клика
```javascript
setupCTA() {
  this.ctaButton.addEventListener('click', () => {
    this.handleCTAClick()
  })
}

handleCTAClick() {
  // Проверка наличия CTA URL
  const ctaUrl = window.CTA_URL || ''
  
  if (ctaUrl) {
    // Открытие CTA URL
    if (window.mraid && window.mraid.open) {
      window.mraid.open(ctaUrl)
    } else if (window.parent !== window) {
      // Если в iframe, отправляем сообщение родителю
      window.parent.postMessage({ type: 'CTA_CLICK', url: ctaUrl }, '*')
    } else {
      // Прямое открытие
      window.open(ctaUrl, '_blank')
    }
  }
}
```

**Чеклист:**
- [ ] CTA кнопка работает
- [ ] Интеграция с MRAID работает
- [ ] PostMessage работает
- [ ] Fallback работает

---

### 7. Responsive Scaling

#### Задача 7.1: Адаптация UI
```javascript
setupResponsiveScaling() {
  const updateUI = () => {
    // Обновление размеров шрифтов
    this.fitTextToContainer(this.scoreDisplay, 28, 12)
    
    // Обновление позиций
    // ...
  }
  
  window.addEventListener('resize', updateUI)
  window.addEventListener('orientationchange', () => {
    setTimeout(updateUI, 100)
  })
  
  updateUI()
}
```

**Чеклист:**
- [ ] Responsive работает
- [ ] Обработка resize работает
- [ ] Обработка orientationchange работает

---

## Интеграция с GameController

```javascript
class GameController {
  constructor(app) {
    // ...
    this.uiManager = new UIManager()
  }
  
  async init() {
    // ...
    this.uiManager.init()
    
    // Подписка на события
    this.on('hit', (data) => {
      this.uiManager.updateHP(data.hp)
    })
    
    this.on('collect', (data) => {
      this.uiManager.updateScore(data.score)
      this.uiManager.animateFlyingCollectible(data.position, data.type)
    })
    
    this.on('showTutorial', (data) => {
      this.uiManager.showTutorial(data.type)
    })
    
    this.on('win', (data) => {
      this.uiManager.showEndScreen('win', data.score)
    })
    
    this.on('lose', (data) => {
      this.uiManager.showEndScreen('lose', data.score)
    })
  }
}
```

---

## Результат фазы 4

После завершения фазы 4:
- ✅ HP Display работает
- ✅ Score Display работает
- ✅ Tutorial Overlay работает
- ✅ End Screens работают
- ✅ CTA интеграция работает
- ✅ Responsive работает

---

## Тестирование

1. Проверить отображение всех UI элементов
2. Проверить обновление HP и Score
3. Проверить туториал
4. Проверить End Screens
5. Проверить CTA
6. Проверить responsive на разных размерах экрана

---

## Следующие шаги

После завершения Фазы 4 перейти к:
- **Фаза 5**: Эффекты и полировка
