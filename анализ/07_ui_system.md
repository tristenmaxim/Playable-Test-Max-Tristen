# UI система и оверлеи

## Обзор

UI система использует динамическое создание HTML элементов через JavaScript. Все UI элементы создаются программно и позиционируются поверх PixiJS canvas.

---

## Структура UI

### Основные компоненты

1. **HP Display** (`hpDisplay`) - отображение здоровья игрока
2. **Score Display** (`scoreDisplay`) - отображение счёта/баланса
3. **Tutorial Overlay** (`tutorialOverlay`) - обучающий оверлей
4. **End Overlay** (`endOverlay`) - экран победы
5. **Fail Overlay** (`failOverlay`) - экран поражения
6. **CTA Button** (`ctaButton`) - кнопка Call-To-Action
7. **PayPal Card Container** (`paypalCardContainer`) - карточка PayPal на экране победы
8. **Countdown Container** (`countdownContainer`) - обратный отсчёт перед финишем
9. **Game Footer** (`gameFooter`) - футер игры

---

## Создание UI элементов

### Метод `createUI()`

Создаёт все UI элементы и добавляет их в DOM.

#### Структура

```javascript
createUI() {
  // Создание контейнеров
  this.createHPDisplay()
  this.createScoreDisplay()
  this.createTutorialOverlay()
  this.createEndOverlay()
  this.createFailOverlay()
  this.createCountdownContainer()
  this.createGameFooter()
}
```

---

## HP Display

### Назначение

Отображение здоровья игрока в виде сердечек или полосы здоровья.

### Структура

```javascript
createHPDisplay() {
  const container = document.createElement("div")
  container.className = "hp-display"
  container.style.position = "absolute"
  container.style.top = "20px"
  container.style.left = "20px"
  container.style.zIndex = "1000"
  
  // Создание элементов здоровья
  for (let i = 0; i < MAX_HP; i++) {
    const heart = document.createElement("div")
    heart.className = "heart"
    heart.style.backgroundImage = "url('data:image/png;base64,...')"
    container.appendChild(heart)
  }
  
  this.hpDisplay = container
  document.body.appendChild(container)
}
```

### Обновление

```javascript
updateHP(hp) {
  const hearts = this.hpDisplay.querySelectorAll(".heart")
  hearts.forEach((heart, index) => {
    heart.style.opacity = index < hp ? "1" : "0.3"
  })
}
```

### Стили

- Позиция: верхний левый угол
- Z-index: 1000
- Анимация: пульсация при изменении

---

## Score Display

### Назначение

Отображение текущего счёта/баланса игрока.

### Структура

```javascript
createScoreDisplay() {
  const container = document.createElement("div")
  container.className = "score-container"
  container.style.position = "absolute"
  container.style.top = "20px"
  container.style.right = "20px"
  container.style.zIndex = "1000"
  
  const display = document.createElement("div")
  display.className = "score-display"
  display.textContent = `${currencySymbol}${START_BALANCE}`
  
  container.appendChild(display)
  this.scoreContainer = container
  this.scoreDisplay = display
  document.body.appendChild(container)
}
```

### Обновление

```javascript
updateScore(score) {
  this.scoreDisplay.textContent = `${currencySymbol}${Math.floor(score)}`
  this.fitTextToContainer(this.scoreDisplay, 28, 12)
  
  // Анимация пульсации
  this.scoreContainer.classList.add("pulse")
  setTimeout(() => {
    this.scoreContainer.classList.remove("pulse")
  }, 200)
}
```

### Адаптация размера текста

```javascript
fitTextToContainer(element, maxSize, minSize) {
  let fontSize = maxSize
  element.style.fontSize = `${fontSize}px`
  const containerWidth = element.offsetWidth
  
  while (element.scrollWidth > containerWidth && fontSize > minSize) {
    fontSize -= 1
    element.style.fontSize = `${fontSize}px`
  }
}
```

### Анимация летящих коллекций

```javascript
animateFlyingCollectible(position, type) {
  const element = document.createElement("div")
  element.className = "flying-collectible"
  element.textContent = type === "dollar" ? "$" : type
  
  // Позиционирование
  element.style.left = `${position.x}px`
  element.style.top = `${position.y}px`
  
  // CSS анимация
  const style = document.createElement("style")
  style.textContent = `
    @keyframes fly-to-score {
      from {
        transform: translate(0, 0) scale(1);
        opacity: 1;
      }
      to {
        transform: translate(var(--target-x), var(--target-y)) scale(0.5);
        opacity: 0;
      }
    }
  `
  document.head.appendChild(style)
  
  element.style.animation = `fly-to-score 0.4s ease-in forwards`
  document.body.appendChild(element)
  
  element.addEventListener("animationend", () => {
    this.scoreContainer.classList.remove("pulse")
    this.scoreContainer.classList.add("pulse")
    element.remove()
    style.remove()
  })
}
```

---

## Tutorial Overlay

### Назначение

Обучающий оверлей с инструкциями для игрока.

### Структура

```javascript
createTutorialOverlay() {
  const overlay = document.createElement("div")
  overlay.className = "tutorial-overlay"
  overlay.style.position = "absolute"
  overlay.style.inset = "0"
  overlay.style.zIndex = "2000"
  overlay.style.display = "none"
  
  const text = document.createElement("div")
  text.className = "tutorial-text"
  text.textContent = "Tap to jump!"
  
  overlay.appendChild(text)
  this.tutorialOverlay = overlay
  this.tutorialText = text
  document.body.appendChild(overlay)
}
```

### Показ/Скрытие

```javascript
showTutorial(type) {
  const messages = {
    start: "Tap to jump!",
    enemy: "Avoid enemies!",
    obstacle: "Jump over obstacles!",
    collectible: "Collect money!"
  }
  
  this.tutorialText.textContent = messages[type] || messages.start
  this.tutorialOverlay.style.display = "flex"
  
  // Автоматическое скрытие через 2 секунды
  setTimeout(() => {
    this.hideTutorial()
  }, 2000)
}

hideTutorial() {
  this.tutorialOverlay.style.display = "none"
}
```

### Стили

- Позиция: поверх всего контента
- Z-index: 2000
- Анимация: fade in/out

---

## End Overlay (Экран победы)

### Назначение

Экран победы с информацией о выигрыше и CTA кнопкой.

### Структура

```javascript
createEndOverlay() {
  const overlay = document.createElement("div")
  overlay.className = "end-overlay"
  overlay.style.position = "absolute"
  overlay.style.inset = "0"
  overlay.style.zIndex = "3000"
  overlay.style.display = "none"
  
  // Заголовок
  const title = document.createElement("div")
  title.className = "end-title"
  title.textContent = "You Won!"
  
  // Подзаголовок
  const subtitle = document.createElement("div")
  subtitle.className = "end-subtitle"
  subtitle.textContent = "You collected:"
  
  // Сумма
  const amount = document.createElement("div")
  amount.className = "end-amount"
  amount.textContent = `${currencySymbol}${finalScore}`
  
  // PayPal карточка
  const paypalCard = document.createElement("div")
  paypalCard.className = "paypal-card-container"
  // ... создание карточки PayPal
  
  // CTA кнопка
  const ctaButton = document.createElement("button")
  ctaButton.className = "cta-button"
  ctaButton.textContent = "Get Started"
  ctaButton.addEventListener("click", () => {
    this.handleCTAClick()
  })
  
  overlay.appendChild(title)
  overlay.appendChild(subtitle)
  overlay.appendChild(amount)
  overlay.appendChild(paypalCard)
  overlay.appendChild(ctaButton)
  
  this.endOverlay = overlay
  this.endTitle = title
  this.endSubtitle = subtitle
  this.endAmount = amount
  this.paypalCardContainer = paypalCard
  this.ctaButton = ctaButton
  document.body.appendChild(overlay)
}
```

### Показ

```javascript
showEndScreen(finalScore) {
  this.endAmount.textContent = `${currencySymbol}${Math.floor(finalScore)}`
  this.endOverlay.style.display = "flex"
  
  // Анимация появления через GSAP
  gsap.to(this.endOverlay, {
    opacity: 1,
    duration: 0.5,
    ease: "power2.out"
  })
  
  // Анимация конфетти
  this.confettiEmitter.burstFromSides(window.innerWidth, window.innerHeight)
}
```

### PayPal Card Container

#### Структура

```javascript
createPayPalCard() {
  const card = document.createElement("div")
  card.className = "paypal-card"
  
  const icon = document.createElement("img")
  icon.src = "data:image/png;base64,..." // PayPal icon
  icon.className = "paypal-icon"
  
  const text = document.createElement("div")
  text.className = "paypal-text"
  text.textContent = "PayPal"
  
  card.appendChild(icon)
  card.appendChild(text)
  
  return card
}
```

#### Анимация

```javascript
animatePayPalCard() {
  gsap.to(this.paypalCardContainer, {
    scale: 1.1,
    duration: 0.3,
    yoyo: true,
    repeat: 1
  })
}
```

---

## Fail Overlay (Экран поражения)

### Назначение

Экран поражения с информацией о проигрыше и CTA кнопкой.

### Структура

```javascript
createFailOverlay() {
  const overlay = document.createElement("div")
  overlay.className = "fail-overlay"
  overlay.style.position = "absolute"
  overlay.style.inset = "0"
  overlay.style.zIndex = "3000"
  overlay.style.display = "none"
  
  const title = document.createElement("div")
  title.className = "fail-title"
  title.textContent = "Game Over"
  
  const subtitle = document.createElement("div")
  subtitle.className = "fail-subtitle"
  subtitle.textContent = "Try again!"
  
  const ctaButton = document.createElement("button")
  ctaButton.className = "cta-button"
  ctaButton.textContent = "Try Again"
  ctaButton.addEventListener("click", () => {
    this.restart()
  })
  
  overlay.appendChild(title)
  overlay.appendChild(subtitle)
  overlay.appendChild(ctaButton)
  
  this.failOverlay = overlay
  document.body.appendChild(overlay)
}
```

### Показ

```javascript
showFailScreen() {
  this.failOverlay.style.display = "flex"
  
  gsap.to(this.failOverlay, {
    opacity: 1,
    duration: 0.5,
    ease: "power2.out"
  })
}
```

---

## Countdown Container

### Назначение

Обратный отсчёт перед финишем.

### Структура

```javascript
createCountdownContainer() {
  const container = document.createElement("div")
  container.className = "countdown-container"
  container.style.position = "absolute"
  container.style.inset = "0"
  container.style.zIndex = "2500"
  container.style.display = "none"
  
  const time = document.createElement("div")
  time.className = "countdown-time"
  time.textContent = "3"
  
  container.appendChild(time)
  this.countdownContainer = container
  this.countdownTime = time
  document.body.appendChild(container)
}
```

### Запуск

```javascript
startCountdown(callback) {
  this.countdownContainer.style.display = "flex"
  let time = 3
  
  this.countdownInterval = setInterval(() => {
    this.countdownTime.textContent = time.toString()
    
    // Анимация масштаба
    gsap.to(this.countdownTime, {
      scale: 1.5,
      duration: 0.1,
      yoyo: true,
      repeat: 1
    })
    
    time--
    
    if (time < 0) {
      clearInterval(this.countdownInterval)
      this.countdownContainer.style.display = "none"
      callback()
    }
  }, 1000)
}
```

---

## Praise Popup

### Назначение

Всплывающие сообщения с похвалой при достижении определённых результатов.

### Структура

```javascript
showPraisePopup() {
  const messages = [
    "Great!",
    "Awesome!",
    "Amazing!",
    "Fantastic!",
    "Incredible!"
  ]
  
  const message = messages[Math.floor(Math.random() * messages.length)]
  const popup = document.createElement("div")
  popup.className = "praise-popup"
  popup.textContent = message
  
  // Случайное позиционирование
  const x = window.innerWidth / 2 + (Math.random() - 0.5) * 60
  const y = window.innerHeight * 0.4 + (Math.random() - 0.5) * 40
  
  popup.style.left = `${x}px`
  popup.style.top = `${y}px`
  
  document.body.appendChild(popup)
  
  popup.addEventListener("animationend", () => {
    popup.remove()
  })
}
```

### Триггеры

- При сборе определённого количества коллекций
- При достижении определённого счёта
- При прохождении определённого расстояния

---

## CTA Button

### Назначение

Кнопка Call-To-Action для перехода в магазин приложений.

### Структура

```javascript
createCTAButton() {
  const button = document.createElement("button")
  button.className = "cta-button"
  button.textContent = "Get Started"
  button.style.position = "absolute"
  button.style.bottom = "20px"
  button.style.left = "50%"
  button.style.transform = "translateX(-50%)"
  button.style.zIndex = "1000"
  
  button.addEventListener("click", () => {
    this.handleCTAClick()
  })
  
  this.ctaButton = button
  document.body.appendChild(button)
}
```

### Обработка клика

```javascript
handleCTAClick() {
  // Использование Playbox CTA Helper
  if (window.playboxCTA) {
    window.playboxCTA(storeUrl)
  } else {
    // Fallback
    window.open(storeUrl, "_blank")
  }
}
```

---

## Game Footer

### Назначение

Футер игры с дополнительной информацией.

### Структура

```javascript
createGameFooter() {
  const footer = document.createElement("div")
  footer.className = "game-footer"
  footer.style.position = "absolute"
  footer.style.bottom = "0"
  footer.style.left = "0"
  footer.style.right = "0"
  footer.style.zIndex = "1000"
  
  // Добавление содержимого
  // ...
  
  this.gameFooter = footer
  document.body.appendChild(footer)
}
```

---

## Responsive Design

### Адаптация к размеру экрана

```javascript
setupResponsiveScaling() {
  const updateUI = () => {
    // Обновление размеров шрифтов
    this.fitTextToContainer(this.scoreDisplay, 28, 12)
    
    // Обновление позиций элементов
    // ...
  }
  
  window.addEventListener("resize", updateUI)
  window.addEventListener("orientationchange", () => {
    setTimeout(updateUI, 100)
  })
}
```

---

## Стили

### Основные стили

Все стили встроены в HTML через `<style>` теги или добавляются динамически через JavaScript.

#### Примеры

```css
.hp-display {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1000;
  display: flex;
  gap: 5px;
}

.score-container {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1000;
  font-size: 28px;
  font-weight: bold;
  color: #fff;
}

.tutorial-overlay {
  position: absolute;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
}

.end-overlay,
.fail-overlay {
  position: absolute;
  inset: 0;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.9);
}
```

---

## Анимации

### GSAP анимации

Используются для плавных переходов и эффектов:

```javascript
// Появление
gsap.to(element, {
  opacity: 1,
  duration: 0.5,
  ease: "power2.out"
})

// Исчезновение
gsap.to(element, {
  opacity: 0,
  duration: 0.3,
  ease: "power2.in"
})

// Масштабирование
gsap.to(element, {
  scale: 1.1,
  duration: 0.2,
  yoyo: true,
  repeat: 1
})
```

### CSS анимации

Используются для простых эффектов:

```css
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.pulse {
  animation: pulse 0.2s ease-in-out;
}
```

---

## Примечания

- Все UI элементы создаются динамически через JavaScript
- Используется абсолютное позиционирование поверх PixiJS canvas
- Z-index управляет порядком отрисовки
- GSAP используется для плавных анимаций
- CSS анимации используются для простых эффектов
- Адаптивный дизайн через JavaScript
- CTA кнопка использует Playbox CTA Helper для интеграции с платформой
