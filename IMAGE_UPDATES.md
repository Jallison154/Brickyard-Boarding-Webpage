# Image Update Instructions

The website is set up to pull images from the original Wix site. To get the actual image URLs:

## Option 1: Extract from Wix Site (Recommended)

1. Visit the original Wix site: https://springcorgis.wixsite.com/brickyard-kennels
2. Right-click on any image and select "Inspect" or "Inspect Element"
3. Look for the `src` attribute in the HTML - it will typically look like:
   - `https://static.wixstatic.com/media/[image-id]~mv2.jpg` or
   - `https://images.unsplash.com/...` or similar
4. Copy the full image URL
5. Update the `src` attributes in `index.html` for the gallery and about section images

## Option 2: Use Local Images

1. Create an `images` folder in the project directory
2. Download images from the Wix site and save them locally
3. Update the image `src` paths in `index.html` to point to:
   - `images/kennel-facility.jpg`
   - `images/dogs-playing.jpg`
   - etc.

## Current Image Placeholders

The following images are currently set up with placeholder URLs:
- About section: Line 69 in index.html
- Gallery images: Lines 140, 146, 152, 158, 164, 170 in index.html

These will automatically show placeholder SVGs if the image URLs fail to load, but you should replace them with actual images from the Wix site for the best user experience.

## Image Optimization Tips

- Use images with aspect ratios close to 4:3 for gallery items
- Recommended sizes:
  - Gallery images: 800x600px minimum
  - About section image: 600x600px minimum
  - Compress images for web (use tools like TinyPNG or ImageOptim)

