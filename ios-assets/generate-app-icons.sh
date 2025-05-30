#!/bin/bash

# Script to generate all required iOS app icon sizes from the SVG template
# Requires Inkscape and ImageMagick to be installed

echo "🔧 VortexCore iOS App Icon Generator"
echo "===================================="

# Directory containing the SVG template
ICON_DIR="$(dirname "$0")/AppIcon.appiconset"
SVG_TEMPLATE="$ICON_DIR/icon-template.svg"

# Check if the SVG template exists
if [ ! -f "$SVG_TEMPLATE" ]; then
  echo "❌ Error: SVG template not found at $SVG_TEMPLATE"
  exit 1
fi

# Create an array of required icon sizes for iOS
# Format: [size]x[size]@[scale]x
declare -a ICON_SIZES=(
  # iPhone icons
  "20x20@2x" "20x20@3x"
  "29x29@2x" "29x29@3x"
  "40x40@2x" "40x40@3x"
  "60x60@2x" "60x60@3x"
  
  # iPad icons
  "20x20@1x" "20x20@2x"
  "29x29@1x" "29x29@2x"
  "40x40@1x" "40x40@2x"
  "76x76@1x" "76x76@2x"
  "83.5x83.5@2x"
  
  # App Store icon
  "1024x1024@1x"
)

# Function to convert size format to pixel dimensions
function get_pixel_size() {
  local size="$1"
  local base_size=$(echo $size | cut -d'x' -f1)
  local scale=$(echo $size | cut -d'@' -f2 | cut -d'x' -f1)
  
  echo $(( base_size * scale ))
}

# Function to convert SVG to PNG
function convert_svg_to_png() {
  local size_spec="$1"
  local base_size=$(echo $size_spec | cut -d'@' -f1)
  local pixel_size=$(get_pixel_size "$size_spec")
  local output_file="$ICON_DIR/Icon-$base_size@${size_spec#*@}.png"
  
  echo "📱 Generating icon: $base_size ($pixel_size x $pixel_size pixels)"
  
  # Use ImageMagick to convert SVG to PNG
  convert -background none -density 1000 -resize ${pixel_size}x${pixel_size} "$SVG_TEMPLATE" "$output_file"
  
  # Return the output filename and size for Contents.json update
  echo "$output_file $size_spec"
}

# Generate all icon sizes
echo "🎨 Generating app icons from SVG template..."
for size in "${ICON_SIZES[@]}"; do
  convert_svg_to_png "$size"
done

# Update Contents.json file with the generated filenames
echo "📝 Updating Contents.json file..."
CONTENTS_FILE="$ICON_DIR/Contents.json"
TMP_FILE="$ICON_DIR/Contents.json.tmp"

# Read the existing Contents.json
cat "$CONTENTS_FILE" > "$TMP_FILE"

# Add filename references to Contents.json
for size in "${ICON_SIZES[@]}"; do
  base_size=$(echo $size | cut -d'@' -f1)
  scale=$(echo $size | cut -d'@' -f2 | cut -d'x' -f1)
  filename="Icon-$base_size@${scale}x.png"
  
  # Add the filename to the appropriate entry in Contents.json
  sed -i '' "s/\"size\" : \"$base_size\",\n      \"scale\" : \"${scale}x\"/\"size\" : \"$base_size\",\n      \"scale\" : \"${scale}x\",\n      \"filename\" : \"$filename\"/" "$TMP_FILE"
done

# Replace the original Contents.json
mv "$TMP_FILE" "$CONTENTS_FILE"

echo "✅ App icon generation complete!"
echo "Generated $(echo ${ICON_SIZES[@]} | wc -w) icons in $ICON_DIR"
