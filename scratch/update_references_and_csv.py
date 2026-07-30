import os
import json
import csv

# 1. Update data/productos.json
json_path = 'data/productos.json'
with open(json_path, 'r', encoding='utf-8') as f:
    products = json.load(f)

json_updated_count = 0
for p in products:
    if 'imagen' in p and p['imagen'].endswith('.png'):
        p['imagen'] = p['imagen'][:-4] + '.webp'
        json_updated_count += 1

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

print(f"Updated {json_updated_count} product image paths in data/productos.json")

# 2. Update data/productos-google-sheets.csv
csv_path = 'data/productos-google-sheets.csv'
if os.path.exists(csv_path):
    with open(csv_path, 'r', encoding='utf-8') as f:
        csv_text = f.read()
    csv_updated_text = csv_text.replace('.png', '.webp')
    with open(csv_path, 'w', encoding='utf-8') as f:
        f.write(csv_updated_text)
    print(f"Updated data/productos-google-sheets.csv to .webp")

# 3. Create tools/rutas-productos-webp.csv report for Google Sheets manual update
os.makedirs('tools', exist_ok=True)
report_path = 'tools/rutas-productos-webp.csv'

product_dir = 'img/productos'
png_files = sorted([f for f in os.listdir(product_dir) if f.lower().endswith('.png')])

report_rows = []
for png in png_files:
    base = os.path.splitext(png)[0]
    webp = base + '.webp'
    ruta_old = f"img/productos/{png}"
    ruta_new = f"img/productos/{webp}"
    webp_path = os.path.join(product_dir, webp)
    exists = os.path.exists(webp_path) and os.path.getsize(webp_path) > 0
    estado = "OK_CONVERTIDO" if exists else "ERROR_FALTA_WEBP"
    
    report_rows.append({
        'id_o_nombre': base,
        'ruta_anterior': ruta_old,
        'ruta_nueva': ruta_new,
        'webp_existe': "TRUE" if exists else "FALSE",
        'estado': estado
    })

with open(report_path, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['id_o_nombre', 'ruta_anterior', 'ruta_nueva', 'webp_existe', 'estado'])
    writer.writeheader()
    writer.writerows(report_rows)

print(f"Generated {report_path} with {len(report_rows)} rows.")
