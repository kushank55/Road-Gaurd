import { sequelize } from '../config/db';

async function optimizeDatabase() {
  try {
    console.log('🔧 Starting database optimization...');
    
    // Create indexes for frequently queried fields
    
    // 1. Users table indexes
    await sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email 
      ON users (email);
    `);
    
    await sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_phone 
      ON users (phone);
    `);
    
    await sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role 
      ON users (role);
    `);
    
    await sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_is_verified 
      ON users (is_verified);
    `);
    
    // 2. OTPs table indexes
    await sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_otps_email_purpose 
      ON otps (email, purpose);
    `);
    
    await sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_otps_user_id_is_used 
      ON otps (user_id, is_used) WHERE user_id IS NOT NULL;
    `);
    
    await sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_otps_expires_at 
      ON otps (expires_at);
    `);
    
    await sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_otps_otp_code 
      ON otps (otp_code);
    `);
    
    // 3. Service Requests indexes
    await sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_requests_user_id 
      ON service_requests (user_id);
    `);
    
    await sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_requests_workshop_id 
      ON service_requests (workshop_id);
    `);
    
    await sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_requests_status 
      ON service_requests (status);
    `);
    
    // 4. Workshops indexes
    await sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workshops_owner_id 
      ON workshops ("ownerId");
    `);
    
    await sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workshops_location 
      ON workshops (latitude, longitude);
    `);
    
    // 5. Workers indexes
    await sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workers_workshop_id 
      ON workers (workshop_id);
    `);
    
    await sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workers_user_id 
      ON workers (user_id);
    `);
    
    await sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workers_is_available 
      ON workers (is_available);
    `);
    
    // 6. Reviews indexes
    await sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_workshop_id 
      ON reviews (workshop_id);
    `);
    
    await sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_user_id 
      ON reviews (user_id);
    `);
    
    // 7. Add cleanup job for expired OTPs
    await sequelize.query(`
      DELETE FROM otps WHERE expires_at < NOW() - INTERVAL '1 day';
    `);
    
    console.log('✅ Database optimization completed!');
    
    // Get database statistics
    const stats = await sequelize.query(`
      SELECT schemaname, tablename, attname, n_distinct, correlation 
      FROM pg_stats 
      WHERE schemaname = 'public' 
      AND tablename IN ('users', 'otps', 'service_requests', 'workshops', 'workers', 'reviews')
      ORDER BY tablename, attname;
    `);
    
    console.log('📊 Database statistics:', stats[0]);
    
  } catch (error) {
    console.error('❌ Error optimizing database:', error);
    throw error;
  }
}

// Clean up expired data
async function cleanupExpiredData() {
  try {
    console.log('🧹 Cleaning up expired data...');
    
    // Delete expired OTPs
    const expiredOtps = await sequelize.query(`
      DELETE FROM otps 
      WHERE expires_at < NOW() - INTERVAL '1 hour'
      RETURNING id;
    `);
    
    console.log(`🗑️  Deleted ${expiredOtps[0].length} expired OTPs`);
    
    // Clean up old unused email verification OTPs (older than 24 hours)
    const oldEmailOtps = await sequelize.query(`
      DELETE FROM otps 
      WHERE purpose = 'EMAIL_VERIFICATION' 
      AND is_used = false 
      AND "createdAt" < NOW() - INTERVAL '24 hours'
      RETURNING id;
    `);
    
    console.log(`🗑️  Deleted ${oldEmailOtps[0].length} old email verification OTPs`);
    
  } catch (error) {
    console.error('❌ Error cleaning up expired data:', error);
  }
}

// Run if called directly
if (require.main === module) {
  optimizeDatabase()
    .then(() => cleanupExpiredData())
    .then(() => {
      console.log('🎉 Database optimization and cleanup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database optimization failed:', error);
      process.exit(1);
    });
}

export { optimizeDatabase, cleanupExpiredData };
