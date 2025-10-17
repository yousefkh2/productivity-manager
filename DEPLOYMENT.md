# Cloud Deployment Guide

This guide walks you through deploying the Hardmode Pomodoro backend to various cloud platforms.

## Why Cloud?

Deploying to the cloud gives you:
- ☁️ **Access anywhere** - Use your app from any computer
- 🔄 **Cross-device sync** - Seamlessly work across multiple machines
- 📦 **Containerization experience** - Learn Docker in practice
- 🚀 **DevOps skills** - CI/CD, monitoring, scaling
- 💰 **Free tier options** - Most platforms offer free hosting

## Platform Comparison

| Platform | Free Tier | Pros | Cons |
|----------|-----------|------|------|
| **Render** | ✅ 750 hours/month | Easy setup, auto-deploy from Git | Spins down after inactivity |
| **Railway** | ✅ $5 credit/month | Great DX, simple CLI | Credit-based limit |
| **Fly.io** | ✅ 3 small VMs | Global edge network, fast | Slightly complex CLI |
| **Heroku** | ⚠️ Paid only | Mature platform | No longer free |
| **AWS** | ⚠️ Complex | Powerful, professional | Steep learning curve |

## Option 1: Deploy to Render (Easiest)

### Prerequisites
- GitHub account
- Render account (free)

### Steps

1. **Push your code to GitHub**
   ```bash
   cd /home/yousef/Desktop/Project/hardmode-pomo
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Create new Web Service on Render**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: hardmode-pomo-api
     - **Environment**: Docker
     - **Region**: Choose closest to you
     - **Branch**: main
     - **Dockerfile Path**: backend/Dockerfile

3. **Add Environment Variables**
   ```
   PORT=8080
   DB_PATH=/data/hardmode.db
   ```

4. **Add Persistent Disk** (for database)
   - Click "Add Disk"
   - **Name**: hardmode-data
   - **Mount Path**: /data
   - **Size**: 1GB (free tier)

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Note your URL: `https://hardmode-pomo-api.onrender.com`

6. **Test**
   ```bash
   curl https://hardmode-pomo-api.onrender.com/health
   ```

## Option 2: Deploy to Railway

### Prerequisites
- Railway account
- Railway CLI

### Steps

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   # or
   curl -fsSL https://railway.app/install.sh | sh
   ```

2. **Login and initialize**
   ```bash
   cd /home/yousef/Desktop/Project/hardmode-pomo
   railway login
   railway init
   ```

3. **Deploy**
   ```bash
   railway up
   ```

4. **Add environment variables**
   ```bash
   railway variables set DB_PATH=/data/hardmode.db
   ```

5. **Get URL**
   ```bash
   railway domain
   ```

## Option 3: Deploy to Fly.io

### Prerequisites
- Fly.io account
- flyctl CLI

### Steps

1. **Install flyctl**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login**
   ```bash
   flyctl auth login
   ```

3. **Create fly.toml**
   ```toml
   # fly.toml
   app = "hardmode-pomo"
   
   [build]
     dockerfile = "backend/Dockerfile"
   
   [env]
     PORT = "8080"
     DB_PATH = "/data/hardmode.db"
   
   [[services]]
     internal_port = 8080
     protocol = "tcp"
   
     [[services.ports]]
       port = 80
       handlers = ["http"]
   
     [[services.ports]]
       port = 443
       handlers = ["tls", "http"]
   
   [mounts]
     source = "hardmode_data"
     destination = "/data"
   ```

4. **Launch**
   ```bash
   flyctl launch
   flyctl volumes create hardmode_data --size 1
   flyctl deploy
   ```

5. **Get URL**
   ```bash
   flyctl info
   ```

## Option 4: Docker Compose (Self-Hosted)

If you have a server (DigitalOcean, Linode, AWS EC2, etc.):

1. **Install Docker and Docker Compose** on your server

2. **Update docker-compose.yml** for production:
   ```yaml
   version: '3.8'
   
   services:
     backend:
       build: ./backend
       ports:
         - "80:8080"  # Expose on port 80
       environment:
         - PORT=8080
         - DB_PATH=/data/hardmode.db
       volumes:
         - ./data:/data
       restart: always
   ```

3. **Deploy**
   ```bash
   # On your server
   git clone <your-repo>
   cd hardmode-pomo
   docker-compose up -d
   ```

4. **Set up reverse proxy** (nginx/Caddy) for HTTPS

## After Deployment

### 1. Update Desktop App

Set the API URL:
```bash
export API_URL=https://your-app-url.com
python -m hardmode.main
```

Or add to your app's config:
```python
# hardmode/config.py
API_URL = os.getenv('API_URL', 'https://your-app-url.com')
```

### 2. Test the Connection

```bash
curl https://your-app-url.com/health
curl https://your-app-url.com/api/tasks
```

### 3. Add HTTPS (if needed)

Most platforms provide HTTPS automatically. For self-hosted:
- Use Caddy (automatic HTTPS)
- Use Let's Encrypt with certbot
- Configure nginx with SSL

## Monitoring & Maintenance

### View Logs

**Render:**
- Dashboard → Your Service → Logs

**Railway:**
```bash
railway logs
```

**Fly.io:**
```bash
flyctl logs
```

### Check Status

**All platforms** provide a dashboard with:
- Uptime
- Request metrics
- Error rates
- Resource usage

### Database Backups

For production, implement backups:

1. **Export data periodically**
   ```bash
   sqlite3 /data/hardmode.db .dump > backup.sql
   ```

2. **Store in cloud storage** (S3, Backblaze B2)

3. **Automate with cron** or platform scheduling

## Cost Optimization

### Free Tier Limits

**Render:**
- 750 hours/month per service
- Spins down after 15 min inactivity
- Restarts on request (cold start ~30s)

**Railway:**
- $5 free credit/month
- ~500 hours of small instance

**Fly.io:**
- 3 small VMs free
- 160GB bandwidth/month

### Tips

1. **Use sleep mode** - Most free tiers spin down when idle
2. **Optimize Docker image** - Smaller images = faster deploys
3. **Cache dependencies** - Speed up builds
4. **Monitor usage** - Stay within limits

## Troubleshooting

### "Connection refused"
- Check if service is running
- Verify port configuration
- Check firewall rules

### "Database locked"
- Ensure only one process accesses SQLite
- Consider PostgreSQL for high concurrency

### "Out of memory"
- Optimize Go memory usage
- Use smaller Docker base image
- Upgrade to paid tier if needed

### "Slow cold starts"
- Normal for free tier
- Keep app warm with periodic pings
- Or upgrade to paid tier (no sleep)

## Learning Resources

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Go Deployment](https://go.dev/doc/tutorial/web-service-gin)
- [Platform Documentation]:
  - [Render Docs](https://render.com/docs)
  - [Railway Docs](https://docs.railway.app)
  - [Fly.io Docs](https://fly.io/docs)

## Next Steps

After deployment:

1. ✅ **Test thoroughly** - Verify all endpoints work
2. 🔐 **Add authentication** - Secure your API
3. 📊 **Set up monitoring** - Track errors and performance
4. 🔄 **Implement CI/CD** - Auto-deploy on git push
5. 📝 **Document API** - Create API documentation
6. 🎨 **Build dashboard** - Web UI for management

## Congratulations! 🎉

You now have:
- A production Go backend in the cloud
- Containerized application
- RESTful API accessible anywhere
- Real-world cloud deployment experience

This is excellent for your cloud learning journey!
