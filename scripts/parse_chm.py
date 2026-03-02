import os
import re

def extract_text(html):
    # Remove styles and scripts
    html = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.IGNORECASE|re.DOTALL)
    html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.IGNORECASE|re.DOTALL)
    # Remove all HTML tags
    text = re.sub(r'<[^>]+>', ' ', html)
    # Replace non-breaking spaces and normalize whitespace
    text = text.replace('&nbsp;', ' ').replace('\xa0', ' ')
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def parse_html_table(filepath):
    try:
        with open(filepath, 'r', encoding='gbk', errors='ignore') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return []
        
    tables = []
    # Find all table rows
    trs = re.findall(r'<tr[^>]*>(.*?)</tr>', content, re.IGNORECASE | re.DOTALL)
    if not trs:
        # Sometimes Word uses weird formatting, let's try a fallback
        pass
        
    for tr in trs:
        tds = re.findall(r'<td[^>]*>(.*?)</td>', tr, re.IGNORECASE | re.DOTALL)
        if not tds:
            tds = re.findall(r'<th[^>]*>(.*?)</th>', tr, re.IGNORECASE | re.DOTALL)
        row = [extract_text(td) for td in tds]
        if any(row):  # Only add if row is not completely empty
            tables.append(row)
            
    return tables

def main():
    base_dir = r"D:\AI-RPGGAME\chm_extracted"
    out_dir = os.path.join(base_dir, "tables")
    os.makedirs(out_dir, exist_ok=True)
    
    # 1. Parse MixMon (Fusion)
    mixmon_dir = os.path.join(base_dir, "MixMon")
    mixmon_files = [f for f in os.listdir(mixmon_dir) if f.endswith('.htm')]
    
    all_fusions = []
    headers_fusion = []
    
    for filename in sorted(mixmon_files):
        filepath = os.path.join(mixmon_dir, filename)
        rows = parse_html_table(filepath)
        if not rows: continue
        
        # Assume first row is header
        if not headers_fusion and len(rows[0]) >= 3:
            headers_fusion = rows[0]
        
        # Add data rows
        for row in rows[1:]:
            if len(row) > 1 and row[1]: # Must have a name
                all_fusions.append((filename, row))
                
    # Write Fusion Table
    with open(os.path.join(out_dir, "Fusion_Recipes.md"), "w", encoding="utf-8") as f:
        f.write("# Pet Fusion Recipes (MixMon)\n\n")
        
        if headers_fusion:
            f.write("| File | " + " | ".join(headers_fusion) + " |\n")
            f.write("| --- | " + " | ".join(["---"] * len(headers_fusion)) + " |\n")
        else:
            f.write("| File | Image | Name | Formula | Level | etc |\n")
            f.write("| --- | --- | --- | --- | --- | --- |\n")
            
        for file, row in all_fusions:
            row_str = " | ".join([str(x).replace('|', '-') for x in row])
            f.write(f"| {file} | {row_str} |\n")
            
    # 2. Parse MapMon (Spawns/Drops)
    mapmon_dir = os.path.join(base_dir, "MapMon")
    mapmon_files = [f for f in os.listdir(mapmon_dir) if f.endswith('.htm')]
    
    all_monsters = []
    headers_monster = []
    
    for filename in sorted(mapmon_files):
        filepath = os.path.join(mapmon_dir, filename)
        rows = parse_html_table(filepath)
        if not rows: continue
        
        # First row is often a title like "xx map monsters"
        # Second row is headers
        h_idx = 0
        for i, r in enumerate(rows[:3]):
            if len(r) > 3:
                h_idx = i
                break
                
        if not headers_monster and len(rows) > h_idx:
            headers_monster = rows[h_idx]
            
        for row in rows[h_idx+1:]:
             if len(row) > 1 and row[1]:
                 all_monsters.append((filename, row))
                 
    # Write Monster Table
    with open(os.path.join(out_dir, "Monster_Spawns.md"), "w", encoding="utf-8") as f:
        f.write("# Monster Spawns & Drops (MapMon)\n\n")
        
        if headers_monster:
            f.write("| File | " + " | ".join(headers_monster) + " |\n")
            f.write("| --- | " + " | ".join(["---"] * len(headers_monster)) + " |\n")
        else:
            f.write("| File | Image | Name | Level | Type | Respawn | etc |\n")
            f.write("| --- | --- | --- | --- | --- | --- | --- |\n")
            
        for file, row in all_monsters:
            row_str = " | ".join([str(x).replace('|', '-') for x in row])
            f.write(f"| {file} | {row_str} |\n")
            
    print(f"Extraction complete! Generated {len(all_fusions)} fusion rows and {len(all_monsters)} monster rows.")
    print(f"Files saved to: {out_dir}")

if __name__ == '__main__':
    main()
