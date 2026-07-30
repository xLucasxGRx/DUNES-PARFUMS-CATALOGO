import os
import sys
import glob
from PIL import Image

def convertir_productos_a_webp():
    product_dir = 'img/productos'
    if not os.path.exists(product_dir):
        print(f"Error: No existe el directorio {product_dir}")
        return

    png_jpg_files = glob.glob(f"{product_dir}/*.png") + glob.glob(f"{product_dir}/*.jpg") + glob.glob(f"{product_dir}/*.jpeg")
    
    print(f"Encontrados {len(png_jpg_files)} archivos de producto PNG/JPG para procesar.")
    
    convertidos = 0
    for filepath in png_jpg_files:
        base, ext = os.path.splitext(filepath)
        webp_path = base + '.webp'
        
        try:
            with Image.open(filepath) as img:
                w, h = img.size
                # Redimensionar solo si excede 800px para fit: inside y withoutEnlargement
                if w > 800 or h > 800:
                    if w > h:
                        new_w = 800
                        new_h = int(h * (800 / w))
                    else:
                        new_h = 800
                        new_w = int(w * (800 / h))
                    img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
                
                img.save(webp_path, 'WEBP', quality=88, method=6)
                print(f"[OK] Convertido: {os.path.basename(filepath)} -> {os.path.basename(webp_path)} ({os.path.getsize(webp_path)/1024:.1f} KB)")
                convertidos += 1
        except Exception as e:
            print(f"[ERROR] No se pudo convertir {filepath}: {e}")

    print(f"\nProceso completado. {convertidos} imágenes procesadas a WebP.")

if __name__ == '__main__':
    convertir_productos_a_webp()
