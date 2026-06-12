/**
 * MongoDB Connection Test Script
 * 
 * This script tests your new MongoDB Atlas connection string.
 * 
 * Usage:
 *   1. Set MONGODB_URI in .env file or pass as environment variable
 *   2. Run: node scripts/test-new-mongodb-connection.js
 * 
 * Or test with inline connection string:
 *   MONGODB_URI="mongodb+srv://..." node scripts/test-new-mongodb-connection.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function testConnection() {
  logSection('MongoDB Atlas Connection Test');
  
  // Step 1: Check if MONGODB_URI is set
  log('\n📋 Step 1: Checking Environment Variables', 'blue');
  const mongoURI = process.env.MONGODB_URI;
  
  if (!mongoURI) {
    log('❌ ERROR: MONGODB_URI environment variable is not set!', 'red');
    log('\n💡 How to fix:', 'yellow');
    log('   1. Create a .env file in the project root', 'yellow');
    log('   2. Add: MONGODB_URI="your_connection_string_here"', 'yellow');
    log('   3. Or set it inline: MONGODB_URI="..." node scripts/test-new-mongodb-connection.js', 'yellow');
    process.exit(1);
  }
  
  log('✅ MONGODB_URI is set', 'green');
  
  // Step 2: Validate connection string format
  log('\n📋 Step 2: Validating Connection String Format', 'blue');
  
  if (!mongoURI.startsWith('mongodb://') && !mongoURI.startsWith('mongodb+srv://')) {
    log('❌ ERROR: Invalid connection string format!', 'red');
    log('   Connection string must start with "mongodb://" or "mongodb+srv://"', 'red');
    process.exit(1);
  }
  
  // Check for database name
  const hasDatabaseName = mongoURI.match(/mongodb\+?srv?:\/\/[^/]+\/([^?]+)/);
  if (!hasDatabaseName) {
    log('⚠️  WARNING: No database name found in connection string', 'yellow');
    log('   Format should be: mongodb+srv://user:pass@cluster.mongodb.net/DATABASE_NAME?...', 'yellow');
    log('   MongoDB will create the database on first write, but it\'s better to specify it.', 'yellow');
  } else {
    const dbName = hasDatabaseName[1];
    log(`✅ Database name found: ${dbName}`, 'green');
  }
  
  // Mask password in output
  const maskedURI = mongoURI.replace(/:([^:@]+)@/, ':****@');
  log(`   Connection String: ${maskedURI}`, 'cyan');
  
  // Step 3: Test connection
  log('\n📋 Step 3: Testing MongoDB Connection', 'blue');
  log('   Attempting to connect...', 'cyan');
  
  try {
    // Set connection timeout
    const connectionOptions = {
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000,
    };
    
    const startTime = Date.now();
    await mongoose.connect(mongoURI, connectionOptions);
    const connectionTime = Date.now() - startTime;
    
    log(`✅ Connection successful! (${connectionTime}ms)`, 'green');
    
    // Step 4: Get connection details
    log('\n📋 Step 4: Connection Details', 'blue');
    const conn = mongoose.connection;
    
    log(`   Host: ${conn.host}`, 'cyan');
    log(`   Port: ${conn.port}`, 'cyan');
    log(`   Database: ${conn.name}`, 'cyan');
    log(`   State: ${getConnectionState(conn.readyState)}`, 'cyan');
    
    // Step 5: Test database operations
    log('\n📋 Step 5: Testing Database Operations', 'blue');
    
    // List collections
    try {
      const collections = await conn.db.listCollections().toArray();
      log(`   Collections found: ${collections.length}`, 'cyan');
      
      if (collections.length > 0) {
        log('   Collection names:', 'cyan');
        collections.forEach(col => {
          log(`     - ${col.name}`, 'cyan');
        });
      } else {
        log('   ⚠️  No collections found (database is empty or new)', 'yellow');
      }
    } catch (err) {
      log(`   ⚠️  Could not list collections: ${err.message}`, 'yellow');
    }
    
    // Step 6: Test write operation (optional)
    log('\n📋 Step 6: Testing Write Operation', 'blue');
    try {
      const testCollection = conn.db.collection('_connection_test');
      const testDoc = {
        test: true,
        timestamp: new Date(),
        message: 'Connection test successful'
      };
      
      await testCollection.insertOne(testDoc);
      log('   ✅ Write operation successful', 'green');
      
      // Clean up test document
      await testCollection.deleteOne({ _id: testDoc._id });
      log('   ✅ Test document cleaned up', 'green');
    } catch (err) {
      log(`   ⚠️  Write test failed: ${err.message}`, 'yellow');
      log('   This might be due to permissions - check database user privileges', 'yellow');
    }
    
    // Step 7: Summary
    logSection('✅ Connection Test Summary');
    log('   Status: CONNECTED', 'green');
    log('   Database: Ready to use', 'green');
    log('   Next Steps:', 'blue');
    log('   1. Your connection string is working correctly', 'cyan');
    log('   2. You can now use this MONGODB_URI in your application', 'cyan');
    log('   3. Update your .env file or Vercel environment variables', 'cyan');
    log('   4. Restart your application server', 'cyan');
    
  } catch (error) {
    logSection('❌ Connection Test Failed');
    log(`   Error: ${error.message}`, 'red');
    
    // Provide specific error guidance
    log('\n💡 Troubleshooting:', 'yellow');
    
    if (error.message.includes('authentication')) {
      log('   • Check username and password are correct', 'yellow');
      log('   • Make sure password is URL-encoded (special characters)', 'yellow');
      log('   • Verify database user exists in MongoDB Atlas', 'yellow');
    } else if (error.message.includes('timeout') || error.message.includes('ENOTFOUND')) {
      log('   • Check Network Access settings in MongoDB Atlas', 'yellow');
      log('   • Make sure your IP is whitelisted (or 0.0.0.0/0 is allowed)', 'yellow');
      log('   • Verify cluster name is correct', 'yellow');
    } else if (error.message.includes('ENOTFOUND')) {
      log('   • Check cluster name/URL is correct', 'yellow');
      log('   • Verify internet connection', 'yellow');
    } else {
      log('   • Check connection string format', 'yellow');
      log('   • Verify MongoDB Atlas cluster is running', 'yellow');
      log('   • Check MongoDB Atlas dashboard for errors', 'yellow');
    }
    
    log('\n   Connection String Format:', 'yellow');
    log('   mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/DATABASE?retryWrites=true&w=majority', 'yellow');
    
    process.exit(1);
  } finally {
    // Close connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      log('\n   Connection closed', 'cyan');
    }
  }
}

function getConnectionState(state) {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[state] || 'unknown';
}

// Run the test
testConnection()
  .then(() => {
    log('\n✅ Test completed successfully!', 'green');
    process.exit(0);
  })
  .catch((error) => {
    log(`\n❌ Test failed: ${error.message}`, 'red');
    process.exit(1);
  });



