import os
import glob
from PIL import Image

def get_dir_size(path):
    total = 0
    for root, dirs, files in os.walk(path):
        for f in files:
            fp = os.path.join(root, f)
            if os.path.isfile(fp):
                total += os.path.getsize(fp)
    return total

print("--- STARTING IMAGE OPTIMIZATION ---")

# 1. Banners & Categorias
for folder in ['img/banners', 'img/categorias', 'img/logo']:
    for filepath in glob.glob(f"{folder}/*.png"):
        size_before = os.path.getsize(filepath)
        try:
            with Image.open(filepath) as img:
                # Save optimized PNG
                if img.mode == 'RGBA':
                    img.save(filepath, 'PNG', optimize=True)
                else:
                    img.convert('RGB').save(filepath, 'PNG', optimize=True)
                
                # Save WebP version alongside
                webp_path = os.path.splitext(filepath)[0] + '.webp'
                img.save(webp_path, 'WEBP', quality=85, method=6)
                
                size_after = os.path.getsize(filepath)
                print(f"Optimized {filepath}: {size_before/1024:.1f}KB -> {size_after/1024:.1f}KB (WebP: {os.path.getsize(webp_path)/1024:.1f}KB)")
        except Exception as e:
            print(f"Error processing {filepath}: {e}")

# 2. Productos PNGs
product_files = glob.glob("img/productos/*.png")

for filepath in product_files:
    size_before = os.path.getsize(filepath)
    try:
        with Image.open(filepath) as img:
            # Resize if max dimension is > 800px (standard catalog display is max 450px)
            w, h = img.size
            max_dim = 800
            if w > max_dim or h > max_dim:
                if w > h:
                    new_w = max_dim
                    new_h = int(h * (max_dim / w))
                else:
                    new_h = max_dim
                    new_w = int(w * (max_dim / h))
                img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            
            # Save optimized PNG (quantize palette if transparent RGBA for huge size savings without losing quality)
            if img.mode == 'RGBA':
                # Preserve transparency while quantizing
                alpha = img.split()[3]
                img_p = img.convert('P', palette=Image.Palette.ADAPTIVE, colors=256)
                img_p.putalpha(alpha)
                img_p.save(filepath, 'PNG', optimize=True)
            else:
                img.convert('RGB').save(filepath, 'JPEG', quality=85, optimize=True)
            
            # Save WebP version
            webp_path = os.path.splitext(filepath)[0] + '.webp'
            img.save(webp_path, 'WEBP', quality=85, method=6)
            
            size_after = os.path.getsize(filepath)
            print(f"Optimized product {os.path.basename(filepath)}: {size_before/1024:.1f}KB -> {size_after/1024:.1f}KB (WebP: {os.path.getsize(webp_path)/1024:.1f}KB)")
    except Exception as e:
        print(f"Error processing product {filepath}: {e}")

# 3. Referencias Gallery Thumbnails & Optimization
ref_folders = ['assets/referencias/entregas', 'assets/referencias/decants', 'assets/referencias/envios']

for folder in ref_folders:
    thumb_folder = os.path.join(folder, 'thumbs')
    os.makedirs(thumb_folder, exist_ok=True)
    
    for filepath in glob.glob(f"{folder}/*.jpg") + glob.glob(f"{folder}/*.jpeg"):
        size_before = os.path.getsize(filepath)
        filename = os.path.basename(filepath)
        thumb_path = os.path.join(thumb_folder, filename)
        
        try:
            with Image.open(filepath) as img:
                img_rgb = img.convert('RGB')
                
                # Compress original high-res JPEG in-place
                img_rgb.save(filepath, 'JPEG', quality=82, optimize=True)
                
                # Create small thumbnail (width 320px)
                w, h = img_rgb.size
                thumb_w = 320
                thumb_h = int(h * (thumb_w / w))
                thumb_img = img_rgb.resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
                thumb_img.save(thumb_path, 'JPEG', quality=78, optimize=True)
                
                # Create WebP thumbnail as well
                thumb_webp = os.path.splitext(thumb_path)[0] + '.webp'
                thumb_img.save(thumb_webp, 'WEBP', quality=78)
                
                size_after = os.path.getsize(filepath)
                print(f"Ref {filename}: Orig {size_before/1024:.1f}KB -> {size_after/1024:.1f}KB | Thumb: {os.path.getsize(thumb_path)/1024:.1f}KB")
        except Exception as e:
            print(f"Error processing ref {filepath}: {e}")

print("--- COMPLETED IMAGE OPTIMIZATION ---")
