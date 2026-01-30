#!/bin/bash

# Build script for Android app
# Builds the web app, syncs to Android, and creates an APK/AAB

set -e

echo "🚀 Building nChat Android App"
echo "============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BUILD_TYPE="${1:-release}"  # debug or release
OUTPUT_FORMAT="${2:-aab}"  # apk or aab (Android App Bundle)

echo -e "${YELLOW}Build Type: ${BUILD_TYPE}${NC}"
echo -e "${YELLOW}Output Format: ${OUTPUT_FORMAT}${NC}"

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

# Step 3: Sync to Android
echo ""
echo "🔄 Step 3: Syncing to Android..."
cd platforms/capacitor
npx cap sync android

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Capacitor sync failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Sync completed${NC}"

# Step 4: Update version
echo ""
echo "🔢 Step 4: Updating version..."
VERSION=$(node -p "require('../../package.json').version")
VERSION_CODE=$(date +%Y%m%d%H%M)

# Update build.gradle
sed -i.bak "s/versionName \".*\"/versionName \"$VERSION\"/" android/app/build.gradle
sed -i.bak "s/versionCode .*/versionCode $VERSION_CODE/" android/app/build.gradle
rm -f android/app/build.gradle.bak

echo -e "${GREEN}✅ Version: $VERSION, Version Code: $VERSION_CODE${NC}"

# Step 5: Build Android app
echo ""
echo "🏗️  Step 5: Building Android app..."

cd android

if [ "$BUILD_TYPE" = "debug" ]; then
    # Build debug APK
    ./gradlew assembleDebug

    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Android build failed${NC}"
        exit 1
    fi

    APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
    echo -e "${GREEN}✅ Debug APK created: $APK_PATH${NC}"

else
    # Build release
    if [ "$OUTPUT_FORMAT" = "aab" ]; then
        # Build Android App Bundle
        ./gradlew bundleRelease

        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ Android build failed${NC}"
            exit 1
        fi

        AAB_PATH="app/build/outputs/bundle/release/app-release.aab"
        echo -e "${GREEN}✅ Release AAB created: $AAB_PATH${NC}"
    else
        # Build APK
        ./gradlew assembleRelease

        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ Android build failed${NC}"
            exit 1
        fi

        APK_PATH="app/build/outputs/apk/release/app-release-unsigned.apk"
        echo -e "${GREEN}✅ Release APK created: $APK_PATH${NC}"

        # Sign APK if keystore is configured
        if [ -f "keystore.properties" ]; then
            echo ""
            echo "🔐 Signing APK..."
            ./gradlew assembleRelease

            if [ $? -eq 0 ]; then
                SIGNED_APK="app/build/outputs/apk/release/app-release.apk"
                echo -e "${GREEN}✅ Signed APK: $SIGNED_APK${NC}"
            fi
        fi
    fi
fi

cd ..

# Step 6: Copy outputs to distribution folder
echo ""
echo "📋 Step 6: Copying outputs..."

mkdir -p dist

if [ "$BUILD_TYPE" = "debug" ]; then
    cp "android/$APK_PATH" "dist/nchat-debug.apk"
    echo -e "${GREEN}✅ Copied to: dist/nchat-debug.apk${NC}"
else
    if [ "$OUTPUT_FORMAT" = "aab" ]; then
        cp "android/$AAB_PATH" "dist/nchat-release.aab"
        echo -e "${GREEN}✅ Copied to: dist/nchat-release.aab${NC}"
    else
        if [ -f "android/app/build/outputs/apk/release/app-release.apk" ]; then
            cp "android/app/build/outputs/apk/release/app-release.apk" "dist/nchat-release.apk"
        else
            cp "android/$APK_PATH" "dist/nchat-release-unsigned.apk"
        fi
        echo -e "${GREEN}✅ Copied to: dist/${NC}"
    fi
fi

echo ""
echo -e "${GREEN}🎉 Build completed successfully!${NC}"

if [ "$BUILD_TYPE" = "debug" ]; then
    echo ""
    echo "To install on device:"
    echo "  adb install -r platforms/capacitor/dist/nchat-debug.apk"
    echo ""
    echo "To run on emulator:"
    echo "  cd platforms/capacitor"
    echo "  npx cap open android"
else
    echo ""
    if [ "$OUTPUT_FORMAT" = "aab" ]; then
        echo "AAB Location: platforms/capacitor/dist/nchat-release.aab"
        echo ""
        echo "To upload to Google Play Console:"
        echo "  1. Go to https://play.google.com/console"
        echo "  2. Select your app"
        echo "  3. Go to Production > Create new release"
        echo "  4. Upload the AAB file"
    else
        echo "APK Location: platforms/capacitor/dist/"
        echo ""
        echo "To install on device:"
        echo "  adb install -r platforms/capacitor/dist/nchat-release.apk"
    fi
fi
