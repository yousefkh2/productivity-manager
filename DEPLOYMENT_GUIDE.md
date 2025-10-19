# 🚀 Deploying Hardmode Pomo to Digital Ocean

## Overview
Deploy your full-stack Pomodoro app (Go backend + React frontend) to Digital Ocean using your $200 credit.

## Architecture Options

### Option 1: App Platform (Recommended for Beginners)
**Easiest & Most Managed**
- ✅ Automatic deployments from GitHub
- ✅ Free SSL certificates
- ✅ Auto-scaling
- ✅ Built-in monitoring
- ✅ Zero DevOps required
- 💰 Cost: ~$12-20/month for both services

### Option 2: Droplet + Docker (More Control)
**Best for Learning Cloud**
- ✅ Full server control
- ✅ SSH access
- ✅ Docker containerization
- ✅ Learn Linux/DevOps
- 💰 Cost: ~$6-12/month for one droplet

### Option 3: Kubernetes (Overkill but Educational)
- For learning purposes only
- Too complex for this app
- 💰 Cost: ~$40+/month

## 🎯 Recommended: App Platform Deployment

Let's use **Digital Ocean App Platform** - it's perfect for your use case!

---

## Step 1: Prepare Your Repository

### 1.1 Push to GitHub (if not already)
```bash
cd /home/yousef/Desktop/Project/hardmode-pomo

# Initialize git (if needed)
git init
git add .
git commit -m "Initial commit - ready for deployment"

# Create GitHub repo and push
git remote add origin https://github.com/yousefkh2/hardmode-pomo.git
git push -u origin master
```

### 1.2 Create Production Environment Files

**Backend `.env` (for production):**
```env
PORT=8080
DB_PATH=/app/data/hardmode.db
ENV=production
```

**Frontend `.env.production`:**
```env
VITE_API_URL=https://your-backend-url.ondigitalocean.app
```

---

## Step 2: Prepare Backend for Production

### 2.1 Update `backend/main.go` for Production

Add CORS for your frontend domain:
```go
// Add at the top with other imports
import (
    "github.com/rs/cors"
)

// In main() before routes
c := cors.New(cors.Options{
    AllowedOrigins: []string{
        "https://your-frontend-url.ondigitalocean.app",
        "http://localhost:5173", // Keep for local dev
    },
    AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
    AllowedHeaders: []string{"*"},
    AllowCredentials: true,
})

handler := c.Handler(mux)
log.Fatal(http.ListenAndServe(":"+port, handler))
```

### 2.2 Add `backend/Dockerfile` (already exists, verify)
```dockerfile
FROM golang:1.21-alpine

WORKDIR /app

# Install SQLite
RUN apk add --no-cache sqlite-libs sqlite-dev gcc musl-dev

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o hardmode-backend main.go

EXPOSE 8080

CMD ["./hardmode-backend"]
```

### 2.3 Create `backend/.do/app.yaml`
```yaml
name: hardmode-backend
services:
- name: api
  github:
    repo: yousefkh2/hardmode-pomo
    branch: master
    deploy_on_push: true
  source_dir: /backend
  dockerfile_path: backend/Dockerfile
  http_port: 8080
  instance_count: 1
  instance_size_slug: basic-xxs
  routes:
  - path: /
  envs:
  - key: PORT
    value: "8080"
  - key: ENV
    value: "production"
```

---

## Step 3: Prepare Frontend for Production

### 3.1 Update `frontend/vite.config.js`
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
```

### 3.2 Create `frontend/.do/app.yaml`
```yaml
name: hardmode-frontend
static_sites:
- name: web
  github:
    repo: yousefkh2/hardmode-pomo
    branch: master
    deploy_on_push: true
  source_dir: /frontend
  build_command: npm install && npm run build
  output_dir: dist
  routes:
  - path: /
  envs:
  - key: VITE_API_URL
    value: "https://hardmode-backend-xxxxx.ondigitalocean.app"
```

### 3.3 Create API Client for Production

Update `frontend/src/api/client.js`:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = {
  // ... existing methods
  
  healthCheck: async () => {
    const response = await fetch(`${API_URL}/health`);
    return response.json();
  },
};
```

---

## Step 4: Deploy to Digital Ocean

### 4.1 Create Digital Ocean Account
1. Go to https://www.digitalocean.com/
2. Sign up with your $200 credit
3. Verify your email and payment method

### 4.2 Deploy Backend (App Platform)

**Via Web UI:**
1. Go to https://cloud.digitalocean.com/apps
2. Click "Create App"
3. Choose "GitHub" as source
4. Authorize Digital Ocean to access your repo
5. Select `yousefkh2/hardmode-pomo`
6. Configure:
   - **Name**: `hardmode-backend`
   - **Branch**: `master`
   - **Source Directory**: `/backend`
   - **Dockerfile Path**: `backend/Dockerfile`
   - **HTTP Port**: `8080`
   - **Instance Size**: Basic (512MB RAM, $5/mo)
7. Add Environment Variables:
   ```
   PORT=8080
   ENV=production
   ```
8. Click "Next" → "Review" → "Create Resources"

**Via CLI (Alternative):**
```bash
# Install doctl
brew install doctl  # macOS
# or
sudo snap install doctl  # Linux

# Authenticate
doctl auth init

# Create app from spec
cd backend
doctl apps create --spec .do/app.yaml
```

### 4.3 Deploy Frontend (Static Site)

1. Go to https://cloud.digitalocean.com/apps
2. Click "Create App" again
3. Choose same GitHub repo
4. Configure:
   - **Name**: `hardmode-frontend`
   - **Type**: Static Site
   - **Branch**: `master`
   - **Source Directory**: `/frontend`
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variable:
   ```
   VITE_API_URL=https://hardmode-backend-xxxxx.ondigitalocean.app
   ```
   (Use the URL from your backend deployment)
6. Click "Create Resources"

### 4.4 Get Your URLs

After deployment completes (5-10 minutes):
- **Backend**: `https://hardmode-backend-xxxxx.ondigitalocean.app`
- **Frontend**: `https://hardmode-frontend-xxxxx.ondigitalocean.app`

---

## Step 5: Configure Database Persistence

### Option A: Use Managed Database (Recommended)
```bash
# Create PostgreSQL database
doctl databases create hardmode-db --engine pg --region nyc3 --size db-s-1vcpu-1gb

# Get connection info
doctl databases connection hardmode-db
```

Then update backend to use PostgreSQL instead of SQLite.

### Option B: Use Volume for SQLite (Simpler)
In App Platform settings:
1. Add a volume: `/app/data` (1GB)
2. Database will persist across deployments

---

## Step 6: Set Up Custom Domain (Optional)

### 6.1 Add Domain to Digital Ocean
1. Go to Networking → Domains
2. Add your domain (e.g., `hardmode.yourdomain.com`)
3. Point your domain's nameservers to DO:
   - `ns1.digitalocean.com`
   - `ns2.digitalocean.com`
   - `ns3.digitalocean.com`

### 6.2 Configure App Platform Domain
1. Go to your app settings
2. Click "Domains"
3. Add custom domain
4. Digital Ocean handles SSL automatically

---

## Step 7: Set Up GitHub Auto-Deploy

Already configured! Now:
```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push origin master

# Digital Ocean automatically deploys! 🎉
```

---

## Cost Breakdown (with $200 credit)

### App Platform Pricing:
- **Backend (Basic)**: $5/month
- **Frontend (Static)**: $3/month
- **Total**: $8/month = **25 months of free hosting!**

### With Database:
- **Backend**: $5/month
- **Frontend**: $3/month
- **Managed DB**: $15/month
- **Total**: $23/month = **8.5 months free**

---

## Alternative: Single Droplet Deployment (More Learning)

If you want to learn Linux/DevOps:

### Create Droplet
```bash
# Create $6/month droplet
doctl compute droplet create hardmode \
  --region nyc3 \
  --image ubuntu-22-04-x64 \
  --size s-1vcpu-1gb \
  --ssh-keys YOUR_SSH_KEY_ID
```

### Install Docker & Deploy
```bash
# SSH into droplet
ssh root@your-droplet-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Clone your repo
git clone https://github.com/yousefkh2/hardmode-pomo.git
cd hardmode-pomo

# Create docker-compose.yml (see next section)
docker-compose up -d
```

---

## Next Steps After Deployment

1. ✅ Test the deployed app
2. ✅ Set up monitoring (DO has built-in)
3. ✅ Configure backups (DO automatic backups)
4. ✅ Add custom domain
5. ✅ Set up CI/CD (already done with GitHub!)

---

## Troubleshooting

### Backend won't start
```bash
# Check logs
doctl apps logs YOUR_APP_ID --type=run

# Common issues:
# - Wrong PORT env variable
# - SQLite file permissions
# - Missing dependencies
```

### Frontend can't reach backend
```bash
# Check CORS headers
curl -I https://your-backend.ondigitalocean.app/health

# Verify VITE_API_URL is set correctly
# Check browser console for errors
```

### Database not persisting
```bash
# Add volume in App Platform
# Or use Managed Database
```

---

## 🎉 You're Live!

Once deployed, you can:
- ✅ Access from anywhere
- ✅ Use on phone/tablet
- ✅ Share with friends
- ✅ Auto-deploy on git push
- ✅ Free SSL certificate
- ✅ Built-in monitoring

---

## Want to Go Further?

### Learn More:
- [ ] Set up staging environment
- [ ] Add CI/CD testing
- [ ] Implement database backups
- [ ] Set up monitoring alerts
- [ ] Add load balancing
- [ ] Implement Redis caching
- [ ] Set up CDN for assets

---

**Ready to deploy?** Let me know and I can help you create the necessary configuration files! 🚀
