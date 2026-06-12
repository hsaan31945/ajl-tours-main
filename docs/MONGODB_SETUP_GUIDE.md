# MongoDB Atlas Setup Guide

## How to Update to a New MongoDB Atlas Database

### Step 1: Get Your MongoDB Atlas Connection String

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Log in to your account
3. Create a new cluster (or use an existing one)
4. Click "Connect" on your cluster
5. Choose "Connect your application"
6. Copy the connection string (it looks like: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`)
7. Replace `<password>` with your actual database password
8. Replace `<database>` with your database name (e.g., `ajltours`)

### Step 2: Update Vercel Environment Variables

Since your backend is deployed on Vercel, you need to update the environment variable there:

#### Option A: Using Vercel Dashboard (Easiest)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `ajl-tours-backend`
3. Go to **Settings** → **Environment Variables**
4. Find `MONGODB_URI` (or create it if it doesn't exist)
5. Update the value with your new connection string
6. Make sure it's set for **Production**, **Preview**, and **Development** environments
7. Click **Save**

#### Option B: Using Vercel CLI

Run this command in your terminal:

```bash
vercel env add MONGODB_URI production
```

Then paste your connection string when prompted.

### Step 3: Redeploy Your Backend

After updating the environment variable, you need to redeploy:

```bash
cd c:\Users\Salman\Desktop\Backend\backend
vercel --prod --yes
```

Or trigger a new deployment from the Vercel dashboard.

### Step 4: (Optional) Update Local .env File

If you want to run locally, create/update `.env` file in the backend folder:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

**Important:** Never commit `.env` file to git! It should be in `.gitignore`.

### Step 5: Test the Connection

After deployment, test if the connection works:

1. Visit: `https://ajl-tours-backend.vercel.app/api/health`
2. You should see `"database": "MongoDB Connected"` in the response

### Example Connection String Format

```
mongodb+srv://myusername:mypassword@cluster0.xxxxx.mongodb.net/ajltours?retryWrites=true&w=majority
```

Replace:
- `myusername` - Your MongoDB Atlas username
- `mypassword` - Your MongoDB Atlas password
- `cluster0.xxxxx.mongodb.net` - Your cluster address
- `ajltours` - Your database name (you can choose any name)

### Security Notes

⚠️ **Important Security Tips:**

1. **Never share your connection string publicly**
2. **Use strong passwords** for your MongoDB Atlas user
3. **Whitelist IP addresses** in MongoDB Atlas (or use 0.0.0.0/0 for Vercel)
4. **Use environment variables** - never hardcode connection strings in code
5. **Rotate passwords** regularly

### Need Help?

If you have issues:
1. Check MongoDB Atlas → Network Access → Add IP Address (0.0.0.0/0 for Vercel)
2. Check MongoDB Atlas → Database Access → Ensure user has read/write permissions
3. Check Vercel logs for connection errors

