#!/bin/bash

# Script to generate favicon.ico and other necessary icons from favicon.svg
# Requires ImageMagick to be installed

echo "🔧 VortexCore Favicon Generator"
echo "============================="

# Check if favicon.svg exists
if [ ! -f "favicon.svg" ]; then
  echo "❌ Error: favicon.svg not found in the current directory"
  exit 1
fi

# Generate favicon.ico with multiple sizes (16x16, 32x32, 48x48)
echo "📷 Generating favicon.ico..."
convert -background none -density 1000 favicon.svg -define icon:auto-resize=16,32,48 favicon.ico

# Generate Apple touch icon
echo "📷 Generating Apple touch icon..."
convert -background none -density 1000 favicon.svg -resize 180x180 apple-touch-icon.png

# Generate Android Chrome icons
echo "📷 Generating Android Chrome icons..."
convert -background none -density 1000 favicon.svg -resize 192x192 android-chrome-192x192.png
convert -background none -density 1000 favicon.svg -resize 512x512 android-chrome-512x512.png

echo "✅ Favicon generation complete!"
