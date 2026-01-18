# Шейдеры (GLSL/WGSL)

## Обзор

Игра использует шейдеры для рендеринга через WebGL и WebGPU. В коде найдены как GLSL (WebGL), так и WGSL (WebGPU) шейдеры.

---

## Типы шейдеров

### 1. Passthrough Filter Shader

Простой шейдер для передачи текстуры без изменений.

#### GLSL версия
```glsl
vec4 filterVertexPosition( void )
{
    gl_Position = vec4((modelViewProjectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
}

void main(void) {
    gl_Position = filterVertexPosition();
}
```

#### WGSL версия
```wgsl
fn filterVertexPosition(aPosition: vec2<f32>) -> vec4<f32>
{
    return vec4<f32>((modelViewProjectionMatrix * vec3<f32>(aPosition, 1.0)).xy, 0.0, 1.0);
}

@vertex
fn mainVertex(
    @location(0) aPosition: vec2<f32>,
) -> @builtin(position) vec4<f32> {
   return filterVertexPosition(aPosition);
}

@fragment
fn mainFragment(
    @location(0) uv: vec2<f32>
) -> @location(0) vec4<f32> {
    // Passthrough
}
```

---

### 2. Round Pixels Shader

Шейдер для округления пикселей (избежание размытия при масштабировании).

#### WGSL версия
```wgsl
fn roundPixels(position: vec2<f32>, targetSize: vec2<f32>) -> vec2<f32> {
    return (floor(((position * 0.5 + 0.5) * targetSize) + 0.5) / targetSize) * 2.0 - 1.0;
}
```

#### GLSL версия
```glsl
vec2 roundPixels(vec2 position, vec2 targetSize) {
    return (floor(((position * 0.5 + 0.5) * targetSize) + 0.5) / targetSize) * 2.0 - 1.0;
}
```

**Назначение**: Округляет позиции вершин до целых пикселей для чёткого рендеринга спрайтов.

---

### 3. Mask Filter Shader

Шейдер для маскирования (обрезки по форме маски).

#### GLSL версия
```glsl
vec4 filterVertexPosition( vec2 aPosition )
{
    vec2 position = aPosition;
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
    return vec4(position, 0.0, 1.0);
}

void main(void) {
    gl_Position = filterVertexPosition(aPosition);
}

// Fragment shader
float clip = step(3.5, ...);
float alphaMul = 1.0 - npmAlpha * (1.0 - masky.a);
if (uInverse == 1.0) {
    a = 1.0 - a;
}
```

#### WGSL версия
```wgsl
fn filterVertexPosition(aPosition:vec2<f32>) -> vec4<f32> {
    var position = aPosition;
    position.x = position.x * (2.0 / gfu.uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0 * gfu.uOutputTexture.z / gfu.uOutputTexture.y) - gfu.uOutputTexture.z;
    return vec4<f32>(position, 0.0, 1.0);
}

@vertex
fn mainVertex(
    @location(0) aPosition : vec2<f32>,
) -> @builtin(position) vec4<f32> {
   return filterVertexPosition(aPosition);
}

@fragment
fn mainFragment(
    @location(0) uv: vec2<f32>,
    @location(1) filterUv: vec2<f32>,
) -> @location(0) vec4<f32> {
    var clip = step(3.5, ...);
    var alphaMul = 1.0 - uAlpha * (1.0 - mask.a);
    if (filterUniforms.uInverse == 1.0) {
        a = 1.0 - a;
    }
}
```

**Назначение**: Применяет маску к текстуре, поддерживает инверсию маски.

---

### 4. Big Triangle Shader

Шейдер для рендеринга большого треугольника (используется для back buffer).

```wgsl
@vertex
fn mainVertex(
    @location(0) aPosition: vec2<f32>,
) -> @builtin(position) vec4<f32> {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vUv = (aPosition + 1.0) / 2.0;
    vUv.y = 1.0 - vUv.y;
}
```

**Назначение**: Рендеринг full-screen треугольника для эффектов постобработки.

---

## Система шейдеров PixiJS

### Шаблоны шейдеров

PixiJS использует систему шаблонов для генерации шейдеров:

```javascript
const template = {
    vertex: `...`,
    fragment: `...`
}

const bits = [
    { name: "color-bit", vertex: { header: `...` } },
    { name: "texture-bit", fragment: { header: `...` } },
    { name: "round-pixels-bit", vertex: { header: `...` } }
]

const shader = createShader({ template, bits })
```

### Бит-система

Шейдеры собираются из "битов" (модулей):
- `color-bit` - работа с цветом
- `texture-bit` - работа с текстурами
- `round-pixels-bit` - округление пикселей
- `batch-bit` - батчинг спрайтов

---

## Uniforms

### Глобальные uniforms

```glsl
uniform mat3x3 modelViewProjectionMatrix;
uniform vec2 uOutputTexture; // размеры текстуры
uniform float uAlpha;
uniform int uInverse; // инверсия маски
```

### Texture uniforms

```glsl
uniform sampler2D uTexture;
uniform mat3x3 uTextureMatrix;
```

---

## Оптимизации

### 1. Кэширование программ

Шейдеры кэшируются по ключу (vertex + fragment):
```javascript
const key = `${vertex}:${fragment}`
if (cache[key]) return cache[key]
```

### 2. Минимизация переключений

Используется батчинг для группировки спрайтов с одинаковыми шейдерами.

### 3. Поддержка WebGL и WebGPU

Автоматическое определение и использование подходящего API.

---

## Примечания

- Шейдеры минифицированы вместе с кодом
- Используется система шаблонов для переиспользования кода
- Поддержка как WebGL (GLSL), так и WebGPU (WGSL)
- Шейдеры оптимизированы для мобильных устройств
