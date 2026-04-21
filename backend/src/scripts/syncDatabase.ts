import { sequelize } from '../config/db';
import '../models'; // Import all models to ensure associations are set up

async function syncDatabase() {
  try {
    console.log('🔄 Starting database synchronization...');
    
    // Drop existing tables and recreate (only for development)
    await sequelize.sync({ 
      force: process.env['NODE_ENV'] === 'development', 
      alter: process.env['NODE_ENV'] !== 'development' 
    });
    
    console.log('✅ Database synchronized successfully!');
    
    // Test the connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully!');
    
  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  syncDatabase()
    .then(() => {
      console.log('🎉 Database setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database setup failed:', error);
      process.exit(1);
    });
}

export default syncDatabase;
