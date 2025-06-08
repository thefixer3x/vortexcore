#!/bin/bash

# Security Hardening Script for VortexCore Production
# Run this script before production deployment

set -e

echo "🔒 VortexCore Security Hardening Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running in production mode
check_environment() {
    print_status "Checking environment configuration..."
    
    if [ "$NODE_ENV" != "production" ]; then
        print_error "NODE_ENV must be set to 'production'"
        exit 1
    fi
    
    print_success "Environment is set to production"
}

# Validate environment variables
validate_secrets() {
    print_status "Validating critical environment variables..."
    
    required_vars=(
        "JWT_SECRET"
        "JWT_REFRESH_SECRET"
        "DATABASE_URL"
        "REDIS_URL"
        "OPENAI_API_KEY"
        "GEMINI_API_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    # Check JWT secret strength
    if [ ${#JWT_SECRET} -lt 32 ]; then
        print_error "JWT_SECRET must be at least 32 characters long"
        exit 1
    fi
    
    if [ ${#JWT_REFRESH_SECRET} -lt 32 ]; then
        print_error "JWT_REFRESH_SECRET must be at least 32 characters long"
        exit 1
    fi
    
    print_success "All required environment variables are set and valid"
}

# Security audit of dependencies
security_audit() {
    print_status "Running security audit on dependencies..."
    
    npm audit --audit-level=moderate
    if [ $? -ne 0 ]; then
        print_error "Security vulnerabilities found in dependencies"
        print_status "Run 'npm audit fix' to resolve issues"
        exit 1
    fi
    
    # Check auth service dependencies
    if [ -d "services/auth-service" ]; then
        cd services/auth-service
        npm audit --audit-level=moderate
        if [ $? -ne 0 ]; then
            print_error "Security vulnerabilities found in auth service dependencies"
            exit 1
        fi
        cd ../..
    fi
    
    print_success "No security vulnerabilities found"
}

# Validate SSL/TLS configuration
check_ssl_config() {
    print_status "Validating SSL/TLS configuration..."
    
    # Check if HTTPS is enforced
    if [ "$FORCE_HTTPS" != "true" ]; then
        print_error "FORCE_HTTPS must be set to 'true' in production"
        exit 1
    fi
    
    print_success "SSL/TLS configuration is valid"
}

# Check database security
validate_database_security() {
    print_status "Validating database security configuration..."
    
    # Check if database URL uses SSL
    if [[ "$DATABASE_URL" != *"sslmode=require"* ]]; then
        print_error "Database connection must use SSL (add sslmode=require to DATABASE_URL)"
        exit 1
    fi
    
    print_success "Database security configuration is valid"
}

# Validate CORS settings
check_cors_config() {
    print_status "Validating CORS configuration..."
    
    # Check if CORS_ORIGIN is set to production domain
    if [ "$CORS_ORIGIN" = "http://localhost:8083" ] || [ "$CORS_ORIGIN" = "*" ]; then
        print_error "CORS_ORIGIN must be set to production domain, not localhost or wildcard"
        exit 1
    fi
    
    print_success "CORS configuration is valid"
}

# Check rate limiting configuration
validate_rate_limiting() {
    print_status "Validating rate limiting configuration..."
    
    # Check if rate limiting is properly configured
    if [ -z "$RATE_LIMIT_MAX_REQUESTS" ] || [ "$RATE_LIMIT_MAX_REQUESTS" -gt 1000 ]; then
        print_error "RATE_LIMIT_MAX_REQUESTS should be set and reasonable (< 1000)"
        exit 1
    fi
    
    print_success "Rate limiting configuration is valid"
}

# Verify monitoring configuration
check_monitoring_config() {
    print_status "Validating monitoring configuration..."
    
    # Check if monitoring is enabled
    required_monitoring_vars=(
        "LOG_LEVEL"
        "ENABLE_REQUEST_LOGGING"
    )
    
    for var in "${required_monitoring_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "Monitoring variable $var is not set"
            exit 1
        fi
    done
    
    print_success "Monitoring configuration is valid"
}

# Check file permissions
validate_file_permissions() {
    print_status "Checking file permissions..."
    
    # Check that sensitive files are not world-readable
    sensitive_files=(
        ".env"
        "services/auth-service/.env"
    )
    
    for file in "${sensitive_files[@]}"; do
        if [ -f "$file" ]; then
            perms=$(stat -f "%A" "$file" 2>/dev/null || stat -c "%a" "$file" 2>/dev/null)
            if [ "${perms: -1}" != "0" ]; then
                print_error "File $file should not be world-readable (current permissions: $perms)"
                exit 1
            fi
        fi
    done
    
    print_success "File permissions are secure"
}

# Generate security report
generate_security_report() {
    print_status "Generating security report..."
    
    cat > security-report.txt << EOF
VortexCore Security Audit Report
===============================
Date: $(date)
Environment: production

Security Checks Completed:
✅ Environment configuration
✅ Secret validation
✅ Dependency security audit
✅ SSL/TLS configuration
✅ Database security
✅ CORS configuration
✅ Rate limiting
✅ Monitoring setup
✅ File permissions

All security checks passed successfully.
System is ready for production deployment.

Next Steps:
1. Deploy to production environment
2. Monitor security alerts
3. Schedule regular security audits
4. Maintain security patches

EOF

    print_success "Security report generated: security-report.txt"
}

# Main execution
main() {
    echo "Starting security hardening process..."
    echo
    
    check_environment
    validate_secrets
    security_audit
    check_ssl_config
    validate_database_security
    check_cors_config
    validate_rate_limiting
    check_monitoring_config
    validate_file_permissions
    generate_security_report
    
    echo
    print_success "🎉 Security hardening completed successfully!"
    print_success "VortexCore is ready for production deployment"
    echo
    echo "Please review the security-report.txt file for details."
}

# Run the script
main "$@"
