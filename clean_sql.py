import re

input_file = '/home/emma/SAM/sam_db_backup.sql'

with open(input_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

clean_lines = []
in_comment = False

for line in lines:
    stripped = line.strip()
    
    if not stripped:
        continue
        
    # skip single line comments
    if stripped.startswith('--'):
        continue
        
    # skip drop tables
    if 'DROP TABLE' in stripped:
        continue
        
    # skip c-style comments like /*!40101 ... */ or /* ... */
    if stripped.startswith('/*') and stripped.endswith('*/'):
        continue
    if stripped.startswith('/*') and stripped.endswith('*/;'):
        continue
        
    # skip locks
    if stripped.startswith('LOCK TABLES') or stripped.startswith('UNLOCK TABLES') or stripped.startswith('SET ') or stripped.startswith('COMMIT'):
        continue
        
    clean_lines.append(line.rstrip())

clean_sql = "\n".join(clean_lines)
# remove multiple blank lines
clean_sql = re.sub(r'\n{3,}', '\n\n', clean_sql)

print(clean_sql)
