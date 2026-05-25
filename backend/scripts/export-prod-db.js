const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Read connection string from environment files
let mongoURI = '';

// Check .env.production first, then fall back to .env
const prodEnvPath = path.join(__dirname, '..', '.env.production');
const devEnvPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(prodEnvPath)) {
  console.log('📝 Reading MongoDB URI from .env.production...');
  const prodEnv = fs.readFileSync(prodEnvPath, 'utf8');
  const uriMatch = prodEnv.match(/MONGODB_URI=["']?([^"'\r\n]+)/);
  if (uriMatch) {
    mongoURI = uriMatch[1].trim();
  }
}

if (!mongoURI && fs.existsSync(devEnvPath)) {
  console.log('📝 Reading MongoDB URI from .env...');
  const devEnv = fs.readFileSync(devEnvPath, 'utf8');
  const uriMatch = devEnv.match(/MONGODB_URI=["']?([^"'\r\n]+)/);
  if (uriMatch) {
    mongoURI = uriMatch[1].trim();
  }
}

// Clean connection string (remove any trailing \r\n, backslashes, or quotes)
mongoURI = mongoURI.replace(/\\r\\n/g, '').replace(/\\n/g, '').replace(/\\r/g, '').trim();

if (!mongoURI) {
  console.error('❌ MONGODB_URI not found in .env.production or .env files!');
  process.exit(1);
}

// Mask credentials for display
const maskedURI = mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
console.log(`🔌 Connecting to: ${maskedURI}`);

async function exportDatabase() {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 15000
    });
    
    console.log('✅ Successfully connected to MongoDB!');
    const db = mongoose.connection.db;
    
    // Discover all collections
    const collections = await db.listCollections().toArray();
    console.log(`📦 Found ${collections.length} collections in database.`);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0];
    const exportDirName = `mongodb_export_${timestamp}`;
    const exportDirPath = path.join(__dirname, '..', exportDirName);
    
    fs.mkdirSync(exportDirPath, { recursive: true });
    console.log(`📁 Created export folder: ${exportDirPath}\n`);
    
    const summary = {};
    const schemas = {};
    
    for (const collInfo of collections) {
      const collName = collInfo.name;
      console.log(`🔄 Exporting collection "${collName}"...`);
      
      const documents = await db.collection(collName).find({}).toArray();
      
      // Write JSON file
      const filePath = path.join(exportDirPath, `${collName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(documents, null, 2), 'utf8');
      
      console.log(`  ✓ Saved ${documents.length} documents to ${collName}.json`);
      summary[collName] = documents.length;
      
      // Infer schema from the documents (field names and types)
      if (documents.length > 0) {
        const fields = {};
        // Sample up to 10 documents to find all possible fields
        const sampleCount = Math.min(documents.length, 10);
        for (let i = 0; i < sampleCount; i++) {
          const doc = documents[i];
          for (const [key, val] of Object.entries(doc)) {
            if (key === '_id') {
              fields[key] = 'ObjectId';
            } else if (val === null) {
              fields[key] = fields[key] || 'Null';
            } else if (Array.isArray(val)) {
              const itemType = val.length > 0 ? typeof val[0] : 'Any';
              fields[key] = `Array<${itemType}>`;
            } else if (val instanceof Date) {
              fields[key] = 'Date';
            } else {
              fields[key] = typeof val;
            }
          }
        }
        schemas[collName] = fields;
      } else {
        schemas[collName] = '(Empty Collection)';
      }
    }
    
    // Save metadata / schemas summary
    const metaPath = path.join(exportDirPath, `database_manifest.json`);
    const manifest = {
      exportedAt: new Date().toISOString(),
      sourceDatabase: mongoose.connection.name,
      collectionsCount: collections.length,
      documentCounts: summary,
      schemas: schemas
    };
    fs.writeFileSync(metaPath, JSON.stringify(manifest, null, 2), 'utf8');
    
    // Generate restore/import script in the export directory
    const importScriptPath = path.join(exportDirPath, 'import_to_new_db.js');
    const importScriptContent = `/**
 * AJL Tours - Database Import / Migration Utility
 * 
 * This script imports all the exported JSON collections into a new MongoDB cluster.
 * 
 * Usage:
 *   node import_to_new_db.js "<YOUR_NEW_MONGODB_CONNECTION_STRING>"
 */

const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

const newURI = process.argv[2];

if (!newURI) {
  console.error('\\x1b[31mError: Please specify the new connection string!\\x1b[0m');
  console.error('Usage: node import_to_new_db.js "mongodb+srv://user:pass@cluster.xxxx.mongodb.net/dbname?retryWrites=true&w=majority"');
  process.exit(1);
}

const manifest = ${JSON.stringify(manifest, null, 2)};
const filesToImport = Object.keys(manifest.documentCounts);

async function runImport() {
  const client = new MongoClient(newURI);
  
  try {
    console.log('🔌 Connecting to the new database...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    const db = client.db();
    console.log(\`🎯 Target Database Name: \${db.databaseName}\`);
    
    for (const colName of filesToImport) {
      const filePath = path.join(__dirname, \`\${colName}.json\`);
      if (!fs.existsSync(filePath)) {
        console.warn(\`⚠️ File not found for collection: \${colName}, skipping.\`);
        continue;
      }
      
      console.log(\`\\n📦 Importing collection "\${colName}"...\`);
      const rawData = fs.readFileSync(filePath, 'utf8');
      const docs = JSON.parse(rawData);
      
      if (docs.length === 0) {
        console.log(\`  ⊙ Collection is empty, skipping insert.\`);
        continue;
      }
      
      // Convert serialized ObjectIDs and Dates back to MongoDB objects
      const parsedDocs = docs.map(doc => {
        const cleaned = { ...doc };
        
        // Convert fields
        for (const [key, val] of Object.entries(cleaned)) {
          if (key === '_id' && val && (val.$oid || typeof val === 'string')) {
            cleaned._id = new ObjectId(val.$oid || val);
          } else if (typeof val === 'string' && /^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}/.test(val)) {
            // Looks like a serialized date string
            cleaned[key] = new Date(val);
          } else if (val && typeof val === 'object') {
            // Check for MongoDB types like $oid in nested fields (e.g. division)
            if (val.$oid) {
              cleaned[key] = new ObjectId(val.$oid);
            } else if (val.$date) {
              cleaned[key] = new Date(val.$date);
            }
          }
        }
        return cleaned;
      });
      
      // Clear collection first to avoid duplicates
      console.log(\`  🧹 Clearing existing documents in target collection "\${colName}"...\`);
      await db.collection(colName).deleteMany({});
      
      // Insert documents
      console.log(\`  📥 Inserting \${parsedDocs.length} documents...\`);
      const result = await db.collection(colName).insertMany(parsedDocs);
      console.log(\`  ✅ Inserted \${result.insertedCount} documents successfully!\`);
    }
    
    console.log('\\n\\x1b[32m====================================================\\x1b[0m');
    console.log('\\x1b[32m🎉 MIGRATION COMPLETED SUCCESSFULLY!                \\x1b[0m');
    console.log('\\x1b[32m====================================================\\x1b[0m');
    
  } catch (err) {
    console.error('\\x1b[31m❌ Migration failed: \\x1b[0m', err.message);
  } finally {
    await client.close();
  }
}

runImport();
`;
    
    fs.writeFileSync(importScriptPath, importScriptContent, 'utf8');
    
    console.log('\n==================================================');
    console.log('🎉 DATABASE EXPORT COMPLETED SUCCESSFULLY!');
    console.log(`📁 Files saved in: ${exportDirName}`);
    console.log('==================================================');
    console.log('\nExported Collections Summary:');
    console.table(summary);
    
    console.log('\n👉 Instructions to restore/migrate:');
    console.log(`1. Move the folder "${exportDirName}" to your local machine.`);
    console.log(`2. Open a terminal in that folder.`);
    console.log(`3. Run: npm install mongodb`);
    console.log(`4. Execute the import script with your new connection string:`);
    console.log(`   node import_to_new_db.js "mongodb+srv://YOUR_USER:YOUR_PASS@your-cluster.mongodb.net/AJLTours?retryWrites=true&w=majority"\n`);
    
  } catch (error) {
    console.error('❌ Database export failed:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

exportDatabase();
