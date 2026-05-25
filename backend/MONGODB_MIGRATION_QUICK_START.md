# MongoDB Atlas Migration - Quick Start

This is a condensed version of the migration process. For detailed instructions, see `MONGODB_ATLAS_MIGRATION_GUIDE.md`.

---

## 🚀 Quick Steps (5 Minutes)

### 1. Create New MongoDB Atlas Cluster
1. Go to: https://cloud.mongodb.com/
2. Click **"Build a Database"** → Choose **M0 FREE**
3. Select region → Click **"Create Cluster"**
4. Wait 3-5 minutes

### 2. Configure Access
1. **Network Access**: Click **"Network Access"** → **"Add IP Address"** → **"Allow Access from Anywhere"** → `0.0.0.0/0`
2. **Database User**: Click **"Database Access"** → **"Add New Database User"** → Set username/password → **"Add User"**
   - ⚠️ **SAVE CREDENTIALS!**

### 3. Get Connection String
1. Click **"Database"** → **"Connect"** → **"Connect your application"**
2. Copy connection string
3. Replace: `<username>` → your username, `<password>` → your password
4. Add database name: `mongodb+srv://user:pass@cluster.mongodb.net/YOUR_DB_NAME?retryWrites=true&w=majority`

### 4. Update Environment Variables

**Local (.env file):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority
```

**Vercel (if deploying):**
1. Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables
2. Update `MONGODB_URI` with new connection string
3. Redeploy

### 5. Test Connection
```powershell
node test-new-mongodb-connection.js
```

---

## ✅ Success Indicators

- ✅ Test script shows: "Connection successful!"
- ✅ Server starts without errors
- ✅ Health endpoint returns: `{ "status": "OK", "database": "MongoDB Connected" }`

---

## 🔗 Important Links

- **MongoDB Atlas**: https://cloud.mongodb.com/
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Full Guide**: See `MONGODB_ATLAS_MIGRATION_GUIDE.md`
- **Checklist**: See `MONGODB_MIGRATION_CHECKLIST.md`

---

## ⚠️ Common Issues

| Issue | Quick Fix |
|-------|-----------|
| Authentication failed | Check username/password, URL-encode special characters |
| Connection timeout | Add `0.0.0.0/0` to Network Access |
| Database not found | MongoDB creates it automatically on first write |
| Invalid format | Use: `mongodb+srv://user:pass@cluster.mongodb.net/db?retryWrites=true&w=majority` |

---

**Need more help?** See the full guide: `MONGODB_ATLAS_MIGRATION_GUIDE.md`




