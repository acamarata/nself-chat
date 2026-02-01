#!/bin/bash
#
# Linux Post-Install Script
# Runs after installing nchat on Linux systems
#

set -e

echo "Running nchat post-install script..."

# Get the installation directory
INSTALL_DIR="/opt/nchat"
APP_NAME="nchat"

# Update desktop database
if command -v update-desktop-database &> /dev/null; then
    echo "Updating desktop database..."
    update-desktop-database -q /usr/share/applications || true
fi

# Update MIME database
if command -v update-mime-database &> /dev/null; then
    echo "Updating MIME database..."
    update-mime-database /usr/share/mime || true
fi

# Update icon cache
if command -v gtk-update-icon-cache &> /dev/null; then
    echo "Updating icon cache..."
    gtk-update-icon-cache -q -t -f /usr/share/icons/hicolor || true
fi

# Register protocol handler
if command -v xdg-mime &> /dev/null; then
    echo "Registering nchat:// protocol handler..."
    xdg-mime default nchat.desktop x-scheme-handler/nchat || true
fi

# Create symlink for command-line usage
if [ ! -L "/usr/bin/nchat" ]; then
    echo "Creating command-line symlink..."
    ln -sf "${INSTALL_DIR}/${APP_NAME}" /usr/bin/nchat || true
fi

# Set correct permissions
if [ -d "${INSTALL_DIR}" ]; then
    echo "Setting permissions..."
    chmod 755 "${INSTALL_DIR}" || true
    chmod 755 "${INSTALL_DIR}/${APP_NAME}" || true

    # Enable chrome-sandbox if it exists
    if [ -f "${INSTALL_DIR}/chrome-sandbox" ]; then
        chmod 4755 "${INSTALL_DIR}/chrome-sandbox" || true
    fi
fi

# AppArmor profile (if AppArmor is installed)
if command -v apparmor_parser &> /dev/null; then
    if [ -f "/etc/apparmor.d/${APP_NAME}" ]; then
        echo "Loading AppArmor profile..."
        apparmor_parser -r "/etc/apparmor.d/${APP_NAME}" || true
    fi
fi

echo "Post-install completed successfully!"

exit 0
