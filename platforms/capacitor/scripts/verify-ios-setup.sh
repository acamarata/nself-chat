#!/bin/bash

# Verify iOS Setup - Check all required files and configurations

set -e

echo "🔍 iOS Setup Verification"
echo "========================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ Missing: $1${NC}"
        ((ERRORS++))
    fi
}

# Function to check directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ Missing: $1${NC}"
        ((ERRORS++))
    fi
}

# Function to check file contains string
check_contains() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✅ $1 contains '$2'${NC}"
    else
        echo -e "${YELLOW}⚠️  $1 may be missing '$2'${NC}"
        ((WARNINGS++))
    fi
}

echo ""
echo "📱 Checking iOS Project Files..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_dir "../ios/App"
check_dir "../ios/App/App"
check_file "../ios/App/App/Info.plist"
check_file "../ios/App/App/AppDelegate.swift"
check_file "../ios/App/App/App.entitlements"
check_file "../ios/App/App.entitlements"

echo ""
echo "🎨 Checking Assets..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_dir "../ios/App/App/Assets.xcassets"
check_dir "../ios/App/App/Assets.xcassets/AppIcon.appiconset"
check_file "../ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json"
check_file "../ios/App/App/Base.lproj/LaunchScreen.storyboard"

echo ""
echo "📝 Checking Info.plist Configuration..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PLIST="../ios/App/App/Info.plist"
check_contains "$PLIST" "NSCameraUsageDescription"
check_contains "$PLIST" "NSMicrophoneUsageDescription"
check_contains "$PLIST" "NSPhotoLibraryUsageDescription"
check_contains "$PLIST" "NSFaceIDUsageDescription"
check_contains "$PLIST" "UIBackgroundModes"
check_contains "$PLIST" "BGTaskSchedulerPermittedIdentifiers"

echo ""
echo "🔐 Checking Entitlements..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ENTITLEMENTS="../ios/App/App/App.entitlements"
check_contains "$ENTITLEMENTS" "aps-environment"
check_contains "$ENTITLEMENTS" "com.apple.security.application-groups"
check_contains "$ENTITLEMENTS" "com.apple.developer.associated-domains"

echo ""
echo "📚 Checking TypeScript/JavaScript Files..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_file "../../../src/lib/ios/index.ts"
check_file "../../../src/lib/ios/background-fetch.ts"
check_file "../../../src/lib/ios/push-notifications.ts"
check_file "../../../src/lib/ios/safe-areas.ts"
check_file "../../../src/lib/ios/haptics.ts"

echo ""
echo "🛠️ Checking Build Scripts..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_file "./build-ios.sh"
check_file "./generate-ios-icons.sh"
check_file "./generate-screenshots.sh"
check_file "./test-ios-simulators.sh"
check_file "./verify-ios-setup.sh"

echo ""
echo "📖 Checking Documentation..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_file "../../../docs/deployment/ios-deployment.md"
check_file "../metadata/ios/app-store-metadata.json"
check_file "../ios/iOS-IMPLEMENTATION-COMPLETE.md"
check_file "../iOS-V0.8.0-COMPLETE.md"

echo ""
echo "⚙️ Checking package.json Scripts..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PACKAGE="../../../package.json"
check_contains "$PACKAGE" "ios:icons"
check_contains "$PACKAGE" "ios:build:debug"
check_contains "$PACKAGE" "ios:build:release"
check_contains "$PACKAGE" "ios:open"
check_contains "$PACKAGE" "ios:sync"

echo ""
echo "🤖 Checking GitHub Actions..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_file "../../../.github/workflows/build-capacitor-ios.yml"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Summary
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed! iOS setup is complete.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. pnpm ios:icons          # Generate app icons"
    echo "  2. pnpm ios:open           # Open in Xcode"
    echo "  3. Configure signing in Xcode"
    echo "  4. pnpm ios:build:debug    # Build and test"
    echo "  5. Capture screenshots"
    echo "  6. pnpm ios:build:release  # Build for App Store"
    echo ""
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Setup complete with $WARNINGS warnings.${NC}"
    echo ""
    echo "Warnings are typically configuration items that may need attention."
    echo "Review the warnings above and update files as needed."
    echo ""
else
    echo -e "${RED}❌ Setup incomplete. Found $ERRORS errors and $WARNINGS warnings.${NC}"
    echo ""
    echo "Please fix the missing files/configurations above."
    echo ""
    exit 1
fi
