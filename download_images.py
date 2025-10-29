#!/usr/bin/env python3
"""
Script to download images from the Brickyard Boarding Kennel Wix site
"""
import requests
import os
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import re

# Create resources/images directory if it doesn't exist
os.makedirs('resources/images', exist_ok=True)

url = 'https://springcorgis.wixsite.com/brickyard-kennels'

print(f"Fetching images from {url}...")

try:
    # Fetch the page
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    response = requests.get(url, headers=headers, timeout=10)
    response.raise_for_status()
    
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Find all image tags
    images = soup.find_all('img')
    
    downloaded = []
    image_patterns = [
        r'wixstatic\.com',
        r'wixpress\.com',
        r'\.jpg', r'\.jpeg', r'\.png', r'\.webp'
    ]
    
    for idx, img in enumerate(images, 1):
        src = img.get('src') or img.get('data-src') or img.get('data-cke-saved-src')
        if not src:
            continue
            
        # Filter for relevant images
        if any(pattern in src.lower() for pattern in image_patterns):
            try:
                # Get full URL
                if src.startswith('//'):
                    src = 'https:' + src
                elif src.startswith('/'):
                    src = urljoin(url, src)
                
                # Skip very small images (likely icons/sprites)
                if 'icon' in src.lower() or 'logo' in src.lower() or 'sprite' in src.lower():
                    continue
                
                # Download image
                img_response = requests.get(src, headers=headers, timeout=10, stream=True)
                
                if img_response.status_code == 200:
                    # Get filename
                    parsed = urlparse(src)
                    filename = os.path.basename(parsed.path)
                    if not filename or '.' not in filename:
                        # Generate filename
                        ext = 'jpg'
                        if '.png' in src.lower():
                            ext = 'png'
                        elif '.webp' in src.lower():
                            ext = 'webp'
                        filename = f"image_{idx}.{ext}"
                    
                    filepath = f"resources/images/{filename}"
                    
                    # Save image
                    with open(filepath, 'wb') as f:
                        for chunk in img_response.iter_content(chunk_size=8192):
                            f.write(chunk)
                    
                    downloaded.append((filename, src))
                    print(f"Downloaded: {filename}")
                    
            except Exception as e:
                print(f"Error downloading {src}: {e}")
                continue
    
    print(f"\nDownloaded {len(downloaded)} images!")
    print("\nDownloaded files:")
    for filename, url in downloaded:
        print(f"  - {filename}")
        
except Exception as e:
    print(f"Error: {e}")
    print("\nNote: You may need to install required packages:")
    print("  pip install requests beautifulsoup4")

