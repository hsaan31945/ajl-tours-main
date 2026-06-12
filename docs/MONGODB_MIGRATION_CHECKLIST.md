# MongoDB Atlas Migration Checklist

Use this checklist to track your progress when migrating to a new MongoDB Atlas database.

---

## 📋 Pre-Migration

- [ ] **Backup current data** (if needed)
  - [ ] Export important collections
  - [ ] Document current database structure
  - [ ] Note any custom indexes or configurations

- [ ] **Document current configuration**
  - [ ] Current cluster: `_______________________`
  - [ ] Current username: `_______________________`
  - [ ] Current database name: `_______________________`
  - [ ] Current connection string: `_______________________`

---

## 🆕 New MongoDB Atlas Setup

### Step 1: Create New Cluster
- [ ] Signed in to MongoDB Atlas: https://cloud.mongodb.com/
- [ ] Created new project (optional)
- [ ] Created new cluster
  - [ ] Selected cloud provider (AWS/Google Cloud/Azure)
  - [ ] Selected region
  - [ ] Cluster created successfully
  - [ ] Cluster name: `_______________________`

### Step 2: Network Access
- [ ] Opened "Network Access" in MongoDB Atlas
- [ ] Added IP address(es)
  - [ ] Option A: Added `0.0.0.0/0` (Allow from anywhere)
  - [ ] Option B: Added specific IP addresses
- [ ] Network access status: **Active** ✅

### Step 3: Database User
- [ ] Created new database user
  - [ ] Username: `_______________________`
  - [ ] Password: `_______________________` ⚠️ **SAVED SECURELY**
  - [ ] Privileges set (Read/Write)
- [ ] User created successfully

### Step 4: Connection String
- [ ] Got connection string from MongoDB Atlas
- [ ] Replaced `<username>` with actual username
- [ ] Replaced `<password>` with actual password (URL-encoded if needed)
- [ ] Added database name to connection string
- [ ] Final connection string format verified:
  ```
  mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/DATABASE_NAME?retryWrites=true&w=majority
  ```
- [ ] Connection string saved: `_______________________`

---

## 🔧 Update Configuration

### Step 5: Local Environment
- [ ] Created/updated `.env` file
- [ ] Added/updated `MONGODB_URI` with new connection string
- [ ] Verified `.env` is in `.gitignore`
- [ ] Tested connection locally:
  ```powershell
  node test-new-mongodb-connection.js
  ```
- [ ] Connection test: **PASSED** ✅

### Step 6: Vercel Environment (if deploying)
- [ ] Opened Vercel dashboard
- [ ] Went to project settings → Environment Variables
- [ ] Updated `MONGODB_URI` with new connection string
- [ ] Set for: Production ✅ Preview ✅ Development ✅
- [ ] Saved changes
- [ ] Redeployed application
- [ ] Verified deployment successful

---

## ✅ Testing

### Step 7: Connection Testing
- [ ] **Local test**:
  - [ ] Ran `node test-new-mongodb-connection.js`
  - [ ] Connection successful
  - [ ] Database operations working
- [ ] **Application test**:
  - [ ] Started server: `node server.js`
  - [ ] Server started without errors
  - [ ] MongoDB connection message in console
  - [ ] Health check endpoint working: `/health`
- [ ] **API endpoints test**:
  - [ ] Tested admin endpoints
  - [ ] Tested tour endpoints
  - [ ] Tested booking endpoints
  - [ ] All endpoints working correctly

### Step 8: Data Verification
- [ ] Database collections created (or migrated)
- [ ] Test data inserted successfully
- [ ] Data retrieval working
- [ ] Admin user created (if needed)
- [ ] All models working correctly

---

## 🧹 Cleanup (Optional)

### Step 9: Remove Old Configuration
- [ ] **Old MongoDB Atlas** (if no longer needed):
  - [ ] Exported all important data
  - [ ] Verified new database is working
  - [ ] Terminated old cluster (⚠️ **IRREVERSIBLE**)
- [ ] **Old environment variables**:
  - [ ] Removed from local `.env` (already replaced)
  - [ ] Removed from Vercel (already replaced)
- [ ] **Documentation**:
  - [ ] Updated any docs with old connection info
  - [ ] Noted migration date

---

## 📝 Final Verification

- [ ] **New connection string is working** ✅
- [ ] **All tests passed** ✅
- [ ] **Application is functional** ✅
- [ ] **No errors in logs** ✅
- [ ] **Production deployment working** (if applicable) ✅

---

## 🎯 Migration Complete!

**Migration Date**: `_______________________`  
**New Cluster**: `_______________________`  
**New Database**: `_______________________`  
**Status**: ✅ **COMPLETE**

---

## 📞 Issues?

If you encountered any issues:
- [ ] Checked troubleshooting section in `MONGODB_ATLAS_MIGRATION_GUIDE.md`
- [ ] Reviewed MongoDB Atlas logs
- [ ] Checked application logs
- [ ] Verified all steps completed

---

**Quick Reference:**
- Migration Guide: `MONGODB_ATLAS_MIGRATION_GUIDE.md`
- Test Script: `test-new-mongodb-connection.js`
- MongoDB Atlas: https://cloud.mongodb.com/
- Vercel Dashboard: https://vercel.com/dashboard




