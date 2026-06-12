# Migration Guide - Old to New Backend

## 🔄 How to Use the New Backend

### **For Development**
```bash
cd backend
node src/server.js
```
Server runs on `http://localhost:3000`

### **For Production (Vercel)**
The new structure automatically works with Vercel. The `api/` folder contains thin wrappers that use the `src/` code.

---

## 📝 **Key Changes**

### **1. Import Paths Changed**

**Old:**
```javascript
const config = require('./config');
const { connectDB } = require('./config/database');
```

**New:**
```javascript
const config = require('./src/config');
const { connectDB } = require('./src/config/database');
```

### **2. Using ID Utilities**

**Old:**
```javascript
const tourId = tour.id || tour._id;
```

**New:**
```javascript
const { getTourId } = require('./src/utils/tourId');
const tourId = getTourId(tour);
```

### **3. Using Services**

**Old:**
```javascript
const tour = await Tour.findById(id);
```

**New:**
```javascript
const tourService = require('./src/services/tourService');
const tour = await tourService.getTourById(id);
```

---

## ✅ **What's Working**

- ✅ All tour endpoints
- ✅ All booking endpoints  
- ✅ Authentication endpoints
- ✅ CORS (unified)
- ✅ Error handling
- ✅ ID standardization

---

## 🚀 **Ready to Deploy!**





