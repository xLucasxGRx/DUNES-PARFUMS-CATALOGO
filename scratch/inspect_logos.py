import os
from PIL import Image

for f in sorted(os.listdir('img/logo')):
    path = os.path.join('img/logo', f)
    if os.path.isfile(path):
        with Image.open(path) as img:
            print(f"{f}: format={img.format}, mode={img.mode}, size={img.size}")
