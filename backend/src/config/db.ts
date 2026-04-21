import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Check if DATABASE_URL is provided (for Render deployment)
const databaseUrl = process.env['DATABASE_URL'];

let sequelize: Sequelize;

if (databaseUrl) {
  // Use DATABASE_URL if provided (Render deployment)
  sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Render requires this
      },
    },
    logging: process.env['NODE_ENV'] === 'development' ? console.log : false,
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 10000,
      evict: 1000,
    },
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true,
    },
    benchmark: process.env['NODE_ENV'] === 'development',
    retry: {
      match: [/SequelizeConnectionError/],
      max: 3,
    },
  });
} else {
  // Use individual environment variables (local development)
  sequelize = new Sequelize(
    process.env['DB_NAME']!,
    process.env['DB_USER']!,
    process.env['DB_PASSWORD']!,
    {
      host: process.env['DB_HOST']!,
      port: parseInt(process.env['DB_PORT']!, 10),
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false, // Render requires this
        },
      },
      logging: process.env['NODE_ENV'] === 'development' ? console.log : false,
      pool: {
        max: 20,
        min: 5,
        acquire: 60000,
        idle: 10000,
        evict: 1000,
      },
      define: {
        timestamps: true,
        underscored: false,
        freezeTableName: true,
      },
      benchmark: process.env['NODE_ENV'] === 'development',
      retry: {
        match: [/SequelizeConnectionError/],
        max: 3,
      },
    }
  );
}


// Test the connection
const testConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', (error as Error).message);
    process.exit(1);
  }
};

export { sequelize, testConnection };
