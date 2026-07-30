import os
from PIL import Image, ImageOps

def generate_white_favicons():
    output_dir = 'assets/favicon'
    os.makedirs(output_dir, exist_ok=True)
    
    src_path = 'img/logo/logodunesparfumsfondoblanco.jpg'
    print(f"Reading official white background logo from: {src_path}")
    
    if not os.path.exists(src_path):
        raise FileNotFoundError(f"Source file not found: {src_path}")
        
    with Image.open(src_path) as raw_img:
        img_rgb = raw_img.convert('RGB')
        w, h = img_rgb.size
        print(f"Source dimensions: {w}x{h}")
        
        # Invert colors to calculate non-white bounding box
        inv_img = ImageOps.invert(img_rgb)
        bbox = inv_img.getbbox()
        print(f"Detected symbol bounding box: {bbox}")
        
        if bbox:
            cropped_symbol = img_rgb.crop(bbox)
        else:
            cropped_symbol = img_rgb
            
        sym_w, sym_h = cropped_symbol.size
        
        # Create master 512x512 image with pure white background #FFFFFF
        master_size = 512
        master = Image.new('RGB', (master_size, master_size), (255, 255, 255))
        
        # Target size for symbol (82% of master canvas)
        max_target = int(master_size * 0.82)
        
        if sym_w > sym_h:
            target_w = max_target
            target_h = int(sym_h * (max_target / sym_w))
        else:
            target_h = max_target
            target_w = int(sym_w * (max_target / sym_h))
            
        symbol_resized = cropped_symbol.resize((target_w, target_h), Image.Resampling.LANCZOS)
        
        # Center symbol on white background
        offset_x = (master_size - target_w) // 2
        offset_y = (master_size - target_h) // 2
        master.paste(symbol_resized, (offset_x, offset_y))
        
        # Save preview
        master.save(os.path.join(output_dir, 'master_white_preview.png'), 'PNG')
        
        # Generate PNG sizes
        master.resize((16, 16), Image.Resampling.LANCZOS).save(os.path.join(output_dir, 'favicon-16x16.png'), 'PNG', optimize=True)
        master.resize((32, 32), Image.Resampling.LANCZOS).save(os.path.join(output_dir, 'favicon-32x32.png'), 'PNG', optimize=True)
        master.resize((48, 48), Image.Resampling.LANCZOS).save(os.path.join(output_dir, 'favicon-48x48.png'), 'PNG', optimize=True)
        master.resize((180, 180), Image.Resampling.LANCZOS).save(os.path.join(output_dir, 'apple-touch-icon.png'), 'PNG', optimize=True)
        master.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(output_dir, 'android-chrome-192x192.png'), 'PNG', optimize=True)
        master.save(os.path.join(output_dir, 'android-chrome-512x512.png'), 'PNG', optimize=True)
        
        # ICO multi-resolution file
        ico_path = os.path.join(output_dir, 'favicon.ico')
        master.save(ico_path, format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
        master.save('favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
        
        print("Successfully generated all white-background favicon files in assets/favicon/ and root!")

if __name__ == '__main__':
    generate_white_favicons()
