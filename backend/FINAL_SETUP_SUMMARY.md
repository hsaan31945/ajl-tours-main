# Final Setup Summary - Database Bootstrap

## ✅ MONGODB_URI Updated

**Database Name:** AJLTours  
**Updated Connection String:**
```
mongodb+srv://salman:salman1122@cluster0.tatwtcz.mongodb.net/AJLTours?retryWrites=true&w=majority
```

**Status:** ✅ Updated in Vercel and redeployed

---

## 🚀 Bootstrap Endpoint

**URL:** https://ajl-tours-backend.vercel.app/api/tours?bootstrap=true

**Method:** GET

**Headers:**
```
X-Admin-Passcode: admin123
```

---

## 📋 What Bootstrap Creates

### Collections Created:
1. ✅ **divisions** - Switzerland division
2. ✅ **admins** - Admin user (admin@ajltours.com)
3. ✅ **homepagecontents** - Checkout settings
4. ✅ **tours** - Already exists (you created it)
5. ✅ **bookings** - Will be created
6. ✅ **users** - Will be created
7. ✅ **trips** - Will be created
8. ✅ **tourhighlights** - Will be created
9. ✅ **tourincludeds** - Will be created
10. ✅ **tourexcludeds** - Will be created
11. ✅ **touritineraries** - Will be created

### Initial Data:
- ✅ Switzerland Division
- ✅ Admin User (admin@ajltours.com / admin123)
- ✅ Homepage Content Settings

---

## 🧪 How to Run Bootstrap

### Option 1: PowerShell
```powershell
$headers = @{"X-Admin-Passcode" = "admin123"}
Invoke-WebRequest -Uri "https://ajl-tours-backend.vercel.app/api/tours?bootstrap=true" -Method GET -Headers $headers
```

### Option 2: Browser
Visit: https://ajl-tours-backend.vercel.app/api/tours?bootstrap=true

(You'll need a browser extension to add the `X-Admin-Passcode` header)

### Option 3: curl
```bash
curl -X GET "https://ajl-tours-backend.vercel.app/api/tours?bootstrap=true" \
  -H "X-Admin-Passcode: admin123"
```

---

## ✅ Expected Success Response

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

## 🔍 Troubleshooting

### If You Get 500 Error:

1. **Check MongoDB Atlas Network Access:**
   - Go to: https://cloud.mongodb.com/
   - Click **Network Access**
   - Ensure `0.0.0.0/0` is allowed

2. **Verify Database Credentials:**
   - Username: `salman`
   - Password: `salman1122`
   - Database: `AJLTours`

3. **Check Vercel Logs:**
   - The error response should show the exact issue
   - Look for connection errors or authentication failures

4. **Wait for Deployment:**
   - Sometimes takes 1-2 minutes for changes to propagate
   - Try again after a minute

---

## 📝 Current Configuration

### MONGODB_URI:
```
mongodb+srv://salman:salman1122@cluster0.tatwtcz.mongodb.net/AJLTours?retryWrites=true&w=majority
```

### Database:
- **Name:** AJLTours
- **Existing Collection:** tours (you created this)

### What Bootstrap Will Do:
- Create Switzerland division
- Create admin user
- Create homepage settings
- Verify all other collections exist (MongoDB creates them automatically when needed)

---

## 🎯 Next Steps After Bootstrap

1. ✅ **Verify Collections:**
   - Go to MongoDB Atlas → Browse Collections
   - Should see all collections listed

2. ✅ **Test Add Tour:**
   - Should work now without 500 error

3. ✅ **Test Migration:**
   - Should work now without 404 error

4. ✅ **Create Tours:**
   - Use admin panel or migration endpoint

---

*Setup ready: 2024*  
*Database: AJLTours*  
*Bootstrap endpoint: /api/tours?bootstrap=true*







