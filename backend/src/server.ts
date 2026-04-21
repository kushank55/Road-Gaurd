import dotenv from 'dotenv';
import app from './app';
import { testConnection, sequelize } from './config/db';

dotenv.config();

// Import models to register them
import './models';

const PORT = process.env['PORT'] || 5000;

// Start server function
const startServer = async (): Promise<void> => {
  try {
    // Test database connection
    await testConnection();
    
    // Sync database models (create tables if they don't exist)
    console.log('🔄 Syncing database models...');
    await sequelize.sync({ 
      force: false, // Set to true only in development to recreate tables
      alter: process.env['NODE_ENV'] === 'development' // Auto-alter tables in development
    });
    console.log('✅ Database models synced successfully.');

    // Start the server
    const server = app.listen(PORT, () => {
      console.log('\n🚀 RoadGuard API Server Started!');
      console.log('================================');
      console.log(`🌐 Environment: ${process.env['NODE_ENV'] || 'development'}`);
      console.log(`📡 Server running on: http://localhost:${PORT}`);
      console.log(`🗄️  Database: ${process.env['DB_NAME']} on ${process.env['DB_HOST']}:${process.env['DB_PORT']}`);
      console.log('================================\n');
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async () => {
        console.log('🔐 HTTP server closed.');
        
        try {
          await sequelize.close();
          console.log('🗄️  Database connection closed.');
          console.log('✅ Graceful shutdown completed.');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });
    };

    // Listen for shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
