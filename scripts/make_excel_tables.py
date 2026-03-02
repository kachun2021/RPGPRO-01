import os
from bs4 import BeautifulSoup
import xlsxwriter
from PIL import Image

def write_html_to_excel(input_dir, output_excel, title):
    print(f"Processing {input_dir} into {output_excel}...")
    workbook = xlsxwriter.Workbook(output_excel)
    
    # Define styles
    header_format = workbook.add_format({
        'bold': True, 'bg_color': '#ebd169', 'border': 1, 
        'text_wrap': True, 'align': 'center', 'valign': 'vcenter'
    })
    cell_format = workbook.add_format({
        'bg_color': '#fceea6', 'border': 1, 
        'text_wrap': True, 'align': 'center', 'valign': 'vcenter'
    })
    title_format = workbook.add_format({
        'bold': True, 'font_size': 18, 'align': 'center', 
        'valign': 'vcenter', 'font_color': '#cc0000',
        'bg_color': '#ffeb9b'
    })
    file_header_format = workbook.add_format({
        'bold': True, 'bg_color': '#d0cece', 'border': 1,
        'align': 'center', 'valign': 'vcenter', 'rotation': 90
    })
    
    worksheet = workbook.add_worksheet("Data")
    worksheet.set_column('A:A', 5)   # File Name (thin vertical)
    worksheet.set_column('B:B', 15)  # Image column usually - wider
    worksheet.set_column('C:C', 20)  # Pet Name
    worksheet.set_column('D:D', 35)  # Formula Part 1
    worksheet.set_column('E:E', 35)  # Formula Part 2
    worksheet.set_column('F:Z', 15)  # Others
    
    current_row = 0
    worksheet.merge_range(current_row, 0, current_row, 5, title, title_format)
    worksheet.set_row(current_row, 40)
    current_row += 2
    
    files = sorted([f for f in os.listdir(input_dir) if f.endswith('.htm')])
    
    for file in files:
        filepath = os.path.join(input_dir, file)
        try:
            with open(filepath, 'r', encoding='gbk', errors='ignore') as f:
                soup = BeautifulSoup(f, 'html.parser')
                
            valid_tables = soup.find_all('table')
            if not valid_tables: continue
            
            # Find the deepest (leaf) table to avoid extracting text recursively from nested layout tables
            leaf_tables = [t for t in valid_tables if not t.find('table')]
            if leaf_tables:
                table = max(leaf_tables, key=lambda t: len(t.find_all('tr')))
            else:
                table = valid_tables[0]
            
            grid = {} 
            max_r = 0
            max_c = 0
            
            trs = table.find_all('tr')
            if not trs: continue
            
            for r_idx, tr in enumerate(trs):
                c_idx = 0
                for cell in tr.find_all(['td', 'th']):
                    while (r_idx, c_idx) in grid:
                        c_idx += 1
                        
                    rowspan = int(cell.get('rowspan', 1))
                    colspan = int(cell.get('colspan', 1))
                    
                    img_tag = cell.find('img')
                    img_path = None
                    if img_tag and img_tag.get('src'):
                        src = img_tag.get('src')
                        img_path = os.path.normpath(os.path.join(input_dir, src))
                        
                    for br in cell.find_all('br'):
                        br.replace_with('\n')
                    for p in cell.find_all('p'):
                        p.append('\n')
                        
                    text = cell.get_text(separator=' ', strip=True).replace('\n ', '\n').strip()
                    is_header = (cell.name == 'th' or r_idx == 0)
                    
                    grid[(r_idx, c_idx)] = {
                        'text': text, 'img': img_path,
                        'rs': rowspan, 'cs': colspan, 'th': is_header,
                        'is_anchor': True
                    }
                    
                    for r in range(rowspan):
                        for c in range(colspan):
                            if r == 0 and c == 0: continue
                            grid[(r_idx + r, c_idx + c)] = {'is_anchor': False}
                            
                    max_r = max(max_r, r_idx + rowspan - 1)
                    c_idx += colspan
                    max_c = max(max_c, c_idx)
            
            file_start_row = current_row
            
            # Row height (give images enough height breathing room, ~80 pixels)
            for r in range(max_r + 1):
                worksheet.set_row(file_start_row + r, 80)
            
            try:
                worksheet.merge_range(file_start_row, 0, file_start_row + max_r, 0, file, file_header_format)
            except Exception:
                worksheet.write(file_start_row, 0, file, file_header_format)
            
            for r in range(max_r + 1):
                for c in range(max_c):
                    cell = grid.get((r, c))
                    if not cell or not cell.get('is_anchor'):
                        continue
                        
                    ex_r = file_start_row + r
                    ex_c = c + 1
                    fmt = header_format if cell['th'] else cell_format
                    
                    if cell['rs'] > 1 or cell['cs'] > 1:
                        try:
                            worksheet.merge_range(
                                ex_r, ex_c, 
                                ex_r + cell['rs'] - 1, 
                                ex_c + cell['cs'] - 1, 
                                cell['text'], fmt
                            )
                        except Exception:
                            worksheet.write(ex_r, ex_c, cell['text'], fmt)
                    else:
                        worksheet.write(ex_r, ex_c, cell['text'], fmt)
                        
                    img_path = cell['img']
                    if img_path and os.path.exists(img_path):
                        try:
                            with Image.open(img_path) as im:
                                i_w, i_h = im.size
                                
                            # Target bounding box inside the cell
                            target_w = 80
                            target_h = 80
                            
                            scale_w = target_w / i_w
                            scale_h = target_h / i_h
                            scale = min(scale_w, scale_h)
                            
                            # Do not scale up small images
                            if scale > 1: scale = 1.0
                            
                            worksheet.insert_image(ex_r, ex_c, img_path, {
                                'x_scale': scale,
                                'y_scale': scale,
                                'x_offset': 10,
                                'y_offset': 10,
                                'object_position': 1  # Move and size with cells
                             })
                        except Exception as e:
                            print(f"Image error: {e}")
                            
            current_row += max_r + 2
            
        except Exception as e:
            print(f"File {file} error: {e}")

    worksheet.set_zoom(85)
    workbook.close()
    print(f"Saved {output_excel}")

def main():
    base_dir = r"D:\AI-RPGGAME\chm_extracted"
    out_dir = os.path.join(base_dir, "tables")
    os.makedirs(out_dir, exist_ok=True)
    
    write_html_to_excel(
        os.path.join(base_dir, "MixMon"),
        os.path.join(out_dir, "Fusion_Recipes_MixMon_v2.xlsx"),
        "【合成公式】MixMon"
    )
    
    write_html_to_excel(
        os.path.join(base_dir, "MapMon"),
        os.path.join(out_dir, "Monster_Drop_MapMon_v2.xlsx"),
        "【地圖掉落】MapMon"
    )

if __name__ == '__main__':
    main()
