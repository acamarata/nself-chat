#!/bin/bash

# Test iOS App on Multiple Simulators
# Tests nChat on iPhone 12 Mini, 13, 14 Pro, and 15 Pro Max

set -e

echo "📱 iOS Simulator Testing"
echo "========================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    echo -e "${RED}❌ Xcode not found. Please install Xcode from the Mac App Store.${NC}"
    exit 1
fi

# List of simulators to test
SIMULATORS=(
    "iPhone 12 Mini"
    "iPhone 13"
    "iPhone 14 Pro"
    "iPhone 15 Pro Max"
)

echo ""
echo -e "${YELLOW}Available Simulators:${NC}"
xcrun simctl list devices available | grep iPhone

echo ""
echo -e "${BLUE}Testing on the following devices:${NC}"
for sim in "${SIMULATORS[@]}"; do
    echo "  • $sim"
done

echo ""
echo -e "${YELLOW}Prerequisites:${NC}"
echo "  1. Web app must be built: pnpm build"
echo "  2. Capacitor synced: pnpm ios:sync"
echo "  3. Xcode project configured"
echo ""

read -p "Continue with testing? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
fi

# Test each simulator
for sim in "${SIMULATORS[@]}"; do
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Testing on: $sim${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    # Boot simulator
    echo -e "${YELLOW}Booting simulator...${NC}"
    xcrun simctl boot "$sim" 2>/dev/null || echo "Simulator already booted"
    sleep 2

    # Build and install
    echo -e "${YELLOW}Building and installing app...${NC}"
    cd ../../ios/App

    xcodebuild \
        -workspace App.xcworkspace \
        -scheme App \
        -configuration Debug \
        -sdk iphonesimulator \
        -destination "name=$sim" \
        build

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Build successful on $sim${NC}"

        # Launch app
        echo -e "${YELLOW}Launching app...${NC}"
        xcrun simctl launch booted io.nself.chat

        # Take screenshot
        SCREENSHOT_FILE="../../screenshots/${sim// /_}_screenshot.png"
        mkdir -p ../../screenshots
        xcrun simctl io booted screenshot "$SCREENSHOT_FILE"
        echo -e "${GREEN}📸 Screenshot saved: $SCREENSHOT_FILE${NC}"

        echo ""
        echo -e "${GREEN}✅ Test completed on $sim${NC}"
        echo -e "${YELLOW}Please manually verify:${NC}"
        echo "  • App launches without crashes"
        echo "  • UI renders correctly"
        echo "  • Safe areas handled properly"
        echo "  • No layout issues"
        echo ""

        read -p "Continue to next device? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            break
        fi
    else
        echo -e "${RED}❌ Build failed on $sim${NC}"
    fi

    cd ../..
done

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Testing Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Screenshots saved to: platforms/capacitor/screenshots/${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Review screenshots for UI issues"
echo "  2. Test manually on each device"
echo "  3. Verify all features work"
echo "  4. Check performance metrics"
echo "  5. Test on physical devices"
echo ""
