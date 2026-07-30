import os
import glob
from PIL import Image

product_dir = 'img/productos'
png_files = [f for f in os.listdir(product_dir) if f.lower().endswith('.png')]

print(f"Checking {len(png_files)} PNG product files...")

valid_count = 0
error_count = 0
missing_count = 0
size_savings_bytes = 0

for png in png_files:
    base = os.path.splitext(png)[0]
    webp_name = base + '.webp'
    png_path = os.path.join(product_dir, png)
    webp_path = os.path.join(product_dir, webp_name)
    
    if not os.path.exists(webp_path):
        print(f"MISSING WEBP: {png_path} has no webp equivalent!")
        missing_count += 1
        continue
    
    png_size = os.path.getsize(png_path)
    webp_size = os.path.getsize(webp_path)
    
    if webp_size == 0:
        print(f"ZERO SIZE WEBP: {webp_path} is 0 bytes!")
        error_count += 1
        continue
    
    try:
        with Image.open(webp_path) as w_img, Image.open(png_path) as p_img:
            w_w, w_h = w_img.size
            p_w, p_h = p_img.size
            
            # Check dimensions match
            if w_w != p_w or w_h != p_h:
                print(f"DIMENSION MISMATCH for {base}: PNG ({p_w}x{p_h}) vs WEBP ({w_w}x{w_h})")
                error_count += 1
                continue
            
            valid_count += 1
            size_savings_bytes += (png_size - webp_size)
    except Exception as e:
        print(f"CORRUPT WEBP {webp_name}: {e}")
        error_count += 1

print("\n--- VALIDATION SUMMARY ---")
print(f"Total PNGs checked: {len(png_files)}")
print(f"Valid WebP files: {valid_count}")
print(f"Missing WebP files: {missing_count}")
print(f"Corrupt / Erroneous WebP files: {error_count}")
print(f"Storage savings if PNGs deleted: {size_savings_bytes / 1024 / 1024:.2f} MB")
