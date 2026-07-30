import os
import glob
import json
from PIL import Image

product_dir = 'img/productos'
files = os.listdir(product_dir)

png_files = [f for f in files if f.lower().endswith('.png')]
jpg_files = [f for f in files if f.lower().endswith(('.jpg', '.jpeg'))]
webp_files = [f for f in files if f.lower().endswith('.webp')]

print(f"Total files in {product_dir}: {len(files)}")
print(f"PNG files: {len(png_files)}")
print(f"JPG/JPEG files: {len(jpg_files)}")
print(f"WebP files: {len(webp_files)}")

inventory = []

for f in sorted(files):
    path = os.path.join(product_dir, f)
    if os.path.isdir(path): continue
    ext = os.path.splitext(f)[1].lower()
    size_kb = os.path.getsize(path) / 1024
    try:
        with Image.open(path) as img:
            w, h = img.size
    except Exception as e:
        w, h = (0, 0)
    
    base_name = os.path.splitext(f)[0]
    has_webp = os.path.exists(os.path.join(product_dir, base_name + '.webp'))
    
    inventory.append({
        'filename': f,
        'path': path,
        'ext': ext,
        'width': w,
        'height': h,
        'size_kb': round(size_kb, 2),
        'has_webp_equivalent': has_webp
    })

print("\nSample Inventory Items:")
for item in inventory[:10]:
    print(item)

with open('scratch/product_image_inventory.json', 'w', encoding='utf-8') as out:
    json.dump(inventory, out, indent=2)
