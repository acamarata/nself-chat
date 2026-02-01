#!/usr/bin/env bash
#
# Sign desktop applications (Electron/Tauri)
# Supports Windows, macOS, and Linux
# Usage: ./scripts/sign-desktop.sh <platform> <app-path>
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

if [ $# -lt 2 ]; then
    echo "Usage: $0 <platform> <app-path>"
    echo ""
    echo "Platforms: macos, windows, linux"
    echo "Examples:"
    echo "  $0 macos dist/nchat.app"
    echo "  $0 windows dist/nchat.exe"
    echo "  $0 linux dist/nchat.AppImage"
    exit 1
fi

PLATFORM="$1"
APP_PATH="$2"

cd "$PROJECT_ROOT"

# Validate platform
if [[ ! "$PLATFORM" =~ ^(macos|windows|linux)$ ]]; then
    log_error "Invalid platform: $PLATFORM (must be macos, windows, or linux)"
    exit 1
fi

# Validate app path
if [ ! -e "$APP_PATH" ]; then
    log_error "App not found: $APP_PATH"
    exit 1
fi

log_info "Signing $PLATFORM application: $APP_PATH"

case "$PLATFORM" in
    macos)
        # macOS code signing
        if [ -z "${CSC_LINK:-}" ]; then
            log_error "CSC_LINK environment variable is required for macOS signing"
            log_info "Set CSC_LINK to base64-encoded .p12 certificate"
            exit 1
        fi

        if [ -z "${CSC_KEY_PASSWORD:-}" ]; then
            log_error "CSC_KEY_PASSWORD environment variable is required"
            exit 1
        fi

        if [ -z "${APPLE_TEAM_ID:-}" ]; then
            log_warning "APPLE_TEAM_ID not set, using certificate team ID"
        fi

        # Decode certificate
        CERT_FILE=$(mktemp -t cert.XXXXXX.p12)
        trap "rm -f $CERT_FILE" EXIT
        echo "$CSC_LINK" | base64 --decode > "$CERT_FILE"

        # Import certificate to temporary keychain
        KEYCHAIN_NAME="signing-$$.keychain-db"
        KEYCHAIN_PASSWORD=$(openssl rand -base64 32)

        log_info "Creating temporary keychain..."
        security create-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_NAME"
        security set-keychain-settings -lut 21600 "$KEYCHAIN_NAME"
        security unlock-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_NAME"

        trap "security delete-keychain $KEYCHAIN_NAME 2>/dev/null || true; rm -f $CERT_FILE" EXIT

        log_info "Importing certificate..."
        security import "$CERT_FILE" -k "$KEYCHAIN_NAME" -P "$CSC_KEY_PASSWORD" -T /usr/bin/codesign
        security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$KEYCHAIN_PASSWORD" "$KEYCHAIN_NAME"

        # Get signing identity
        IDENTITY=$(security find-identity -v -p codesigning "$KEYCHAIN_NAME" | grep -o '"[^"]*"' | head -1 | tr -d '"')

        if [ -z "$IDENTITY" ]; then
            log_error "No signing identity found in certificate"
            exit 1
        fi

        log_info "Signing identity: $IDENTITY"

        # Sign application
        log_info "Signing application..."

        if [[ "$APP_PATH" == *.app ]]; then
            # Sign .app bundle
            codesign --sign "$IDENTITY" \
                --keychain "$KEYCHAIN_NAME" \
                --force \
                --deep \
                --options runtime \
                --timestamp \
                --verbose \
                "$APP_PATH"
        elif [[ "$APP_PATH" == *.dmg ]]; then
            # Sign .dmg
            codesign --sign "$IDENTITY" \
                --keychain "$KEYCHAIN_NAME" \
                --timestamp \
                --verbose \
                "$APP_PATH"
        else
            log_error "Unsupported macOS app format: $APP_PATH"
            exit 1
        fi

        # Verify signature
        log_info "Verifying signature..."
        if codesign --verify --deep --strict --verbose=2 "$APP_PATH"; then
            log_success "macOS application signed successfully"
        else
            log_error "Signature verification failed"
            exit 1
        fi

        # Display signature info
        log_info "Signature info:"
        codesign -dvv "$APP_PATH" 2>&1 | grep -E "Authority|Identifier|Format|TeamIdentifier"

        ;;

    windows)
        # Windows code signing
        if [ -z "${WIN_CSC_LINK:-}" ] && [ -z "${CSC_LINK:-}" ]; then
            log_error "WIN_CSC_LINK or CSC_LINK environment variable is required"
            log_info "Set to base64-encoded .pfx certificate"
            exit 1
        fi

        if [ -z "${WIN_CSC_KEY_PASSWORD:-}" ] && [ -z "${CSC_KEY_PASSWORD:-}" ]; then
            log_error "WIN_CSC_KEY_PASSWORD or CSC_KEY_PASSWORD is required"
            exit 1
        fi

        CERT_LINK="${WIN_CSC_LINK:-$CSC_LINK}"
        CERT_PASSWORD="${WIN_CSC_KEY_PASSWORD:-$CSC_KEY_PASSWORD}"

        # Decode certificate
        CERT_FILE=$(mktemp -t cert.XXXXXX.pfx)
        trap "rm -f $CERT_FILE" EXIT
        echo "$CERT_LINK" | base64 --decode > "$CERT_FILE"

        # Check for signing tools
        if command -v osslsigncode &> /dev/null; then
            # Use osslsigncode (cross-platform)
            log_info "Signing with osslsigncode..."

            osslsigncode sign \
                -pkcs12 "$CERT_FILE" \
                -pass "$CERT_PASSWORD" \
                -n "nChat" \
                -i "https://nchat.io" \
                -t http://timestamp.digicert.com \
                -in "$APP_PATH" \
                -out "${APP_PATH}.signed"

            mv "${APP_PATH}.signed" "$APP_PATH"

            # Verify
            log_info "Verifying signature..."
            if osslsigncode verify "$APP_PATH"; then
                log_success "Windows application signed successfully"
            else
                log_error "Signature verification failed"
                exit 1
            fi

        elif command -v signtool.exe &> /dev/null; then
            # Use Windows SDK signtool
            log_info "Signing with signtool.exe..."

            signtool.exe sign \
                /f "$CERT_FILE" \
                /p "$CERT_PASSWORD" \
                /tr http://timestamp.digicert.com \
                /td sha256 \
                /fd sha256 \
                /d "nChat" \
                /du "https://nchat.io" \
                "$APP_PATH"

            # Verify
            log_info "Verifying signature..."
            if signtool.exe verify /pa "$APP_PATH"; then
                log_success "Windows application signed successfully"
            else
                log_error "Signature verification failed"
                exit 1
            fi

        else
            log_error "No Windows signing tool found (osslsigncode or signtool.exe)"
            log_info "Install osslsigncode: brew install osslsigncode (macOS/Linux)"
            exit 1
        fi

        ;;

    linux)
        # Linux doesn't have mandatory code signing like macOS/Windows
        # But we can create GPG signatures for verification

        log_info "Creating GPG signature for Linux package..."

        if [ -z "${GPG_PRIVATE_KEY:-}" ]; then
            log_warning "GPG_PRIVATE_KEY not set, skipping GPG signature"
            log_info "For production releases, set GPG_PRIVATE_KEY to base64-encoded private key"
            exit 0
        fi

        if [ -z "${GPG_PASSPHRASE:-}" ]; then
            log_error "GPG_PASSPHRASE is required when GPG_PRIVATE_KEY is set"
            exit 1
        fi

        # Import GPG key
        log_info "Importing GPG key..."
        echo "$GPG_PRIVATE_KEY" | base64 --decode | gpg --batch --import

        # Sign package
        log_info "Signing package..."
        echo "$GPG_PASSPHRASE" | gpg --batch --yes --passphrase-fd 0 \
            --armor \
            --detach-sign \
            --output "${APP_PATH}.sig" \
            "$APP_PATH"

        if [ -f "${APP_PATH}.sig" ]; then
            log_success "GPG signature created: ${APP_PATH}.sig"

            # Verify signature
            log_info "Verifying signature..."
            if gpg --verify "${APP_PATH}.sig" "$APP_PATH" 2>&1 | grep -q "Good signature"; then
                log_success "Linux package signed successfully"
            else
                log_error "Signature verification failed"
                exit 1
            fi
        else
            log_error "Failed to create GPG signature"
            exit 1
        fi

        ;;
esac

log_success "Signing complete for $PLATFORM"
