#!/bin/bash

# Generate iOS App Icons
# Requires ImageMagick: brew install imagemagick

set -e

echo "🎨 Generating iOS App Icons"
echo "============================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check for ImageMagick
if ! command -v convert &> /dev/null; then
    echo -e "${RED}❌ ImageMagick not found${NC}"
    echo "Install with: brew install imagemagick"
    exit 1
fi

# Source and destination
SOURCE_ICON="../assets/icon.png"
DEST_DIR="../ios/App/App/Assets.xcassets/AppIcon.appiconset"

if [ ! -f "$SOURCE_ICON" ]; then
    echo -e "${YELLOW}⚠️  Source icon not found at $SOURCE_ICON${NC}"
    echo "Creating placeholder icon..."

    # Create placeholder 1024x1024 icon with nChat branding
    convert -size 1024x1024 xc:"#6366f1" \
        -font Arial-Bold -pointsize 200 -fill white \
        -gravity center -annotate +0+0 "ɳ" \
        "$SOURCE_ICON"

    echo -e "${GREEN}✅ Created placeholder icon${NC}"
fi

# Icon sizes for iPhone and iPad
declare -A SIZES=(
    ["icon-20.png"]="20"
    ["icon-20@2x.png"]="40"
    ["icon-20@2x-1.png"]="40"
    ["icon-20@3x.png"]="60"
    ["icon-29.png"]="29"
    ["icon-29@2x.png"]="58"
    ["icon-29@2x-1.png"]="58"
    ["icon-29@3x.png"]="87"
    ["icon-40.png"]="40"
    ["icon-40@2x.png"]="80"
    ["icon-40@2x-1.png"]="80"
    ["icon-40@3x.png"]="120"
    ["icon-60@2x.png"]="120"
    ["icon-60@3x.png"]="180"
    ["icon-76.png"]="76"
    ["icon-76@2x.png"]="152"
    ["icon-83.5@2x.png"]="167"
    ["icon-1024.png"]="1024"
)

# Generate each size
echo ""
echo "Generating icons..."

for filename in "${!SIZES[@]}"; do
    size="${SIZES[$filename]}"
    output="$DEST_DIR/$filename"

    convert "$SOURCE_ICON" \
        -resize "${size}x${size}" \
        -quality 100 \
        "$output"

    echo -e "${GREEN}✅ Generated $filename (${size}x${size})${NC}"
done

echo ""
echo -e "${GREEN}🎉 All iOS app icons generated successfully!${NC}"
echo ""
echo "Icons location: $DEST_DIR"
