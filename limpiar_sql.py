import sys
import re

def clean_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    clean_lines = []
    
    for line in lines:
        stripped = line.strip()
        
        # skip single line comments
        if stripped.startswith('--'):
            continue
            
        # skip drop tables
        if 'DROP TABLE' in stripped.upper() or 'DROP DATABASE' in stripped.upper():
            continue
            
        clean_lines.append(line)
        
    content = "".join(clean_lines)
    
    # process block comments (/* ... */)
    content = re.sub(r'/\*.*?\*/;?', '', content, flags=re.DOTALL)
    
    # remove excessive blank lines
    content = re.sub(r'\n{3,}', '\n\n', content)
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')

clean_file('/home/emma/SAM/comandos_bd.txt')
clean_file('/home/emma/SAM/inserts_bd.txt')
