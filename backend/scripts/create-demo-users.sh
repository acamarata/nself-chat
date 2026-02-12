#!/bin/bash
# =============================================================================
# Create Demo Users via Nhost Auth API
# =============================================================================
# Purpose: Automatically create demo user accounts for development/staging
# Usage: ./scripts/create-demo-users.sh [environment]
# Environment: dev (default), staging, prod
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Header
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}         Create Demo Users for nself-chat                ${BLUE}║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Determine environment
ENV="${1:-dev}"

# Set Auth URL based on environment
case "$ENV" in
    dev)
        AUTH_URL="https://auth.local.nself.org"
        ;;
    staging)
        AUTH_URL="https://auth.staging.nself.org"
        ;;
    prod)
        log_error "Cannot create demo users in production!"
        log_warning "Production users must be created manually with strong passwords"
        exit 1
        ;;
    *)
        log_error "Unknown environment: $ENV"
        log_info "Usage: $0 [dev|staging]"
        exit 1
        ;;
esac

log_info "Environment: $ENV"
log_info "Auth URL: $AUTH_URL"
echo ""

# Demo users configuration
declare -A USERS
USERS[owner]="owner@nself.org"
USERS[admin]="admin@nself.org"
USERS[mod]="mod@nself.org"
USERS[support]="support@nself.org"
USERS[helper]="helper@nself.org"
USERS[user]="user@nself.org"

PASSWORD="password"

# Create users
log_info "Creating demo users..."
echo ""

for role in "${!USERS[@]}"; do
    email="${USERS[$role]}"

    log_info "Creating user: $email (role: $role)"

    # Create user via Nhost Auth API
    response=$(curl -s -w "\n%{http_code}" -X POST "$AUTH_URL/v1/signup/email-password" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$email\",
            \"password\": \"$PASSWORD\",
            \"options\": {
                \"displayName\": \"Demo ${role^}\",
                \"locale\": \"en\",
                \"metadata\": {
                    \"role\": \"$role\",
                    \"demo_account\": true
                }
            }
        }")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)

    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        log_success "Created: $email"
    elif echo "$body" | grep -q "already exists\|already registered"; then
        log_warning "Already exists: $email"
    else
        log_error "Failed to create: $email (HTTP $http_code)"
        echo "Response: $body"
    fi

    sleep 0.5  # Rate limiting
done

echo ""
log_success "User creation complete!"
echo ""

# Next steps
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}                    Next Steps                            ${BLUE}║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "1. Run the seed file to assign roles:"
echo "   ${GREEN}nself exec postgres psql -U postgres -d nchat < db/seeds/01_users_and_roles.sql${NC}"
echo ""
echo "2. Or use the seed script:"
echo "   ${GREEN}./scripts/seed.sh${NC}"
echo ""
echo "3. Verify users were created:"
echo "   ${GREEN}nself exec postgres psql -U postgres -d nchat -c \"SELECT email FROM auth.users WHERE email LIKE '%@nself.org';\"${NC}"
echo ""
echo "Demo User Credentials:"
echo "  Email: owner@nself.org, admin@nself.org, mod@nself.org, etc."
echo "  Password: ${YELLOW}password${NC}"
echo ""
log_warning "These are DEMO accounts for $ENV only!"
log_warning "Never use these credentials in production!"
echo ""
