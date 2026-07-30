import os
from PIL import Image, ImageDraw, ImageFont

def generate_dunes_favicon():
    # Primary brand colors
    bg_color = (23, 23, 23)        # #171717 Luxury Black
    gold_color = (177, 130, 37)    # #B18225 Dunes Gold
    gold_light = (212, 175, 55)    # #D4AF37 Bright Gold
    
    # Create 512x512 master image
    size = 512
    img = Image.new('RGBA', (size, size), bg_color)
    draw = ImageDraw.Draw(img)
    
    # Draw luxury gold circular border
    margin = 32
    stroke_w = 16
    draw.ellipse([margin, margin, size - margin, size - margin], outline=gold_color, width=stroke_w)
    
    # Draw letter 'D' stylized for Dunes Parfums
    # Vertical line of 'D'
    left = 180
    top = 130
    bottom = 382
    stem_w = 36
    draw.rectangle([left, top, left + stem_w, bottom], fill=gold_light)
    
    # Arc of 'D'
    arc_box = [left, top, left + 180, bottom]
    draw.arc(arc_box, start=270, end=90, fill=gold_light, width=stem_w)
    draw.rectangle([left, top, left + 90, top + stem_w], fill=gold_light)
    draw.rectangle([left, bottom - stem_w, left + 90, bottom], fill=gold_light)

    # Save apple-touch-icon (180x180)
    apple_img = img.resize((180, 180), Image.Resampling.LANCZOS)
    apple_img.save('apple-touch-icon.png', 'PNG')
    
    # Save 48x48 PNG
    png48 = img.resize((48, 48), Image.Resampling.LANCZOS)
    png48.save('favicon-48x48.png', 'PNG')
    
    # Save 32x32 PNG
    png32 = img.resize((32, 32), Image.Resampling.LANCZOS)
    png32.save('favicon-32x32.png', 'PNG')
    
    # Save ICO (multi-resolution 16, 32, 48)
    ico_img = img.resize((48, 48), Image.Resampling.LANCZOS)
    ico_img.save('favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
    
    print("Successfully generated favicon.ico, favicon-32x32.png, favicon-48x48.png, and apple-touch-icon.png!")

if __name__ == '__main__':
    generate_dunes_favicon()
