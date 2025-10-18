# 🍅 Hardmode Pomo - Web App

A beautiful, focused Pomodoro timer with cloud sync. Beat distractions. Track every second.

## 🚀 Quick Start

### Option 1: Use the startup script (Recommended)
```bash
./start-web.sh
```

Then open your browser to **http://localhost:5173**

### Option 2: Manual startup

**Terminal 1 - Backend:**
```bash
cd backend
go run main.go
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Then open **http://localhost:5173** in your browser.

## 🛑 Stopping the App

```bash
# Stop backend
pkill -f 'go run main.go'

# Stop frontend
pkill -f 'vite'

# Or stop both
pkill -f 'go run main.go' && pkill -f 'vite'
```

## 📦 What's Running

- **Frontend (React + Tailwind):** http://localhost:5173
- **Backend (Go REST API):** http://localhost:8080
- **Database:** SQLite (`backend/hardmode.db`)

## ✨ Features

- 🎯 **Focus Timer** - 25-minute Pomodoro sessions
- ✅ **Task Management** - Track daily tasks and progress
- 🌅 **Daily Intent** - Start your day with purpose
- 🌙 **End Day Reflection** - Review and learn
- ☁️ **Cloud Sync** - Access from anywhere
- 📊 **Analytics** - Track your productivity over time
- 🎨 **Beautiful UI** - Dark theme, smooth animations

## 🔧 Development

### Frontend (React)
```bash
cd frontend
npm run dev       # Start dev server
npm run build     # Build for production
npm run preview   # Preview production build
```

### Backend (Go)
```bash
cd backend
go run main.go    # Run server
go build          # Build binary
```

## 📝 Logs

Logs are saved in the `logs/` directory:
- `logs/backend.log` - Go server logs
- `logs/frontend.log` - Vite dev server logs

## 🌐 Accessing from Other Devices

The web app can be accessed from:
- Your laptop: http://localhost:5173
- Work computer (same network): http://YOUR_IP:5173
- Anywhere (after deployment): Deploy to Vercel/Netlify

## 📚 Documentation

- `/docs/QUICKSTART.md` - Desktop app guide
- `/docs/CLOUD_SYNC.md` - Sync setup
- `/docs/API.md` - Backend API reference

## 🎨 Tech Stack

**Frontend:**
- React 18
- Tailwind CSS v3
- Framer Motion (animations)
- Lucide React (icons)
- Recharts (analytics)
- Vite (build tool)

**Backend:**
- Go 1.20
- Chi router
- SQLite database
- CORS enabled

## 💡 Pro Tips

1. **Keyboard shortcuts** - Coming soon!
2. **Browser notifications** - Grant permission when prompted
3. **Multi-device** - Open the same URL on multiple devices
4. **Offline mode** - Frontend works offline, syncs when reconnected

---

Every second matters. Make them count. ⏰
