# CORS Fix for Tour API Endpoints

## Problem
The frontend at `https://ajl-tours-frontend.vercel.app` is being blocked by CORS when trying to fetch tours from `https://ajl-tours-backend.vercel.app/api/tours/[id]`.

Error message:
```
Access to fetch at 'https://ajl-tours-backend.vercel.app/api/tours/6952a1657c6e282b109e1dba' 
from origin 'https://ajl-tours-frontend.vercel.app' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Root Cause
1. The CORS origin configuration might not include the production frontend URL
2. The CORS headers might not be set correctly when `config.cors.origin` is an array
3. The origin header might not be properly checked against allowed origins

## Fixes Applied

### 1. Updated CORS Header Logic (`api/tours/[id].js` and `api/tours/index.js`)

**Before:**
```javascript
res.setHeader('Access-Control-Allow-Origin', config.cors.origin);
```

**After:**
```javascript
// Handle CORS - support both string and array origins
const origin = req.headers.origin;
const allowedOrigins = Array.isArray(config.cors.origin) 
  ? config.cors.origin 
  : [config.cors.origin, 'https://ajl-tours-frontend.vercel.app', 'http://localhost:5173'];

// Check if origin is allowed
if (origin && allowedOrigins.includes(origin)) {
  res.setHeader('Access-Control-Allow-Origin', origin);
} else if (allowedOrigins.includes('*')) {
  res.setHeader('Access-Control-Allow-Origin', '*');
} else {
  // Default to first allowed origin or frontend URL
  const defaultOrigin = allowedOrigins[0] || 'https://ajl-tours-frontend.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', defaultOrigin);
}
```

### 2. Updated Default CORS Origin (`lib/config.js`)

**Before:**
```javascript
origin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173',
```

**After:**
```javascript
origin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'https://ajl-tours-frontend.vercel.app',
```

### 3. Fixed Credentials Header

Changed from:
```javascript
res.setHeader('Access-Control-Allow-Credentials', config.cors.credentials);
```

To:
```javascript
res.setHeader('Access-Control-Allow-Credentials', 'true');
```

## Environment Variables

Make sure these are set in Vercel:

1. **CORS_ORIGIN**: `https://ajl-tours-frontend.vercel.app`
2. **FRONTEND_URL**: `https://ajl-tours-frontend.vercel.app`

Or set as an array (comma-separated):
```
CORS_ORIGIN=https://ajl-tours-frontend.vercel.app,http://localhost:5173
```

## Testing

After deploying, test the CORS fix:

1. **Check CORS headers:**
   ```bash
   curl -H "Origin: https://ajl-tours-frontend.vercel.app" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS \
        https://ajl-tours-backend.vercel.app/api/tours/6952a1657c6e282b109e1dba \
        -v
   ```

2. **Test actual request:**
   ```bash
   curl -H "Origin: https://ajl-tours-frontend.vercel.app" \
        https://ajl-tours-backend.vercel.app/api/tours/6952a1657c6e282b109e1dba \
        -v
   ```

3. **Check in browser:**
   - Open: https://ajl-tours-frontend.vercel.app/switzerland/6952a1657c6e282b109e1dba/checkout-sw
   - Open browser console
   - Should not see CORS errors

## Files Modified

- `api/tours/[id].js` - Fixed CORS header handling
- `api/tours/index.js` - Fixed CORS header handling  
- `lib/config.js` - Updated default CORS origin

## Next Steps

1. **Deploy the fix** to Vercel
2. **Set environment variables** in Vercel dashboard:
   - `CORS_ORIGIN=https://ajl-tours-frontend.vercel.app`
   - `FRONTEND_URL=https://ajl-tours-frontend.vercel.app`
3. **Test the checkout page** - should load without CORS errors

---

*Last Updated: $(date)*

