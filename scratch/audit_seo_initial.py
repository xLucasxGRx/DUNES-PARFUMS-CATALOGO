import os
import glob
import re

html_files = sorted(glob.glob('*.html'))
print(f"Found HTML files: {html_files}")

for filepath in html_files:
    print(f"\n--- AUDITING {filepath} ---")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lang_match = re.search(r'<html[^>]*lang=["\']([^"\']+)["\']', content, re.IGNORECASE)
    lang = lang_match.group(1) if lang_match else 'NONE'
    
    title_match = re.search(r'<title>(.*?)</title>', content, re.IGNORECASE | re.DOTALL)
    title = title_match.group(1).strip() if title_match else 'NONE'
    
    desc_match = re.search(r'<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\']+)["\']', content, re.IGNORECASE)
    desc = desc_match.group(1) if desc_match else 'NONE'
    
    canon_match = re.search(r'<link[^>]*rel=["\']canonical["\'][^>]*href=["\']([^"\']+)["\']', content, re.IGNORECASE)
    canon = canon_match.group(1) if canon_match else 'NONE'
    
    robots_match = re.search(r'<meta[^>]*name=["\']robots["\'][^>]*content=["\']([^"\']+)["\']', content, re.IGNORECASE)
    robots = robots_match.group(1) if robots_match else 'NONE'
    
    fav_match = re.search(r'<link[^>]*rel=["\'](?:shortcut )?icon["\']', content, re.IGNORECASE)
    fav = True if fav_match else False
    
    h1_matches = re.findall(r'<h1[^>]*>(.*?)</h1>', content, re.IGNORECASE | re.DOTALL)
    
    print(f"Lang: {lang}")
    print(f"Title: {title}")
    print(f"Meta Description: {desc}")
    print(f"Canonical: {canon}")
    print(f"Robots Meta: {robots}")
    print(f"Has Favicon: {fav}")
    print(f"H1 Count: {len(h1_matches)} -> {[h.strip() for h in h1_matches]}")
