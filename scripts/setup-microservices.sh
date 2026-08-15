#!/bin/bash

# VortexCore Microservices Setup Script
# This script sets up the development environment for VortexCore microservices

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# Check if Docker is installed and running
check_docker() {
    print_status "Checking Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker Desktop."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker Desktop."
        exit 1
    fi
    
    print_success "Docker is installed and running"
}

# Check if Docker Compose is available
check_docker_compose() {
    print_status "Checking Docker Compose..."
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not available."
        exit 1
    fi
    
    print_success "Docker Compose is available"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p services/auth-service/logs
    mkdir -p kong/postgres_data
    mkdir -p monitoring
    mkdir -p monitoring/grafana/provisioning/dashboards
    mkdir -p monitoring/grafana/provisioning/datasources
    
    print_success "Directories created"
}

# Create monitoring configuration files
create_monitoring_config() {
    print_status "Creating monitoring configuration..."
    
    # Prometheus configuration
    cat > monitoring/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'vortex-auth-service'
    static_configs:
      - targets: ['auth-service:3001']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'kong'
    static_configs:
      - targets: ['kong:8001']
    metrics_path: '/status'
    scrape_interval: 30s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']
    scrape_interval: 30s

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
    scrape_interval: 30s
EOF

    # Grafana datasource configuration
    cat > monitoring/grafana/provisioning/datasources/prometheus.yml << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
EOF

    # Grafana dashboard configuration
    cat > monitoring/grafana/provisioning/dashboards/dashboard.yml << EOF
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
EOF

    print_success "Monitoring configuration created"
}

# Setup auth service
setup_auth_service() {
    print_header "Setting up Authentication Service"
    
    cd services/auth-service
    
    # Copy environment file
    if [ ! -f .env ]; then
        print_status "Creating .env file..."
        cp .env.example .env
        print_warning "Please update the .env file with your actual configuration"
    fi
    
    # Install dependencies
    print_status "Installing dependencies..."
    npm install
    
    # Generate Prisma client
    print_status "Generating Prisma client..."
    npx prisma generate
    
    print_success "Auth service setup complete"
    cd ../..
}

# Build services
build_services() {
    print_header "Building Services"
    
    print_status "Building auth service..."
    cd services/auth-service
    npm run build
    cd ../..
    
    print_success "Services built successfully"
}

# Start infrastructure services
start_infrastructure() {
    print_header "Starting Infrastructure Services"
    
    print_status "Starting database and cache..."
    docker-compose up -d postgres redis
    
    print_status "Waiting for database to be ready..."
    sleep 10
    
    # Wait for postgres to be ready
    while ! docker-compose exec -T postgres pg_isready -U vortex_user -d vortex_auth; do
        print_status "Waiting for PostgreSQL..."
        sleep 2
    done
    
    print_success "Infrastructure services started"
}

# Run database migrations
run_migrations() {
    print_header "Running Database Migrations"
    
    cd services/auth-service
    
    print_status "Pushing Prisma schema to database..."
    npx prisma db push
    
    print_status "Seeding database..."
    # Add seed script if needed
    # npx prisma db seed
    
    print_success "Database migrations completed"
    cd ../..
}

# Start all services
start_all_services() {
    print_header "Starting All Services"
    
    print_status "Starting all services..."
    docker-compose up -d
    
    print_status "Waiting for services to be ready..."
    sleep 15
    
    # Check service health
    check_service_health
    
    print_success "All services started"
}

# Check service health
check_service_health() {
    print_status "Checking service health..."
    
    # Check auth service
    if curl -f -s http://localhost:3001/health > /dev/null; then
        print_success "Auth service is healthy"
    else
        print_warning "Auth service health check failed"
    fi
    
    # Check Kong
    if curl -f -s http://localhost:8001/status > /dev/null; then
        print_success "Kong API Gateway is healthy"
    else
        print_warning "Kong health check failed"
    fi
    
    # Check Grafana
    if curl -f -s http://localhost:3000 > /dev/null; then
        print_success "Grafana is healthy"
    else
        print_warning "Grafana health check failed"
    fi
}

# Display service URLs
show_service_urls() {
    print_header "Service URLs"
    
    echo -e "${CYAN}Frontend Application:${NC}     http://localhost:8083"
    echo -e "${CYAN}Auth Service:${NC}             http://localhost:3001"
    echo -e "${CYAN}Auth Service Health:${NC}      http://localhost:3001/health"
    echo -e "${CYAN}Kong API Gateway:${NC}         http://localhost:8000"
    echo -e "${CYAN}Kong Admin:${NC}               http://localhost:8001"
    echo -e "${CYAN}Grafana:${NC}                  http://localhost:3000 (admin/admin)"
    echo -e "${CYAN}Prometheus:${NC}               http://localhost:9090"
    echo -e "${CYAN}Jaeger:${NC}                   http://localhost:16686"
    echo -e "${CYAN}Redis Insight:${NC}            http://localhost:8002"
    echo -e "${CYAN}MailHog:${NC}                  http://localhost:8025"
    echo ""
    echo -e "${YELLOW}Database Connection:${NC}"
    echo -e "Host: localhost:5432"
    echo -e "Database: vortex_auth"
    echo -e "Username: vortex_user"
    echo -e "Password: vortex_password"
    echo ""
    echo -e "${YELLOW}Redis Connection:${NC}"
    echo -e "Host: localhost:6379"
    echo -e "Password: vortex_redis_password"
}

# Main execution
main() {
    print_header "VortexCore Microservices Setup"
    
    # Pre-flight checks
    check_docker
    check_docker_compose
    
    # Setup
    create_directories
    create_monitoring_config
    setup_auth_service
    build_services
    
    # Start services
    start_infrastructure
    run_migrations
    start_all_services
    
    # Final status
    show_service_urls
    
    print_header "Setup Complete!"
    print_success "VortexCore microservices are now running!"
    print_status "You can now start developing with the beautiful dashboard at http://localhost:8083"
    print_status "View logs with: docker-compose logs -f [service-name]"
    print_status "Stop services with: docker-compose down"
}

# Handle script arguments
case "${1:-setup}" in
    "setup")
        main
        ;;
    "start")
        print_header "Starting Services"
        docker-compose up -d
        check_service_health
        show_service_urls
        ;;
    "stop")
        print_header "Stopping Services"
        docker-compose down
        print_success "Services stopped"
        ;;
    "restart")
        print_header "Restarting Services"
        docker-compose restart
        check_service_health
        ;;
    "logs")
        docker-compose logs -f
        ;;
    "health")
        check_service_health
        ;;
    "urls")
        show_service_urls
        ;;
    "clean")
        print_header "Cleaning Up"
        docker-compose down -v
        docker system prune -f
        print_success "Cleanup complete"
        ;;
    *)
        echo "Usage: $0 {setup|start|stop|restart|logs|health|urls|clean}"
        echo "  setup   - Initial setup and start (default)"
        echo "  start   - Start all services"
        echo "  stop    - Stop all services"
        echo "  restart - Restart all services"
        echo "  logs    - Follow service logs"
        echo "  health  - Check service health"
        echo "  urls    - Show service URLs"
        echo "  clean   - Stop services and clean up volumes"
        exit 1
        ;;
esac
