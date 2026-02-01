#!/bin/bash
#
# Linux Post-Remove Script
# Runs after uninstalling nchat on Linux systems
#

set -e

echo "Running nchat post-remove script..."

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

# Remove command-line symlink
if [ -L "/usr/bin/nchat" ]; then
    echo "Removing command-line symlink..."
    rm -f /usr/bin/nchat || true
fi

# Unload AppArmor profile (if AppArmor is installed)
if command -v apparmor_parser &> /dev/null; then
    if [ -f "/etc/apparmor.d/${APP_NAME}" ]; then
        echo "Unloading AppArmor profile..."
        apparmor_parser -R "/etc/apparmor.d/${APP_NAME}" || true
    fi
fi

echo "Post-remove completed successfully!"

exit 0
