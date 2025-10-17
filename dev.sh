#!/bin/bash

# Hardmode Pomodoro Development Script
# Makes it easy to start, stop, and test the application

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project paths
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
VENV_DIR="$PROJECT_ROOT/.venv"

# Functions
print_header() {
    echo -e "${GREEN}======================================${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}======================================${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if backend is running
is_backend_running() {
    lsof -i :8080 >/dev/null 2>&1
}

# Start backend
start_backend() {
    print_header "Starting Backend"
    
    if is_backend_running; then
        print_info "Backend already running on port 8080"
        return
    fi
    
    print_info "Starting Go backend..."
    cd "$BACKEND_DIR"
    nohup go run main.go > backend.log 2>&1 &
    sleep 3
    
    if is_backend_running; then
        print_success "Backend started on http://localhost:8080"
    else
        print_error "Failed to start backend. Check backend/backend.log"
        exit 1
    fi
}

# Stop backend
stop_backend() {
    print_header "Stopping Backend"
    
    if ! is_backend_running; then
        print_info "Backend is not running"
        return
    fi
    
    print_info "Stopping backend..."
    pkill -f "go run main.go" || true
    sleep 1
    
    if ! is_backend_running; then
        print_success "Backend stopped"
    else
        print_error "Failed to stop backend"
        exit 1
    fi
}

# Start desktop app
start_desktop() {
    print_header "Starting Desktop App"
    
    # Activate virtual environment
    if [ ! -d "$VENV_DIR" ]; then
        print_info "Virtual environment not found. Creating..."
        python3 -m venv "$VENV_DIR"
    fi
    
    source "$VENV_DIR/bin/activate"
    
    # Install dependencies if needed
    if ! python -c "import PySide6" 2>/dev/null; then
        print_info "Installing Python dependencies..."
        pip install pyside6 requests
    fi
    
    print_info "Starting desktop app..."
    cd "$PROJECT_ROOT"
    python -m hardmode.main
}

# Test API
test_api() {
    print_header "Testing API"
    
    if ! is_backend_running; then
        print_error "Backend is not running. Start it first with: $0 start"
        exit 1
    fi
    
    print_info "Testing health endpoint..."
    if curl -s http://localhost:8080/health | grep -q "ok"; then
        print_success "Health check passed"
    else
        print_error "Health check failed"
        exit 1
    fi
    
    print_info "Testing tasks endpoint..."
    curl -s http://localhost:8080/api/tasks >/dev/null
    print_success "Tasks endpoint OK"
    
    print_info "Testing statistics endpoint..."
    curl -s http://localhost:8080/api/statistics >/dev/null
    print_success "Statistics endpoint OK"
    
    print_success "All API tests passed!"
}

# Build backend
build_backend() {
    print_header "Building Backend"
    
    cd "$BACKEND_DIR"
    print_info "Building Go binary..."
    go build -o hardmode-backend main.go
    print_success "Backend built: backend/hardmode-backend"
}

# Docker build
docker_build() {
    print_header "Building Docker Image"
    
    cd "$BACKEND_DIR"
    print_info "Building Docker image..."
    docker build -t hardmode-backend .
    print_success "Docker image built: hardmode-backend"
}

# Docker run
docker_run() {
    print_header "Running with Docker Compose"
    
    cd "$PROJECT_ROOT"
    print_info "Starting services..."
    docker-compose up -d
    print_success "Services started with Docker Compose"
    print_info "Backend available at http://localhost:8080"
}

# Docker stop
docker_stop() {
    print_header "Stopping Docker Services"
    
    cd "$PROJECT_ROOT"
    print_info "Stopping services..."
    docker-compose down
    print_success "Services stopped"
}

# Show logs
show_logs() {
    print_header "Backend Logs"
    
    if [ -f "$BACKEND_DIR/backend.log" ]; then
        tail -f "$BACKEND_DIR/backend.log"
    else
        print_error "No log file found"
    fi
}

# Status
show_status() {
    print_header "Service Status"
    
    echo -n "Backend (Go API): "
    if is_backend_running; then
        echo -e "${GREEN}Running${NC} (http://localhost:8080)"
    else
        echo -e "${RED}Stopped${NC}"
    fi
    
    echo -n "Database: "
    if [ -f "$PROJECT_ROOT/backend/hardmode.db" ]; then
        echo -e "${GREEN}Exists${NC} ($PROJECT_ROOT/backend/hardmode.db)"
    else
        echo -e "${YELLOW}Not created yet${NC}"
    fi
}

# Main script
case "$1" in
    start)
        start_backend
        ;;
    stop)
        stop_backend
        ;;
    restart)
        stop_backend
        start_backend
        ;;
    desktop)
        start_desktop
        ;;
    dev)
        start_backend
        sleep 2
        start_desktop
        ;;
    test)
        test_api
        ;;
    build)
        build_backend
        ;;
    docker:build)
        docker_build
        ;;
    docker:up)
        docker_run
        ;;
    docker:down)
        docker_stop
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    *)
        echo "Hardmode Pomodoro - Development Script"
        echo ""
        echo "Usage: $0 {command}"
        echo ""
        echo "Commands:"
        echo "  start          Start the backend server"
        echo "  stop           Stop the backend server"
        echo "  restart        Restart the backend server"
        echo "  desktop        Start the desktop app"
        echo "  dev            Start both backend and desktop app"
        echo "  test           Test the API endpoints"
        echo "  build          Build the backend binary"
        echo "  docker:build   Build Docker image"
        echo "  docker:up      Start with Docker Compose"
        echo "  docker:down    Stop Docker services"
        echo "  logs           Show backend logs"
        echo "  status         Show service status"
        echo ""
        echo "Examples:"
        echo "  $0 start       # Start backend"
        echo "  $0 dev         # Start everything"
        echo "  $0 test        # Test API"
        exit 1
        ;;
esac

exit 0
