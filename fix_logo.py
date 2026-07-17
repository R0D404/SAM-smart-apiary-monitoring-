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

    # Regex to find <div class="logo"> ... </div>
    # It might contain <div class="hexagon"> or <hexagon> and <div class="logo-text">
    # We will match from <div class="logo"> up to the closing </div> of logo
    # Note: the logo div contains 2 inner divs (or hexagon tag + div).
    # Since the structure is quite specific, we can use a regex that matches
    # <div class="logo"> followed by anything until </div>\s*</div> (or similar)
    # Actually, a simpler way is to find <div class="logo"> and the next two </div>
    # Or just use re.sub with a pattern that matches the whole block.
    
    # Let's match: <div class="logo">.*?<div class="logo-text">.*?</div>\s*</div>
    # or with <hexagon>
    pattern = re.compile(r'<div class="logo">.*?(?:<div class="hexagon">|<hexagon>).*?</(?:div|hexagon)>\s*<div class="logo-text">\s*<h1>SAM</h1>\s*<p>.*?</p>\s*</div>\s*</div>', re.DOTALL)
    
    new_content, count = pattern.subn(target_html, content)
    
    if count > 0:
        # Some files might have different indentation, but we'll just insert the block.
        # To preserve indentation of <div class="logo">, we can capture the leading spaces.
        pattern2 = re.compile(r'([ \t]*)<div class="logo">.*?(?:<div class="hexagon">|<hexagon>).*?</(?:div|hexagon)>\s*<div class="logo-text">\s*<h1>.*?</h1>\s*<p>.*?</p>\s*</div>\s*</div>', re.DOTALL)
        
        def replacer(match):
            indent = match.group(1)
            # Apply indent to each line of target_html except the first (which gets it from the capture, but wait, if we return the full string, we should prepend indent)
            lines = target_html.split('\n')
            res = indent + lines[0]
            for line in lines[1:]:
                # If target has 16 spaces, we can just use the target as is, or adjust it.
                # Let's just use the target_html, but pad it correctly.
                # Actually, the target_html has 12 spaces for <div class="hexagon">
                pass
            
            # Simple replacement with proper indentation adjustment
            target_lines = target_html.split('\n')
            base_indent = len(indent)
            result = indent + target_lines[0] + '\n'
            for line in target_lines[1:]:
                # remove first 12 spaces, then add base_indent + 4
                if line.startswith('            '): # 12 spaces
                    result += ' ' * base_indent + line[12:] + '\n'
                else:
                    result += line + '\n'
            return result.rstrip('\n')
            
        new_content = pattern2.sub(replacer, content)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('.'):
    if 'sam-frontend-vercel' in root or 'node_modules' in root or '.git' in root:
        continue
    for file in files:
        if file.endswith('.html'):
            process_file(os.path.join(root, file))
