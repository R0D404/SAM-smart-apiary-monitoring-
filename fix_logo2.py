import os
import re

target_html = """<div class="logo">
                <div class="hexagon">
                    <img src="../assets/img/logo/logoSam.png" alt="Logotipo de SAM">
                </div>
                <div class="logo-text">
                    <h1>SAM</h1>
                    <p>Smart Apiary</p>
                </div>
            </div>"""

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Match <div class="logo"> ... </div> regardless of inner div name
    # We look for <div class="logo-text"> and the closing </div> of logo
    pattern = re.compile(r'([ \t]*)<div class="logo">.*?(?:<div class="logo-hexagon">).*?</(?:div)>\s*<div class="logo-text">\s*<h1>.*?</h1>\s*<p>.*?</p>\s*</div>\s*</div>', re.DOTALL)
    
    def replacer(match):
        indent = match.group(1)
        target_lines = target_html.split('\n')
        base_indent = len(indent)
        result = indent + target_lines[0] + '\n'
        for line in target_lines[1:]:
            if line.startswith('            '): # 12 spaces
                result += ' ' * base_indent + line[12:] + '\n'
            else:
                result += line + '\n'
        return result.rstrip('\n')

    new_content, count = pattern.subn(replacer, content)
    
    if count > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('.'):
    if 'sam-frontend-vercel' in root or 'node_modules' in root or '.git' in root:
        continue
    for file in files:
        if file.endswith('.html'):
            process_file(os.path.join(root, file))
