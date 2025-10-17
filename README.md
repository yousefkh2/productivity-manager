# Hardmode Pomodoro

A productivity app with a "hard mode" timer that keeps you focused. Built with Python/Qt desktop client and Go cloud backend.

## Architecture

- **Desktop App**: Python + PySide6 (persistent overlay, offline capable)
- **Backend API**: Go + SQLite/PostgreSQL (REST API, cloud-hosted)
- **Deployment**: Docker + Cloud platform

## Features

- ⏱️ Pomodoro timer with persistent overlay
- 📝 Task management
- 📊 Session tracking and statistics
- ☁️ Cloud sync across devices
- 🔒 Hard mode: No stopping once started!

## Quick Start

### 1. Start the Backend

```bash
# Option A: Run directly with Go
cd backend
go run main.go

# Option B: Use Docker
docker-compose up
```

API will be available at `http://localhost:8080`

### 2. Run the Desktop App

```bash
# Setup virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install pyside6 requests

# Run app
python -m hardmode.main
```

## API Endpoints

- `GET /health` - Health check
- `GET /api/tasks` - List all tasks
- `POST /api/tasks` - Create new task
  ```json
  {"name": "Task name", "description": "Description"}
  ```
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task
- `GET /api/sessions` - List sessions (optional: ?task_id=X)
- `POST /api/sessions` - Create session
  ```json
  {
    "task_id": 1,
    "duration": 25,
    "completed": true,
    "start_time": "2025-10-17T01:00:00Z",
    "end_time": "2025-10-17T01:25:00Z"
  }
  ```
- `GET /api/statistics` - Get statistics

## Development Status

✅ **Completed:**
- Go backend with REST API
- SQLite database integration
- Docker configuration
- Python API client
- All CRUD operations for tasks and sessions
- Statistics endpoint

🚧 **Next Steps:**
- Integrate API client with existing Python/Qt UI
- Add authentication (JWT tokens)
- Deploy backend to cloud (Render, Railway, or Fly.io)
- Package desktop app as executable
- Add offline support with local caching
- Implement data sync conflict resolution

## Project Structure

```
hardmode-pomo/
├── backend/              # Go REST API
│   ├── main.go          # API server
│   ├── Dockerfile       # Container config
│   └── go.mod           # Go dependencies
├── hardmode/            # Python desktop app
│   ├── main.py          # Entry point
│   ├── api_client.py    # API communication
│   ├── core/            # Business logic
│   ├── ui/              # Qt UI components
│   └── data/            # Data models
├── docker-compose.yml   # Local development
└── schema.sql          # Database schema
```

## Deployment

### Backend Deployment

1. **Build Docker image**:
   ```bash
   cd backend
   docker build -t hardmode-backend .
   ```

2. **Deploy to cloud platform**:
   
   **Render.com** (Free tier):
   - Create new Web Service
   - Connect GitHub repo
   - Use Dockerfile
   - Add environment variables: `DB_PATH=/data/hardmode.db`
   
   **Railway.app**:
   - Install Railway CLI
   - `railway login && railway init`
   - `railway up`
   
   **Fly.io**:
   - Install flyctl
   - `fly launch`
   - `fly deploy`

3. **Update desktop app**:
   ```bash
   export API_URL=https://your-app.onrender.com
   python -m hardmode.main
   ```

### Desktop App Packaging

```bash
# Install PyInstaller
pip install pyinstaller

# Create executable
pyinstaller --onefile --windowed hardmode/main.py
```

## Testing

Test the API client:
```bash
python hardmode/api_client.py
```

Test API endpoints with curl:
```bash
curl http://localhost:8080/health
curl http://localhost:8080/api/tasks
curl -X POST http://localhost:8080/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"name":"My Task","description":"Do something"}'
```

## License

MIT
