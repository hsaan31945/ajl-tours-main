# Database Test Endpoint - Ready to Test

## ✅ Endpoint Created and Deployed

I've added a database test endpoint that **writes data directly to the database** to verify the connection is working.

---

## 🔗 Test URL

**URL:** https://ajl-tours-backend.vercel.app/api/tours?test=db-insert

**Method:** GET

**What it does:**
1. ✅ Connects to MongoDB
2. ✅ Creates a test division (if it doesn't exist)
3. ✅ Creates a test tour with timestamp
4. ✅ Queries the data back
5. ✅ Returns all results

---

## 🧪 How to Test

### Option 1: Browser
Just visit: https://ajl-tours-backend.vercel.app/api/tours?test=db-insert

### Option 2: PowerShell
```powershell
Invoke-WebRequest -Uri "https://ajl-tours-backend.vercel.app/api/tours?test=db-insert" -Method GET
```

### Option 3: curl
```bash
curl "https://ajl-tours-backend.vercel.app/api/tours?test=db-insert"
```

---

## ✅ Expected Success Response

```json
{
  "status": "success",
  "message": "Database connection and write operations working!",
  "timestamp": "2024-01-XX...",
  "database": {
    "name": "your-database-name",
    "host": "cluster.mongodb.net",
    "state": 1,
    "stateName": "connected"
  },
  "operations": {
    "connection": "success",
    "divisionInsert": "success",
    "tourInsert": "success",
    "dataRetrieval": "success"
  },
  "testData": {
    "divisionCreated": {
      "id": "...",
      "name": "Test Division - DB Connection Test"
    },
    "tourCreated": {
      "id": "...",
      "name": "Test Tour - DB Connection Test ..."
    }
  },
  "counts": {
    "totalDivisions": 1,
    "totalTours": 1
  }
}
```

---

## ❌ If You Get 500 Error

This means the endpoint is found but the database connection is failing. Check:

1. **MONGODB_URI is set in Vercel:**
   - Go to: https://vercel.com/salman1122334411s-projects/ajl-tours-backend/settings/environment-variables
   - Verify `MONGODB_URI` exists and is correct

2. **MongoDB Atlas Settings:**
   - Network Access: Add `0.0.0.0/0` (all IPs) or Vercel IPs
   - Database Access: User has read/write permissions
   - Connection String: Format is `mongodb+srv://user:password@cluster.mongodb.net/dbname`

3. **Check Error Details:**
   - The response should include error details
   - Look for specific error message

---

## 🔍 What the Test Does

1. **Connects to Database**
   - Uses the `MONGODB_URI` environment variable
   - Verifies connection state is ready

2. **Creates Test Division**
   - Name: "Test Division - DB Connection Test"
   - Only creates if it doesn't exist
   - Returns the division ID

3. **Creates Test Tour**
   - Name: "Test Tour - DB Connection Test [timestamp]"
   - Links to the test division
   - Includes all required fields
   - Returns the tour ID

4. **Queries Data Back**
   - Counts total divisions
   - Counts total tours
   - Verifies data was written

---

## 📝 Notes

- The test creates real data in your database
- Test division and tour will persist
- You can delete them later if needed
- Each test creates a new tour with a unique timestamp

---

## 🎯 Next Steps

1. **Test the endpoint** using the URL above
2. **Check the response:**
   - If success → Database is working! ✅
   - If 500 error → Check MONGODB_URI and MongoDB Atlas settings
3. **If database works**, then test Add Tour and Migration endpoints

---

*Endpoint created: 2024*  
*Status: Deployed and ready to test*  
*URL: /api/tours?test=db-insert*








