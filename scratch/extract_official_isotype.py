import os
from PIL import Image

# Load 1280x1280 master square logo
img_path = 'img/logo/logodunesparfumsfondoblanco.jpg'
with Image.open(img_path) as img:
    print(f"Master logo size: {img.size}")
    
    # Check if there is a square version without white background or isolate the symbol
    # Let's inspect logodunesparfumssinfondo.jpg as well
with Image.open('img/logo/logodunesparfumssinfondo.jpg') as img2:
    print(f"Sin fondo size: {img2.size}")

