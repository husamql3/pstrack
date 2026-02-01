#!/bin/bash
# Auth API cURL Test Scripts
# Make this file executable: chmod +x auth-curl-tests.sh

# Configuration
BASE_URL="http://localhost:8787/api/v3"
AUTH_URL="$BASE_URL/auth"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper function to print section headers
print_section() {
    echo -e "\n${YELLOW}========================================${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${YELLOW}========================================${NC}\n"
}

# Helper function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Helper function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

###############################################################################
# BASIC HEALTH CHECKS
###############################################################################

test_health() {
    print_section "Testing Health Endpoint"
    
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        print_success "Health check passed"
        echo "$body" | jq '.'
    else
        print_error "Health check failed with status $http_code"
    fi
}

test_api_root() {
    print_section "Testing API Root"
    
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL/")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        print_success "API root accessible"
        echo "$body" | jq '.'
    else
        print_error "API root failed with status $http_code"
    fi
}

###############################################################################
# AUTHENTICATION TESTS
###############################################################################

test_signup() {
    print_section "Testing Sign Up"
    
    local email="${1:-test-$(date +%s)@example.com}"
    local password="${2:-Password123!}"
    local name="${3:-Test User}"
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$AUTH_URL/sign-up/email" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$email\",
            \"password\": \"$password\",
            \"name\": \"$name\"
        }")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        print_success "Sign up successful"
        echo "$body" | jq '.'
        echo "$email" > /tmp/test_email.txt
        echo "$password" > /tmp/test_password.txt
    else
        print_error "Sign up failed with status $http_code"
        echo "$body" | jq '.'
    fi
}

test_signin() {
    print_section "Testing Sign In"
    
    local email="${1:-$(cat /tmp/test_email.txt 2>/dev/null || echo 'test@example.com')}"
    local password="${2:-$(cat /tmp/test_password.txt 2>/dev/null || echo 'Password123!')}"
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$AUTH_URL/sign-in/email" \
        -H "Content-Type: application/json" \
        -c /tmp/cookies.txt \
        -d "{
            \"email\": \"$email\",
            \"password\": \"$password\"
        }")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        print_success "Sign in successful"
        echo "$body" | jq '.'
        
        # Extract session token
        if [ -f /tmp/cookies.txt ]; then
            session_token=$(grep "better-auth.session_token" /tmp/cookies.txt | awk '{print $7}')
            echo "$session_token" > /tmp/session_token.txt
            print_success "Session token saved"
        fi
    else
        print_error "Sign in failed with status $http_code"
        echo "$body" | jq '.'
    fi
}

test_get_session() {
    print_section "Testing Get Session"
    
    if [ ! -f /tmp/cookies.txt ]; then
        print_error "No session cookie found. Please sign in first."
        return 1
    fi
    
    response=$(curl -s -w "\n%{http_code}" "$AUTH_URL/session" \
        -b /tmp/cookies.txt)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        print_success "Session retrieved successfully"
        echo "$body" | jq '.'
    else
        print_error "Get session failed with status $http_code"
        echo "$body" | jq '.'
    fi
}

test_update_user() {
    print_section "Testing Update User"
    
    if [ ! -f /tmp/cookies.txt ]; then
        print_error "No session cookie found. Please sign in first."
        return 1
    fi
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$AUTH_URL/update-user" \
        -H "Content-Type: application/json" \
        -b /tmp/cookies.txt \
        -d '{
            "name": "Updated Test User"
        }')
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        print_success "User updated successfully"
        echo "$body" | jq '.'
    else
        print_error "Update user failed with status $http_code"
        echo "$body" | jq '.'
    fi
}

test_change_password() {
    print_section "Testing Change Password"
    
    if [ ! -f /tmp/cookies.txt ]; then
        print_error "No session cookie found. Please sign in first."
        return 1
    fi
    
    local current_password="${1:-$(cat /tmp/test_password.txt 2>/dev/null || echo 'Password123!')}"
    local new_password="${2:-NewPassword456!}"
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$AUTH_URL/change-password" \
        -H "Content-Type: application/json" \
        -b /tmp/cookies.txt \
        -d "{
            \"currentPassword\": \"$current_password\",
            \"newPassword\": \"$new_password\",
            \"revokeOtherSessions\": false
        }")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        print_success "Password changed successfully"
        echo "$body" | jq '.'
        echo "$new_password" > /tmp/test_password.txt
    else
        print_error "Change password failed with status $http_code"
        echo "$body" | jq '.'
    fi
}

test_signout() {
    print_section "Testing Sign Out"
    
    if [ ! -f /tmp/cookies.txt ]; then
        print_error "No session cookie found. Please sign in first."
        return 1
    fi
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$AUTH_URL/sign-out" \
        -b /tmp/cookies.txt)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        print_success "Sign out successful"
        echo "$body" | jq '.'
        rm -f /tmp/cookies.txt /tmp/session_token.txt
    else
        print_error "Sign out failed with status $http_code"
        echo "$body" | jq '.'
    fi
}

test_forget_password() {
    print_section "Testing Forget Password"
    
    local email="${1:-test@example.com}"
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$AUTH_URL/forget-password" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$email\",
            \"redirectTo\": \"http://localhost:3000/reset-password\"
        }")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        print_success "Password reset email sent"
        echo "$body" | jq '.'
    else
        print_error "Forget password failed with status $http_code"
        echo "$body" | jq '.'
    fi
}

test_list_sessions() {
    print_section "Testing List Sessions"
    
    if [ ! -f /tmp/cookies.txt ]; then
        print_error "No session cookie found. Please sign in first."
        return 1
    fi
    
    response=$(curl -s -w "\n%{http_code}" "$AUTH_URL/list-sessions" \
        -b /tmp/cookies.txt)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        print_success "Sessions retrieved successfully"
        echo "$body" | jq '.'
    else
        print_error "List sessions failed with status $http_code"
        echo "$body" | jq '.'
    fi
}

###############################################################################
# COMPLETE FLOW TESTS
###############################################################################

test_complete_signup_flow() {
    print_section "Running Complete Sign Up Flow"
    
    test_signup
    sleep 1
    test_signin
    sleep 1
    test_get_session
    sleep 1
    test_update_user
    sleep 1
    test_list_sessions
    sleep 1
    test_signout
}

test_complete_password_change_flow() {
    print_section "Running Complete Password Change Flow"
    
    test_signin
    sleep 1
    test_change_password
    sleep 1
    test_signout
    sleep 1
    test_signin
}

###############################################################################
# CLEANUP
###############################################################################

cleanup() {
    print_section "Cleaning Up Test Files"
    
    rm -f /tmp/cookies.txt
    rm -f /tmp/session_token.txt
    rm -f /tmp/test_email.txt
    rm -f /tmp/test_password.txt
    
    print_success "Cleanup complete"
}

###############################################################################
# MAIN MENU
###############################################################################

show_menu() {
    echo -e "\n${GREEN}Auth API Test Suite${NC}"
    echo "===================="
    echo "1.  Health Check"
    echo "2.  API Root"
    echo "3.  Sign Up"
    echo "4.  Sign In"
    echo "5.  Get Session"
    echo "6.  Update User"
    echo "7.  Change Password"
    echo "8.  Sign Out"
    echo "9.  Forget Password"
    echo "10. List Sessions"
    echo ""
    echo "11. Complete Sign Up Flow"
    echo "12. Complete Password Change Flow"
    echo ""
    echo "99. Cleanup Test Files"
    echo "0.  Exit"
    echo ""
}

# Main execution
if [ "$1" == "" ]; then
    while true; do
        show_menu
        read -p "Select test (0-99): " choice
        
        case $choice in
            1) test_health ;;
            2) test_api_root ;;
            3) test_signup ;;
            4) test_signin ;;
            5) test_get_session ;;
            6) test_update_user ;;
            7) test_change_password ;;
            8) test_signout ;;
            9) test_forget_password ;;
            10) test_list_sessions ;;
            11) test_complete_signup_flow ;;
            12) test_complete_password_change_flow ;;
            99) cleanup ;;
            0) echo "Goodbye!"; exit 0 ;;
            *) print_error "Invalid choice" ;;
        esac
    done
else
    # Run specific test from command line
    case $1 in
        health) test_health ;;
        signup) test_signup "$2" "$3" "$4" ;;
        signin) test_signin "$2" "$3" ;;
        session) test_get_session ;;
        update) test_update_user ;;
        password) test_change_password "$2" "$3" ;;
        signout) test_signout ;;
        forget) test_forget_password "$2" ;;
        sessions) test_list_sessions ;;
        flow) test_complete_signup_flow ;;
        cleanup) cleanup ;;
        *) echo "Unknown command: $1"; exit 1 ;;
    esac
fi