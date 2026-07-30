import os
from PIL import Image, ImageOps, ImageChops

def get_symbol_bbox():
    img_path = 'img/logo/logodunesparfumsfondoblanco.jpg'
    with Image.open(img_path) as img:
        img_rgb = img.convert('RGB')
        # Invert to find non-white bounding box
        inv = ImageOps.invert(img_rgb)
        bbox = inv.getbbox()
        print(f"Bounding box in {img_path}: {bbox}")
        
        # Crop the official logo/symbol
        cropped = img_rgb.crop(bbox)
        print(f"Cropped symbol size: {cropped.size}")
        
        # Save scratch cropped sample
        cropped.save('scratch/cropped_logo_sample.jpg')

get_symbol_bbox()
