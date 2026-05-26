# Database Bootstrap Guide - Create All Collections

## ✅ Bootstrap Endpoint Created

I've created an API endpoint that will create all required MongoDB collections and initial data for your application.

---

## 🔗 Bootstrap Endpoint

**URL:** https://ajl-tours-backend.vercel.app/api/tours?bootstrap=true

**Method:** GET (with query parameter)

**Headers Required:**
```
X-Admin-Passcode: <ADMIN_PASSCODE>
```

---

## 📋 What It Creates

### 1. **Switzerland Division**
- Name: "Switzerland"
- Description: Tours in Switzerland
- Required for all tours

### 2. **Admin User**
- Email: `admin@ajltours.com`
- Password: configured admin password
- Role: `admin`

### 3. **Homepage Content Settings**
- Section: `checkout_settings`
- Default min/max ticket settings

### 4. **All Collections Verified**
The endpoint verifies these collections exist:
- ✅ `users`
- ✅ `admins`
- ✅ `divisions`
- ✅ `tours`
- ✅ `bookings`
- ✅ `trips`
- ✅ `homepagecontents`
- ✅ `tourhighlights`
- ✅ `tourincludeds`
- ✅ `tourexcludeds`
- ✅ `touritineraries`

*Note: MongoDB creates collections automatically when you insert the first document, so the endpoint creates initial data to ensure collections exist.*

---

## 🚀 How to Use

### Option 1: Using Browser (Easiest)

Just visit: https://ajl-tours-backend.vercel.app/api/tours?bootstrap=true

**Note:** You'll need to add the admin passcode header. Use a browser extension like "ModHeader" or use the PowerShell method below.

### Option 2: Using PowerShell

```powershell
$headers = @{
    "X-Admin-Passcode" = "<ADMIN_PASSCODE>"
}

Invoke-WebRequest -Uri "https://ajl-tours-backend.vercel.app/api/tours?bootstrap=true" -Method GET -Headers $headers
```

### Option 3: Using curl

```bash
curl -X GET "https://ajl-tours-backend.vercel.app/api/tours?bootstrap=true" \
  -H "X-Admin-Passcode: <ADMIN_PASSCODE>"
```

### Option 3: Using Browser (with extension)

Use a REST client extension like "REST Client" or "Postman" to make a POST request.

### Option 4: From Frontend Admin Panel

You can add a button in the admin dashboard that calls this endpoint.

---

## ✅ Expected Success Response

```json
{
  "success": true,
  "message": "Database bootstrap completed successfully",
  "timestamp": "2024-01-XX...",
  "database": "your-database-name",
  "collections": {
    "found": ["users", "admins", "divisions", "tours", ...],
    "count": 11,
    "expected": ["users", "admins", "divisions", ...],
    "missing": []
  },
  "created": [
    {
      "type": "Division",
      "name": "Switzerland",
      "id": "..."
    },
    {
      "type": "Admin",
      "email": "admin@ajltours.com",
      "id": "..."
    },
    {
      "type": "HomepageContent",
      "section": "checkout_settings"
    }
  ],
  "counts": {
    "users": 0,
    "admins": 1,
    "divisions": 1,
    "tours": 0,
    "bookings": 0,
    "trips": 0,
    "homepageContent": 1
  },
  "summary": {
    "itemsCreated": 3,
    "errors": 0,
    "collectionsFound": 11,
    "collectionsMissing": 0
  }
}
```

---

## ⚠️ Important: Fix MONGODB_URI First!

**Before running bootstrap, make sure your MONGODB_URI includes the database name!**

### Current (WRONG):
```
mongodb+srv://salman:salman1122@cluster0.tatwtcz.mongodb.net/?appName=Cluster0
```

### Should be (CORRECT):
```
mongodb+srv://salman:salman1122@cluster0.tatwtcz.mongodb.net/ajltours?retryWrites=true&w=majority
```

**Steps:**
1. Find your database name in MongoDB Atlas (Browse Collections)
2. Update MONGODB_URI in Vercel with the database name
3. Then run the bootstrap endpoint

---

## 🔧 Step-by-Step Instructions

### Step 1: Fix MONGODB_URI

1. Go to MongoDB Atlas: https://cloud.mongodb.com/
2. Click **Browse Collections**
3. Note the database name (e.g., `ajltours`, `tripgo`)
4. Go to Vercel: https://vercel.com/salman1122334411s-projects/ajl-tours-backend/settings/environment-variables
5. Edit `MONGODB_URI`
6. Change to: `mongodb+srv://salman:salman1122@cluster0.tatwtcz.mongodb.net/YOUR_DB_NAME?retryWrites=true&w=majority`
7. Save

### Step 2: Check Network Access

1. Go to MongoDB Atlas
2. Click **Network Access**
3. Ensure `0.0.0.0/0` is allowed (or add it)

### Step 3: Run Bootstrap

**Quick Method (PowerShell):**
```powershell
$headers = @{"X-Admin-Passcode" = "<ADMIN_PASSCODE>"}
Invoke-WebRequest -Uri "https://ajl-tours-backend.vercel.app/api/tours?bootstrap=true" -Method GET -Headers $headers
```

Or visit in browser (with header extension): https://ajl-tours-backend.vercel.app/api/tours?bootstrap=true

### Step 4: Verify

After bootstrap, check:
- Visit: https://ajl-tours-backend.vercel.app/api/tours?test=db-insert
- Should create test data successfully

---

## 📊 What Gets Created

### Collections Created:
1. **divisions** - Contains Switzerland division
2. **admins** - Contains admin user
3. **homepagecontents** - Contains checkout settings
4. **tours** - Empty (ready for tours)
5. **bookings** - Empty (ready for bookings)
6. **users** - Empty (ready for users)
7. **trips** - Empty (ready for trips)
8. **tourhighlights** - Empty (ready for tour highlights)
9. **tourincludeds** - Empty (ready for included items)
10. **tourexcludeds** - Empty (ready for excluded items)
11. **touritineraries** - Empty (ready for itineraries)

### Initial Data:
- ✅ 1 Division (Switzerland)
- ✅ 1 Admin user (admin@ajltours.com / configured admin password)
- ✅ 1 Homepage content setting

---

## 🔄 After Bootstrap

Once bootstrap is complete:

1. **Test Database Connection:**
   - Visit: https://ajl-tours-backend.vercel.app/api/tours?test=db-insert
   - Should work now!

2. **Create Tours:**
   - Use the admin panel to create tours
   - Or use the migration endpoint to import hardcoded tours

3. **Verify Collections:**
   - Check MongoDB Atlas → Browse Collections
   - You should see all collections listed above

---

## 🎯 Quick Test Command

After fixing MONGODB_URI, run this in PowerShell:

```powershell
$headers = @{
    "X-Admin-Passcode" = "<ADMIN_PASSCODE>"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-WebRequest -Uri "https://ajl-tours-backend.vercel.app/api/bootstrap-database" -Method POST -Headers $headers
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.ReadToEnd()
    }
}
```

---

## ✅ Success Indicators

After running bootstrap, you should see:
- ✅ `"success": true`
- ✅ `"itemsCreated": 3` (or more)
- ✅ `"collectionsFound": 11`
- ✅ `"collectionsMissing": 0`
- ✅ No errors in the response

---

## 🔗 Related Endpoints

- **Bootstrap:** `/api/tours?bootstrap=true` (creates collections) - **USE THIS**
- **Test DB:** `/api/tours?test=db-insert` (tests connection)
- **Migrate Tours:** `/api/migrate-tours` (imports hardcoded tours)

---

*Bootstrap endpoint created: 2024*  
*Status: Ready to use*  
*Remember: Fix MONGODB_URI first!*
