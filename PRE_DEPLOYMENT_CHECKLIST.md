# 📋 Pre-Deployment Checklist

Before deploying to Digital Ocean, make sure:

## ✅ Code Ready

### Backend
- [ ] `backend/Dockerfile` exists
- [ ] `backend/main.go` compiles without errors
- [ ] `backend/go.mod` and `backend/go.sum` committed
- [ ] Database migrations work
- [ ] Health check endpoint exists (`/health`)

### Frontend
- [ ] `frontend/package.json` has correct build script
- [ ] `frontend/vite.config.js` configured
- [ ] `frontend/nginx.conf` exists
- [ ] `frontend/Dockerfile` exists
- [ ] App builds successfully: `cd frontend && npm run build`

### Repository
- [ ] All changes committed
- [ ] Pushed to GitHub
- [ ] No sensitive data in code (API keys, passwords)
- [ ] `.gitignore` excludes `node_modules`, `dist`, `.env`

## ✅ Digital Ocean Account

- [ ] Account created at https://cloud.digitalocean.com
- [ ] $200 credit activated
- [ ] Email verified
- [ ] Payment method added (required even with credit)

## ✅ GitHub Integration

- [ ] Repository is public OR Digital Ocean has access to private repos
- [ ] GitHub connected to Digital Ocean account
- [ ] Repository URL: `yousefkh2/hardmode-pomo` (or your username)

## ✅ Configuration Files

- [ ] `.do/app.yaml` exists in project root
- [ ] `docker-compose.production.yml` exists (for droplet deployment)
- [ ] `frontend/.env.example` exists
- [ ] `backend/Dockerfile` exists
- [ ] `frontend/Dockerfile` exists
- [ ] `frontend/nginx.conf` exists

## ✅ Testing Locally

### Backend
```bash
cd backend
go run main.go

# Test health check
curl http://localhost:8080/health
# Should return: {"status":"ok"}
```

### Frontend
```bash
cd frontend
npm run build
npm run preview

# Visit http://localhost:4173
# Should load app and connect to backend
```

### Integration
```bash
# Start both services
cd /home/yousef/Desktop/Project/hardmode-pomo
./start-web.sh

# Test full flow:
# 1. Open http://localhost:5173
# 2. Create a task
# 3. Start timer
# 4. Complete pomodoro
# 5. Check data persists after refresh
```

## ✅ Environment Variables

### Backend (.do/app.yaml)
```yaml
envs:
  - key: PORT
    value: "8080"
  - key: ENV
    value: "production"
```

### Frontend (.do/app.yaml)
```yaml
envs:
  - key: VITE_API_URL
    value: "https://backend-xxxxx.ondigitalocean.app"  # Update after backend deployed!
```

## ✅ Security

- [ ] No hardcoded passwords
- [ ] No API keys in code
- [ ] `.env` files in `.gitignore`
- [ ] CORS configured for production domain
- [ ] SQL injection protection (using prepared statements)
- [ ] Input validation on backend

## ✅ Database

Choose one:
- [ ] **Option A**: SQLite with persistent volume
- [ ] **Option B**: Managed PostgreSQL database ($15/mo extra)

For SQLite:
- [ ] Volume path configured: `/app/data`
- [ ] Database file path: `/app/data/hardmode.db`

## ✅ Cost Understanding

Before deploying, you understand:
- [ ] Basic setup costs $8/month
- [ ] $200 credit = 25 months free
- [ ] Can upgrade/downgrade anytime
- [ ] Can delete app to stop charges
- [ ] Unused credit expires after 60 days

## ✅ Deployment Method Chosen

Pick one:

### Option 1: App Platform (Recommended)
- [ ] Easiest to set up
- [ ] Auto-deploy from GitHub
- [ ] Managed infrastructure
- [ ] $8/month
- **→ Use Web UI or CLI**

### Option 2: Droplet + Docker
- [ ] More control
- [ ] Learn Linux/DevOps
- [ ] Manual setup required
- [ ] $6/month
- **→ Use SSH + Docker**

## ✅ Ready to Deploy!

All boxes checked? Great! Choose your deployment method:

### Web UI (Easiest):
1. Open `QUICK_DEPLOY.md`
2. Follow "Option 1: Web UI"
3. Deploy in 5 minutes!

### CLI (Advanced):
```bash
# Install doctl
brew install doctl  # or snap install doctl

# Authenticate
doctl auth init

# Deploy
./deploy.sh
```

---

## 🚨 Common Issues

### "Build failed"
- Check `package.json` has `"build": "vite build"`
- Make sure all dependencies in `package.json`
- Run `npm run build` locally first

### "Cannot connect to backend"
- Check `VITE_API_URL` is set correctly
- Verify backend URL is correct
- Check browser console for CORS errors

### "Database not persisting"
- Add volume in App Platform settings
- Path: `/app/data`
- Size: 1GB minimum

### "Port already in use"
- Make sure `PORT` env variable is `8080`
- Check backend listens on correct port

---

## 📞 Need Help?

- **DO Community**: https://www.digitalocean.com/community
- **DO Docs**: https://docs.digitalocean.com
- **DO Support**: Free ticket support with account
- **GitHub Issues**: Create issue in your repo

---

## ✨ Post-Deployment

After successful deployment:
- [ ] Test both URLs (backend & frontend)
- [ ] Test from different device (phone)
- [ ] Set up monitoring alerts
- [ ] Add custom domain (optional)
- [ ] Share with friends! 🎉

**You're ready to deploy! Good luck! 🚀**
