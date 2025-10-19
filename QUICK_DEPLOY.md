# 🚀 Quick Deploy to Digital Ocean - 5 Minutes

## Prerequisites
- ✅ GitHub account with repo
- ✅ Digital Ocean account with $200 credit
- ✅ 5 minutes of time

---

## Option 1: Web UI (Easiest - No CLI Required)

### Step 1: Push to GitHub (1 min)
```bash
cd /home/yousef/Desktop/Project/hardmode-pomo

# Make sure everything is committed
git add .
git commit -m "Ready for deployment"
git push origin master
```

### Step 2: Deploy Backend (2 mins)
1. Go to https://cloud.digitalocean.com/apps
2. Click **"Create App"**
3. Select **GitHub** → Authorize → Select `hardmode-pomo` repo
4. Configure:
   - **Service Name**: `backend`
   - **Branch**: `master`
   - **Source Directory**: `/backend`
   - **Auto-deploy**: ✅ Yes
   - **Build Command**: (leave empty, uses Dockerfile)
   - **Run Command**: `./hardmode-backend`
   - **HTTP Port**: `8080`
   - **Instance Size**: Basic ($5/mo)
5. Add Environment Variable:
   ```
   PORT = 8080
   ```
6. Click **"Create Resources"**
7. **Copy the backend URL** (e.g., `https://backend-xxxxx.ondigitalocean.app`)

### Step 3: Deploy Frontend (2 mins)
1. Click **"Create App"** again
2. Select same GitHub repo
3. Configure:
   - **Service Type**: **Static Site**
   - **Service Name**: `frontend`
   - **Branch**: `master`
   - **Source Directory**: `/frontend`
   - **Build Command**: `npm ci && npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   ```
   VITE_API_URL = <YOUR_BACKEND_URL_FROM_STEP_2>
   ```
   Example: `https://backend-xxxxx.ondigitalocean.app`
5. Click **"Create Resources"**

### Step 4: Done! 🎉
- Frontend: `https://frontend-xxxxx.ondigitalocean.app`
- Backend: `https://backend-xxxxx.ondigitalocean.app`
- Cost: $8/month = **25 months free with credit!**

---

## Option 2: CLI (For Developers)

### Step 1: Install doctl
```bash
# macOS
brew install doctl

# Linux
sudo snap install doctl

# Windows
scoop install doctl
```

### Step 2: Authenticate
```bash
# Initialize doctl
doctl auth init

# Paste your Digital Ocean API token
# Get it from: https://cloud.digitalocean.com/account/api/tokens
```

### Step 3: Deploy
```bash
cd /home/yousef/Desktop/Project/hardmode-pomo

# Run deploy script
./deploy.sh
```

### Step 4: Monitor
```bash
# List apps
doctl apps list

# Get app ID, then view logs
doctl apps logs YOUR_APP_ID --type=build
doctl apps logs YOUR_APP_ID --type=run
```

---

## What Happens After Deploy?

### Automatic Features (Free!)
- ✅ **Auto-deploy on git push** - Just push to master, it deploys!
- ✅ **Free SSL certificate** - Automatic HTTPS
- ✅ **Auto-scaling** - Handles traffic spikes
- ✅ **Built-in monitoring** - See metrics in dashboard
- ✅ **Automatic backups** - Your data is safe
- ✅ **CDN** - Fast global delivery

### Your Workflow Now:
```bash
# Make changes
vim frontend/src/App.jsx

# Commit and push
git add .
git commit -m "Add new feature"
git push origin master

# Digital Ocean automatically deploys! 🚀
# Check status in dashboard
```

---

## Testing Your Deployed App

### 1. Test Backend
```bash
curl https://backend-xxxxx.ondigitalocean.app/health
# Should return: {"status":"ok"}
```

### 2. Test Frontend
Open browser: `https://frontend-xxxxx.ondigitalocean.app`
- Should load the app
- Should connect to backend
- Should show "Synced" (green cloud icon)

### 3. Test from Phone
- Open same URL on your phone
- Works from anywhere! 📱

---

## Troubleshooting

### Backend won't start?
```bash
# Check logs
doctl apps logs YOUR_APP_ID --type=run

# Common fixes:
# - Make sure PORT=8080 in environment variables
# - Check Dockerfile exists in /backend
# - Verify go.mod is committed
```

### Frontend can't reach backend?
```bash
# Check VITE_API_URL environment variable
# Should match your backend URL exactly

# Rebuild frontend
doctl apps create-deployment YOUR_APP_ID
```

### Database not persisting?
```bash
# Option 1: Add volume in App Platform settings
# Go to app → Settings → Add volume at /app/data

# Option 2: Use managed database (better for production)
doctl databases create hardmode-db --engine pg --region nyc3
```

---

## Cost Calculator

### Basic Setup ($8/month)
- Backend (Basic): $5/month
- Frontend (Static): $3/month
- **Total**: $8/month
- **With $200 credit**: **25 months free!**

### With Database ($23/month)
- Backend: $5/month
- Frontend: $3/month
- PostgreSQL DB: $15/month
- **Total**: $23/month
- **With $200 credit**: **8.7 months free**

### Scale Up Later:
- Professional backend: $12/month (1GB RAM)
- Pro frontend: $5/month (CDN + more)
- Larger database: $30+/month

---

## Next Steps

### 1. Add Custom Domain (Optional)
```bash
# Add domain in DO dashboard
# Then in app settings → Domains → Add custom domain

# Point DNS:
example.com → frontend app
api.example.com → backend app

# SSL is automatic! ✅
```

### 2. Set Up Staging Environment
```bash
# Create staging branch
git checkout -b staging

# Deploy staging app (copy of production)
doctl apps create --spec .do/app.yaml
# (change name to "hardmode-pomo-staging")
```

### 3. Monitor Your App
- Dashboard: https://cloud.digitalocean.com/apps
- Metrics: CPU, RAM, bandwidth
- Logs: Real-time application logs
- Alerts: Set up email notifications

---

## Learning Resources

### Digital Ocean Docs:
- App Platform: https://docs.digitalocean.com/products/app-platform/
- Tutorials: https://www.digitalocean.com/community/tutorials
- CLI Reference: https://docs.digitalocean.com/reference/doctl/

### What You'll Learn:
- ✅ Cloud deployment
- ✅ CI/CD pipelines
- ✅ Environment management
- ✅ Container orchestration
- ✅ Monitoring & logging
- ✅ DNS & SSL
- ✅ Production best practices

---

## 🎉 You're Ready!

Your app will be:
- ✅ Live on the internet
- ✅ Accessible from anywhere
- ✅ Auto-deploying from GitHub
- ✅ Running for 25+ months free
- ✅ Production-ready with SSL

**Start with Option 1 (Web UI) if this is your first deployment!**

Good luck! 🚀
