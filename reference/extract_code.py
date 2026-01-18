#!/usr/bin/env python3
"""
Скрипт для извлечения JavaScript и CSS кода из playable HTML файла
"""
import re
import os
import json
from pathlib import Path

def extract_scripts(html_content):
    """Извлекает все JavaScript код из HTML"""
    scripts = []
    
    # Паттерн для inline скриптов
    # <script>...</script> или <script type="module">...</script>
    pattern = r'<script[^>]*>([\s\S]*?)</script>'
    matches = re.finditer(pattern, html_content)
    
    for i, match in enumerate(matches):
        script_content = match.group(1)
        script_tag = match.group(0)[:100]  # Первые 100 символов тега
        
        # Определяем тип скрипта
        script_type = 'inline'
        if 'type="module"' in script_tag:
            script_type = 'module'
        elif 'src=' in script_tag:
            script_type = 'external'
            continue  # Пропускаем внешние скрипты
        
        scripts.append({
            'index': i,
            'type': script_type,
            'content': script_content,
            'size': len(script_content),
            'size_kb': round(len(script_content) / 1024, 2)
        })
    
    return scripts

def extract_styles(html_content):
    """Извлекает все CSS код из HTML"""
    styles = []
    
    # Паттерн для inline стилей
    pattern = r'<style[^>]*>([\s\S]*?)</style>'
    matches = re.finditer(pattern, html_content)
    
    for i, match in enumerate(matches):
        style_content = match.group(1)
        
        styles.append({
            'index': i,
            'content': style_content,
            'size': len(style_content),
            'size_kb': round(len(style_content) / 1024, 2)
        })
    
    return styles

def analyze_code_structure(scripts, styles):
    """Анализирует структуру кода"""
    analysis = {
        'total_scripts': len(scripts),
        'total_styles': len(styles),
        'total_js_size_kb': sum(s['size_kb'] for s in scripts),
        'total_css_size_kb': sum(s['size_kb'] for s in styles),
        'is_minified': False,
        'detected_libraries': []
    }
    
    # Проверяем минификацию (если нет пробелов и переносов строк)
    if scripts:
        first_script = scripts[0]['content']
        # Если в первых 1000 символах меньше 10 пробелов/переносов - вероятно минифицирован
        sample = first_script[:1000]
        whitespace_count = sample.count(' ') + sample.count('\n') + sample.count('\t')
        analysis['is_minified'] = whitespace_count < 10
    
    # Определяем библиотеки
    all_code = ' '.join([s['content'] for s in scripts])
    if 'PixiJS' in all_code or 'pixi' in all_code.lower():
        analysis['detected_libraries'].append('PixiJS')
    if 'Phaser' in all_code or 'phaser' in all_code.lower():
        analysis['detected_libraries'].append('Phaser')
    if 'Three' in all_code or 'three' in all_code.lower():
        analysis['detected_libraries'].append('Three.js')
    if 'Matter' in all_code or 'matter' in all_code.lower():
        analysis['detected_libraries'].append('Matter.js')
    
    return analysis

def main():
    # Создаем директории
    base_dir = Path(__file__).parent
    output_dir = base_dir / 'extracted_code'
    output_dir.mkdir(exist_ok=True)
    
    scripts_dir = output_dir / 'scripts'
    scripts_dir.mkdir(exist_ok=True)
    
    styles_dir = output_dir / 'styles'
    styles_dir.mkdir(exist_ok=True)
    
    # Читаем HTML
    html_file = base_dir / 'playable_game.html'
    if not html_file.exists():
        print(f"Файл {html_file} не найден!")
        return
    
    print(f"Читаю {html_file}...")
    with open(html_file, 'r', encoding='utf-8', errors='ignore') as f:
        html_content = f.read()
    
    print(f"Размер HTML: {len(html_content) / 1024 / 1024:.2f} MB\n")
    
    # Извлекаем скрипты
    print("Извлекаю JavaScript код...")
    scripts = extract_scripts(html_content)
    print(f"Найдено {len(scripts)} скриптов")
    
    for i, script in enumerate(scripts):
        filename = f"script_{i:02d}_{script['type']}.js"
        filepath = scripts_dir / filename
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(script['content'])
        
        print(f"  Сохранен: {filename} ({script['size_kb']} KB, тип: {script['type']})")
    
    # Извлекаем стили
    print("\nИзвлекаю CSS код...")
    styles = extract_styles(html_content)
    print(f"Найдено {len(styles)} стилей")
    
    for i, style in enumerate(styles):
        filename = f"style_{i:02d}.css"
        filepath = styles_dir / filename
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(style['content'])
        
        print(f"  Сохранен: {filename} ({style['size_kb']} KB)")
    
    # Анализируем структуру
    print("\nАнализирую структуру кода...")
    analysis = analyze_code_structure(scripts, styles)
    
    print(f"Общий размер JavaScript: {analysis['total_js_size_kb']} KB")
    print(f"Общий размер CSS: {analysis['total_css_size_kb']} KB")
    print(f"Минифицирован: {'Да' if analysis['is_minified'] else 'Нет'}")
    print(f"Обнаруженные библиотеки: {', '.join(analysis['detected_libraries']) if analysis['detected_libraries'] else 'Не обнаружено'}")
    
    # Сохраняем метаданные
    metadata = {
        'scripts': [
            {
                'filename': f"script_{s['index']:02d}_{s['type']}.js",
                'type': s['type'],
                'size_kb': s['size_kb']
            }
            for s in scripts
        ],
        'styles': [
            {
                'filename': f"style_{s['index']:02d}.css",
                'size_kb': s['size_kb']
            }
            for s in styles
        ],
        'analysis': analysis
    }
    
    metadata_file = output_dir / 'code_metadata.json'
    with open(metadata_file, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    
    print(f"\nМетаданные сохранены в {metadata_file}")
    print(f"\nВсе файлы сохранены в {output_dir}")

if __name__ == '__main__':
    main()
