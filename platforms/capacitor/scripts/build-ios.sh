#!/bin/bash

# Build script for iOS app
# Builds the web app, syncs to iOS, and creates an iOS build

set -e

echo "🚀 Building nChat iOS App"
echo "========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BUILD_TYPE="${1:-release}"  # debug or release
EXPORT_METHOD="${2:-app-store}"  # app-store, ad-hoc, enterprise, development

echo -e "${YELLOW}Build Type: ${BUILD_TYPE}${NC}"
echo -e "${YELLOW}Export Method: ${EXPORT_METHOD}${NC}"

# Step 1: Build the web app
echo ""
echo "📦 Step 1: Building web app..."
cd ../..
pnpm build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Web build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Web build completed${NC}"

# Step 2: Export for Capacitor
echo ""
echo "📤 Step 2: Exporting for Capacitor..."
pnpm next export -o platforms/capacitor/out

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Export failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Export completed${NC}"

# Step 3: Sync to iOS
echo ""
echo "🔄 Step 3: Syncing to iOS..."
cd platforms/capacitor
npx cap sync ios

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Capacitor sync failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Sync completed${NC}"

# Step 4: Update version and build number
echo ""
echo "🔢 Step 4: Updating version..."
VERSION=$(node -p "require('../../package.json').version")
BUILD_NUMBER=$(date +%Y%m%d%H%M)

/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $VERSION" ios/App/App/Info.plist
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $BUILD_NUMBER" ios/App/App/Info.plist

echo -e "${GREEN}✅ Version: $VERSION, Build: $BUILD_NUMBER${NC}"

# Step 5: Build iOS app
echo ""
echo "🏗️  Step 5: Building iOS app..."

if [ "$BUILD_TYPE" = "debug" ]; then
    # Build for simulator
    xcodebuild -workspace ios/App/App.xcworkspace \
               -scheme App \
               -configuration Debug \
               -sdk iphonesimulator \
               -derivedDataPath ios/build \
               build
else
    # Build for device
    xcodebuild -workspace ios/App/App.xcworkspace \
               -scheme App \
               -configuration Release \
               -sdk iphoneos \
               -derivedDataPath ios/build \
               -archivePath ios/build/App.xcarchive \
               archive
fi

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ iOS build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ iOS build completed${NC}"

# Step 6: Export IPA (release only)
if [ "$BUILD_TYPE" = "release" ]; then
    echo ""
    echo "📱 Step 6: Exporting IPA..."

    # Create ExportOptions.plist
    cat > ios/build/ExportOptions.plist <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>$EXPORT_METHOD</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>compileBitcode</key>
    <false/>
</dict>
</plist>
EOF

    xcodebuild -exportArchive \
               -archivePath ios/build/App.xcarchive \
               -exportPath ios/build/ipa \
               -exportOptionsPlist ios/build/ExportOptions.plist

    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ IPA export failed${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ IPA exported to: ios/build/ipa/App.ipa${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Build completed successfully!${NC}"

if [ "$BUILD_TYPE" = "debug" ]; then
    echo ""
    echo "To run on simulator:"
    echo "  cd platforms/capacitor"
    echo "  npx cap open ios"
else
    echo ""
    echo "IPA Location: platforms/capacitor/ios/build/ipa/App.ipa"
    echo ""
    echo "To upload to App Store Connect:"
    echo "  xcrun altool --upload-app --file ios/build/ipa/App.ipa --username YOUR_APPLE_ID --password YOUR_APP_SPECIFIC_PASSWORD"
fi
