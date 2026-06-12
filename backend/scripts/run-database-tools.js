const https = require('https');

const API_BASE = 'https://ajl-tours-backend.vercel.app/api/update-tour-data';

function makeRequest(action) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}?action=${action}`;
    
    console.log(`\n🔄 Making request to: ${url}`);
    console.log('⏳ Please wait...\n');
    
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

async function runAction(action) {
  try {
    const result = await makeRequest(action);
    
    if (result.status === 200) {
      console.log('✅ SUCCESS!\n');
      console.log(JSON.stringify(result.data, null, 2));
      
      // If backup, save to file
      if (action === 'backup' && result.data.backup) {
        const fs = require('fs');
        const path = require('path');
        const timestamp = new Date().toISOString().split('T')[0];
        const backupsDir = path.join(__dirname, '../../database-backups');
        if (!fs.existsSync(backupsDir)) {
          fs.mkdirSync(backupsDir, { recursive: true });
        }
        const filename = path.join(backupsDir, `backup_${timestamp}.json`);
        fs.writeFileSync(filename, JSON.stringify(result.data.backup, null, 2));
        console.log(`\n💾 Backup saved to: ${filename}`);
      }
    } else {
      console.log('❌ ERROR:\n');
      console.log(JSON.stringify(result.data, null, 2));
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

// Get action from command line
const action = process.argv[2];

if (!action) {
  console.log(`
📋 Database Tools - Usage:

  node scripts/run-database-tools.js backup    - Backup database
  node scripts/run-database-tools.js migrate   - Migrate to separate collections
  node scripts/run-database-tools.js clear     - Clear database (DANGEROUS!)

⚠️  Always backup before clearing!
`);
  process.exit(1);
}

if (action === 'clear') {
  console.log(`
⚠️  WARNING: This will PERMANENTLY DELETE ALL DATA!
⚠️  This action cannot be undone!
⚠️  Make sure you have a backup first!

Type 'YES DELETE ALL' to confirm: `);
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('', (answer) => {
    if (answer === 'YES DELETE ALL') {
      runAction('clear').then(() => process.exit(0));
    } else {
      console.log('❌ Cancelled. Database was NOT cleared.');
      process.exit(0);
    }
    rl.close();
  });
} else {
  runAction(action).then(() => process.exit(0));
}
