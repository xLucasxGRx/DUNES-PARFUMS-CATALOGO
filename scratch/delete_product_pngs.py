import os

product_dir = 'img/productos'
png_files = [f for f in os.listdir(product_dir) if f.lower().endswith('.png')]

deleted_count = 0
deleted_bytes = 0

for png in png_files:
    base = os.path.splitext(png)[0]
    webp_path = os.path.join(product_dir, base + '.webp')
    png_path = os.path.join(product_dir, png)
    
    # Strict safety check: delete PNG ONLY IF matching WebP exists and is > 0 bytes
    if os.path.exists(webp_path) and os.path.getsize(webp_path) > 0:
        file_size = os.path.getsize(png_path)
        os.remove(png_path)
        deleted_count += 1
        deleted_bytes += file_size
        print(f"Deleted duplicate PNG: {png} ({file_size / 1024:.1f} KB)")
    else:
        print(f"WARNING: Retaining {png} because WebP equivalent was not verified!")

print(f"\nSuccessfully deleted {deleted_count} duplicate product PNG files.")
print(f"Total space freed: {deleted_bytes / 1024 / 1024:.2f} MB")
