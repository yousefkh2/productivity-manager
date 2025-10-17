# Integration Guide: Connecting Python Desktop App to Go Backend

## Overview
This guide explains how to integrate the existing Python/Qt desktop app with the new Go backend API.

## Current State
- ✅ Go backend running with REST API
- ✅ Python API client created (`hardmode/api_client.py`)
- ⏳ Desktop app still using local SQLite database
- ⏳ Need to integrate API client with UI

## Integration Steps

### 1. Update Data Layer

The desktop app currently uses direct SQLite access. We need to:

1. **Create an abstraction layer** that can use either:
   - Local SQLite (offline mode)
   - Remote API (online mode)
   - Hybrid (sync between both)

2. **Modify existing data access code** to use the API client

### 2. Example Integration

#### Current code (direct SQLite):
```python
# Old way
import sqlite3
conn = sqlite3.connect('database.db')
cursor = conn.cursor()
cursor.execute("SELECT * FROM tasks")
tasks = cursor.fetchall()
```

#### New code (with API client):
```python
# New way
from hardmode.api_client import APIClient

api = APIClient()  # Will use localhost by default
tasks = api.get_tasks()

# Offline fallback
if tasks is None:
    # Use local SQLite as fallback
    pass
```

### 3. Data Sync Strategy

#### Option A: API-First (Recommended)
- All operations go through API
- Local SQLite only as cache
- Sync on startup and periodically

#### Option B: Dual-Write
- Write to both local DB and API
- More complex but better offline support

#### Option C: Queue-Based
- Write locally first
- Queue API requests
- Sync when online

### 4. Configuration

Add to config file or environment:
```python
# ~/.hardmode/config.ini
[api]
url = http://localhost:8080
timeout = 5
offline_mode = auto  # auto, online, offline
```

### 5. UI Updates

Show connection status in UI:
```python
if api.is_online():
    status_label.setText("☁️ Connected")
else:
    status_label.setText("📴 Offline Mode")
```

## Next Implementation Tasks

1. **Create DataManager class**
   - Handles both API and local DB
   - Decides when to use which
   - Manages sync

2. **Update Task Management**
   - Replace direct DB calls with DataManager
   - Add retry logic
   - Handle offline mode

3. **Update Session Tracking**
   - Send sessions to API
   - Store locally if offline
   - Sync on reconnect

4. **Add Sync UI**
   - Show sync status
   - Manual sync button
   - Conflict resolution UI

## Testing Checklist

- [ ] Create task while online → appears in API
- [ ] Create task while offline → stored locally
- [ ] Go offline → app still works
- [ ] Go online → local data syncs to API
- [ ] Start session → recorded in both places
- [ ] View statistics → shows combined data

## Code Examples

### DataManager (Hybrid Approach)

```python
class DataManager:
    def __init__(self):
        self.api = APIClient()
        self.local_db = LocalDatabase()
        
    def create_task(self, name, description):
        # Try API first
        task = self.api.create_task(name, description)
        
        if task:
            # Success! Cache locally
            self.local_db.cache_task(task)
            return task
        else:
            # Offline - store locally and queue for sync
            task = self.local_db.create_task(name, description)
            self.sync_queue.add('create_task', task)
            return task
    
    def sync(self):
        """Sync local changes to API"""
        if not self.api.is_online():
            return False
            
        # Process sync queue
        for item in self.sync_queue:
            # Sync each item
            pass
```

## Environment Setup for Development

```bash
# Terminal 1: Run backend
cd backend
go run main.go

# Terminal 2: Run desktop app
source .venv/bin/activate
python -m hardmode.main
```

## Deployment Considerations

1. **API URL Configuration**
   - Development: `http://localhost:8080`
   - Production: `https://hardmode-api.yourdomain.com`
   - User configurable in settings

2. **Authentication** (Future)
   - JWT tokens
   - User accounts
   - Multi-device sync

3. **Data Privacy**
   - Option to use local-only mode
   - Encrypted sync
   - Self-hosted backend option

## Resources

- API Client: `hardmode/api_client.py`
- API Documentation: See README.md
- Backend Code: `backend/main.go`
