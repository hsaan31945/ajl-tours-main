# Complete Setup Instructions - Database Bootstrap

## 🎯 Current Status

✅ **Bootstrap Endpoint Created** - Ready to create all collections  
⚠️ **MONGODB_URI Needs Fix** - Missing database name  
❌ **Database Connection Failing** - Can't create collections until URI is fixed

---

## 🔧 Step 1: Fix MONGODB_URI (REQUIRED FIRST!)

### Current Value (WRONG):
```
mongodb+srv://salman:salman1122@cluster0.tatwtcz.mongodb.net/?appName=Cluster0
```

### What's Wrong:
- ❌ Missing database name (should be `/database_name` before `?`)
- ❌ Missing connection options

### How to Fix:

1. **Find Your Database Name:**
   - Go to: https://cloud.mongodb.com/
   - Click **Browse Collections**
   - Look at the top - you'll see the database name (e.g., `ajltours`, `tripgo`, or create a new one)

2. **Update in Vercel:**
   - Go to: https://vercel.com/salman1122334411s-projects/ajl-tours-backend/settings/environment-variables
   - Click on `MONGODB_URI`
   - Click **Edit**
   - Change to:
     ```
     mongodb+srv://salman:salman1122@cluster0.tatwtcz.mongodb.net/YOUR_DATABASE_NAME?retryWrites=true&w=majority
     ```
     (Replace `YOUR_DATABASE_NAME` with the actual name from step 1)
   - Click **Save**

3. **Check Network Access:**
   - Go to MongoDB Atlas → **Network Access**
   - Ensure `0.0.0.0/0` is allowed (or add it)

4. **Redeploy:**
   ```bash
   cd "C:\Users\Salman\Desktop\Backend - Copy\backend"
   vercel --prod --yes
   ```

---

## 🚀 Step 2: Run Bootstrap (After Fixing URI)

### Bootstrap Endpoint:
**URL:** https://ajl-tours-backend.vercel.app/api/tours?bootstrap=true

**Method:** GET

**Headers:**
```
X-Admin-Passcode: <ADMIN_PASSCODE>
```

### Quick Test (PowerShell):
```powershell
$headers = @{"X-Admin-Passcode" = "<ADMIN_PASSCODE>"}
Invoke-WebRequest -Uri "https://ajl-tours-backend.vercel.app/api/tours?bootstrap=true" -Method GET -Headers $headers
```

### What It Creates:
1. ✅ **Switzerland Division** - Required for tours
2. ✅ **Admin User** - admin@ajltours.com / configured admin password
3. ✅ **Homepage Content Settings** - Checkout settings
4. ✅ **All Collections** - Creates all 11 required collections

---

## 📋 Collections That Will Be Created

1. **divisions** - Contains Switzerland division
2. **admins** - Contains admin user
3. **homepagecontents** - Contains settings
4. **tours** - Empty (ready for tours)
5. **bookings** - Empty (ready for bookings)
6. **users** - Empty (ready for users)
7. **trips** - Empty (ready for trips)
8. **tourhighlights** - Empty (for tour highlights)
9. **tourincludeds** - Empty (for included items)
10. **tourexcludeds** - Empty (for excluded items)
11. **touritineraries** - Empty (for itineraries)

---

## ✅ Success Response

After running bootstrap, you should see:

```json
{
  "success": true,
  "message": "Database bootstrap completed successfully",
  "created": [
    {"type": "Division", "name": "Switzerland", "id": "..."},
    {"type": "Admin", "email": "admin@ajltours.com", "id": "..."},
    {"type": "HomepageContent", "section": "checkout_settings"}
  ],
  "counts": {
    "divisions": 1,
    "admins": 1,
    "tours": 0,
    "homepageContent": 1
  },
  "summary": {
    "itemsCreated": 3,
    "errors": 0
  }
}
```

---

## 🔄 Complete Workflow

### 1. Fix MONGODB_URI
- Add database name to connection string
- Update in Vercel
- Redeploy

### 2. Run Bootstrap
- Call `/api/tours?bootstrap=true`
- Creates all collections and initial data

### 3. Test Connection
- Call `/api/tours?test=db-insert`
- Should work now!

### 4. Create Tours
- Use admin panel to create tours
- Or use migration endpoint

---

## 🎯 Quick Reference

### Current MONGODB_URI:
```
mongodb+srv://salman:salman1122@cluster0.tatwtcz.mongodb.net/?appName=Cluster0
```

### Should Be:
```
mongodb+srv://salman:salman1122@cluster0.tatwtcz.mongodb.net/DATABASE_NAME?retryWrites=true&w=majority
```

### Bootstrap URL:
```
https://ajl-tours-backend.vercel.app/api/tours?bootstrap=true
```

### Test URL:
```
https://ajl-tours-backend.vercel.app/api/tours?test=db-insert
```

---

## ⚠️ Important Notes

1. **Database Name:** You need to know or create a database name in MongoDB Atlas
2. **Network Access:** Must allow `0.0.0.0/0` for Vercel to connect
3. **Redeploy:** After updating MONGODB_URI, redeploy is required
4. **Bootstrap First:** Run bootstrap before creating tours

---

*Setup guide created: 2024*  
*Next step: Fix MONGODB_URI, then run bootstrap*






