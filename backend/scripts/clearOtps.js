const { Client } = require('pg');

async function clearOtps() {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    user: 'postgres',
    password: '1602',
    database: 'postgres',
  });

  try {
    await client.connect();
    console.log('Connected to database');
    
    // Clear OTP table
    const result = await client.query('DELETE FROM otps;');
    console.log(`Deleted ${result.rowCount} OTP records`);
    
    console.log('✅ OTP table cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing OTP table:', error);
  } finally {
    await client.end();
  }
}

clearOtps();
