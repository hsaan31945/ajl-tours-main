# Quick Fix Guide: Add Tour & Migration Errors

## 🚨 Immediate Actions Required

### Error 1: Add Tour Returns 500
**Location**: `api/tours/index.js`

### Error 2: Migration Returns 404
**Location**: `api/migrate-tours.js` routing

---

## ⚡ Quick Fixes (Copy-Paste Ready)

### Fix 1: Body Parsing in Add Tour Endpoint

**File**: `api/tours/index.js`  
**Replace lines 32-41** with:

```javascript
// Parse request body - handle both Express and serverless
let body = {};
try {
  // Check if body is already parsed (Express middleware or Vercel)
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    body = req.body;
    console.log('Using pre-parsed body');
  } else {
    // Manual parsing for pure serverless
    console.log('Parsing body manually');
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const bodyStr = Buffer.concat(chunks).toString() || '{}';
    body = JSON.parse(bodyStr);
  }
  console.log('Parsed body:', Object.keys(body));
} catch (e) {
  console.error('Body parsing error:', e);
  return res.status(400).json({ 
    message: 'Invalid JSON in request body',
    error: config.NODE_ENV === 'development' ? e.message : undefined
  });
}
```

### Fix 2: Better Error Logging

**File**: `api/tours/index.js`  
**Replace the catch block (lines 114-121)** with:

```javascript
} catch (tourError) {
  console.error('=== TOUR CREATION ERROR ===');
  console.error('Error name:', tourError.name);
  console.error('Error message:', tourError.message);
  console.error('Error stack:', tourError.stack);
  console.error('Request body received:', JSON.stringify(body, null, 2));
  console.error('Division ID:', divisionId);
  console.error('========================');
  
  // More specific error messages
  let errorMessage = 'Failed to create tour';
  let statusCode = 500;
  
  if (tourError.name === 'ValidationError') {
    errorMessage = `Validation error: ${tourError.message}`;
    statusCode = 400;
  } else if (tourError.name === 'MongoServerError') {
    if (tourError.code === 11000) {
      errorMessage = 'Tour with this name already exists';
      statusCode = 409;
    } else {
      errorMessage = `Database error: ${tourError.message}`;
    }
  } else if (tourError.name === 'MongooseError') {
    errorMessage = `Mongoose error: ${tourError.message}`;
  } else if (tourError.message && tourError.message.includes('connection')) {
    errorMessage = 'Database connection failed. Please check MONGODB_URI.';
  }
  
  return res.status(statusCode).json({
    success: false,
    message: errorMessage,
    error: config.NODE_ENV === 'development' ? tourError.message : 'Internal server error',
    details: config.NODE_ENV === 'development' ? {
      name: tourError.name,
      code: tourError.code,
      keyPattern: tourError.keyPattern,
      keyValue: tourError.keyValue
    } : undefined
  });
}
```

### Fix 3: Division Validation

**File**: `api/tours/index.js`  
**Add after line 43** (before division handling):

```javascript
const mongoose = require('mongoose'); // Add at top if not already there
```

**Replace lines 49-79** with:

```javascript
// Handle division - create if doesn't exist or use provided
let divisionId = division;
try {
  if (!division) {
    // Try to find or create a default division
    let defaultDivision = await Division.findOne({ name: 'Switzerland' });
    if (!defaultDivision) {
      console.log('Creating default Switzerland division...');
      defaultDivision = new Division({
        name: 'Switzerland',
        description: 'Tours in Switzerland',
        isActive: true
      });
      await defaultDivision.save();
      console.log('✅ Created default Switzerland division:', defaultDivision._id);
    } else {
      console.log('✅ Found existing Switzerland division:', defaultDivision._id);
    }
    divisionId = defaultDivision._id;
  } else {
    // Validate division ID format
    if (!mongoose.Types.ObjectId.isValid(division)) {
      console.error('❌ Invalid division ID format:', division);
      return res.status(400).json({ 
        message: 'Invalid division ID format. Must be a valid MongoDB ObjectId.' 
      });
    }
    
    // Verify division exists
    const divisionExists = await Division.findById(division);
    if (!divisionExists) {
      console.error('❌ Division not found:', division);
      return res.status(400).json({ 
        message: 'Division not found. Please create a division first.' 
      });
    }
    
    if (!divisionExists.isActive) {
      console.error('❌ Division is not active:', division);
      return res.status(400).json({ 
        message: 'Division is not active. Please activate it first.' 
      });
    }
    
    console.log('✅ Division validated:', divisionExists.name);
    divisionId = division;
  }
} catch (divError) {
  console.error('=== DIVISION HANDLING ERROR ===');
  console.error('Error name:', divError.name);
  console.error('Error message:', divError.message);
  console.error('Error stack:', divError.stack);
  console.error('Division value:', division);
  console.error('================================');
  
  return res.status(500).json({ 
    message: 'Failed to process division', 
    error: config.NODE_ENV === 'development' ? divError.message : 'Internal server error',
    details: config.NODE_ENV === 'development' ? {
      name: divError.name,
      message: divError.message,
      stack: divError.stack
    } : undefined
  });
}
```

### Fix 4: Database Connection Check

**File**: `api/tours/index.js`  
**Replace line 17** with:

```javascript
try {
  await connectDB();
  console.log('✅ Database connected successfully');
} catch (dbError) {
  console.error('=== DATABASE CONNECTION ERROR ===');
  console.error('Error name:', dbError.name);
  console.error('Error message:', dbError.message);
  console.error('MONGODB_URI set:', !!process.env.MONGODB_URI);
  console.error('==================================');
  
  return res.status(500).json({
    error: 'Database connection failed',
    message: config.NODE_ENV === 'development' 
      ? `Database error: ${dbError.message}. Check MONGODB_URI environment variable.`
      : 'Internal server error',
    details: config.NODE_ENV === 'development' ? {
      name: dbError.name,
      message: dbError.message,
      mongoUriSet: !!process.env.MONGODB_URI
    } : undefined
  });
}
```

---

## 🔧 Migration 404 Fix

### Option A: Move File (Recommended)

**Steps:**
1. Create directory: `api/migrate-tours/`
2. Move `api/migrate-tours.js` → `api/migrate-tours/index.js`
3. Delete `api/migrate-tours.js`
4. Remove lines 51-54 from `api/index.js` (the manual routing)

**Why**: Vercel recognizes `api/{folder}/index.js` as `/api/{folder}` route

### Option B: Fix api/index.js Routing

**File**: `api/index.js`  
**Replace lines 50-54** with:

```javascript
// Migrate hardcoded tours to database
const urlPath = (req.url || '').split('?')[0]; // Remove query params
if (urlPath === '/api/migrate-tours' || urlPath === '/migrate-tours' || urlPath.endsWith('/migrate-tours')) {
  console.log('Routing to migrate-tours handler');
  const migrateTours = require('./migrate-tours');
  return migrateTours(req, res);
}
```

### Option C: Add Logging to Migration Endpoint

**File**: `api/migrate-tours.js`  
**Add at the very start** (after CORS headers, before OPTIONS check):

```javascript
console.log('=== MIGRATION ENDPOINT CALLED ===');
console.log('Method:', req.method);
console.log('URL:', req.url);
console.log('Headers:', JSON.stringify(req.headers, null, 2));
console.log('==================================');
```

---

## 🧪 Testing Steps

### Test Add Tour

1. **Check Environment Variables:**
   ```bash
   # In your terminal or .env file
   MONGODB_URI=mongodb+srv://...
   ADMIN_PASSCODE=admin123
   ```

2. **Test with curl:**
   ```bash
   curl -X POST http://localhost:3000/api/tours \
     -H "Content-Type: application/json" \
     -H "X-Admin-Passcode: admin123" \
     -d '{
       "name": "Test Tour",
       "price": 100
     }'
   ```

3. **Check Console Logs:**
   - Should see: "✅ Database connected successfully"
   - Should see: "Parsed body: ['name', 'price']"
   - Should see: "✅ Found existing Switzerland division"
   - Should see: "Tour created successfully"

### Test Migration

1. **Check File Location:**
   - If using Option A: File should be at `api/migrate-tours/index.js`
   - If using Option B: File can stay at `api/migrate-tours.js`

2. **Test with curl:**
   ```bash
   curl -X POST http://localhost:3000/api/migrate-tours \
     -H "Content-Type: application/json" \
     -H "X-Admin-Passcode: admin123" \
     -d '{}'
   ```

3. **Check Console Logs:**
   - Should see: "=== MIGRATION ENDPOINT CALLED ==="
   - Should see: "Connected to database"
   - Should see: "Successfully migrated X tours"

---

## 🐛 Debugging Checklist

### If Add Tour Still Fails:

- [ ] Check `MONGODB_URI` is set correctly
- [ ] Verify MongoDB connection works (test separately)
- [ ] Check console logs for specific error
- [ ] Verify admin passcode matches
- [ ] Test with minimal payload (just name and price)
- [ ] Check if Division model is imported correctly
- [ ] Verify Tour model schema matches data being sent

### If Migration Still Returns 404:

- [ ] Verify file exists at correct location
- [ ] Check Vercel deployment logs
- [ ] Test endpoint directly (not through frontend)
- [ ] Check `api/index.js` routing logic
- [ ] Verify Vercel configuration in `vercel.json`
- [ ] Check if file is included in build

---

## 📝 Common Error Messages & Solutions

### "Database connection failed"
**Solution**: Check `MONGODB_URI` environment variable

### "Invalid division ID format"
**Solution**: Ensure division is a valid MongoDB ObjectId or null/undefined

### "Division not found"
**Solution**: Create division first or let it auto-create Switzerland division

### "Validation error"
**Solution**: Check Tour model schema requirements

### "Route not found" (404)
**Solution**: Fix Vercel routing (use Option A or B above)

---

## ✅ Success Indicators

### Add Tour Working:
- ✅ Returns 201 status code
- ✅ Response includes `{ success: true, tour: {...} }`
- ✅ Tour appears in database
- ✅ No errors in console

### Migration Working:
- ✅ Returns 200 status code
- ✅ Response includes `{ success: true, results: [...] }`
- ✅ Tours appear in database
- ✅ Console shows "Created tour: [name]"

---

*Quick reference guide - For detailed analysis see `ERROR_ANALYSIS_ADD_TOUR_AND_MIGRATION.md`*








