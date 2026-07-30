import os
from PIL import Image, ImageOps

def build_favicons():
    output_dir = 'assets/favicon'
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Load official isotype image
    src_path = 'img/logo/logodunesparfumssinfondo.jpg'
    if not os.path.exists(src_path):
        src_path = 'img/logo/logodunesparfumsfondoblanco.jpg'
        
    print(f"Reading official brand logo from: {src_path}")
    
    with Image.open(src_path) as raw_img:
        img_rgb = raw_img.convert('RGB')
        
        # Determine bounding box of non-background content
        # Find dark vs gold features or crop central symbol
        w, h = img_rgb.size
        
        # Center square crop of the official isotype
        crop_margin = int(w * 0.08)
        cropped_symbol = img_rgb.crop((crop_margin, crop_margin, w - crop_margin, h - crop_margin))
        
        # Create 512x512 master square image with brand black background #171717
        master_size = 512
        master = Image.new('RGB', (master_size, master_size), (23, 23, 23))
        
        # Resize cropped symbol to 80% of master size (410px) for ideal padding
        target_symbol_size = int(master_size * 0.80)
        symbol_resized = cropped_symbol.resize((target_symbol_size, target_symbol_size), Image.Resampling.LANCZOS)
        
        # Paste centered
        offset = (master_size - target_symbol_size) // 2
        master.paste(symbol_resized, (offset, offset))
        
        # Save master WebP/PNG for verification
        master.save(os.path.join(output_dir, 'master_favicon_preview.png'), 'PNG')
        
        # 2. Generate required sizes
        # 16x16 PNG
        png16 = master.resize((16, 16), Image.Resampling.LANCZOS)
        png16.save(os.path.join(output_dir, 'favicon-16x16.png'), 'PNG', optimize=True)
        
        # 32x32 PNG
        png32 = master.resize((32, 32), Image.Resampling.LANCZOS)
        png32.save(os.path.join(output_dir, 'favicon-32x32.png'), 'PNG', optimize=True)
        
        # 48x48 PNG
        png48 = master.resize((48, 48), Image.Resampling.LANCZOS)
        png48.save(os.path.join(output_dir, 'favicon-48x48.png'), 'PNG', optimize=True)
        
        # 180x180 Apple Touch Icon
        apple180 = master.resize((180, 180), Image.Resampling.LANCZOS)
        apple180.save(os.path.join(output_dir, 'apple-touch-icon.png'), 'PNG', optimize=True)
        
        # 192x192 Android Chrome
        android192 = master.resize((192, 192), Image.Resampling.LANCZOS)
        android192.save(os.path.join(output_dir, 'android-chrome-192x192.png'), 'PNG', optimize=True)
        
        # 512x512 Android Chrome
        master.save(os.path.join(output_dir, 'android-chrome-512x512.png'), 'PNG', optimize=True)
        
        # ICO multi-resolution file containing 16x16, 32x32, 48x48
        ico_path = os.path.join(output_dir, 'favicon.ico')
        master.save(ico_path, format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
        
        # Also copy favicon.ico to root directory for fallback compatibility
        master.save('favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
        
        print("Generated all official Dunes Parfums favicon files successfully in assets/favicon/ and root!")

if __name__ == '__main__':
    build_favicons()
