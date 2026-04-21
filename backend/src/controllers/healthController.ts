import { Request, Response } from 'express';
import { sequelize } from '../config/db';

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  database: {
    status: 'connected' | 'disconnected';
    responseTime: number;
    activeConnections?: number;
    totalConnections?: number;
  };
  memory: {
    used: number;
    free: number;
    total: number;
  };
  uptime: number;
}

export const healthCheck = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    // Test database connectivity
    const dbStartTime = Date.now();
    await sequelize.authenticate();
    const dbResponseTime = Date.now() - dbStartTime;
    
    // Get database connection info
    let activeConnections = 0;
    let totalConnections = 0;
    
    try {
      const connectionInfo = await sequelize.query(`
        SELECT count(*) as active_connections 
        FROM pg_stat_activity 
        WHERE datname = current_database() AND state = 'active'
      `);
      activeConnections = parseInt((connectionInfo[0] as any)[0]?.active_connections || '0');
      
      const totalConnectionInfo = await sequelize.query(`
        SELECT count(*) as total_connections 
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);
      totalConnections = parseInt((totalConnectionInfo[0] as any)[0]?.total_connections || '0');
    } catch (connError) {
      console.warn('Could not fetch connection info:', connError);
    }
    
    // Get memory usage
    const memUsage = process.memoryUsage();
    
    const healthResult: HealthCheckResult = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        responseTime: dbResponseTime,
        activeConnections,
        totalConnections
      },
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        free: Math.round((memUsage.heapTotal - memUsage.heapUsed) / 1024 / 1024), // MB
        total: Math.round(memUsage.heapTotal / 1024 / 1024) // MB
      },
      uptime: Math.round(process.uptime())
    };
    
    // Determine if system is healthy
    const isHealthy = dbResponseTime < 1000 && 
                     memUsage.heapUsed / memUsage.heapTotal < 0.9 &&
                     activeConnections < 15;
    
    if (!isHealthy) {
      healthResult.status = 'unhealthy';
    }
    
    res.status(isHealthy ? 200 : 503).json({
      success: true,
      data: healthResult
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    const memUsage = process.memoryUsage();
    
    const healthResult: HealthCheckResult = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'disconnected',
        responseTime: Date.now() - startTime
      },
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024),
        free: Math.round((memUsage.heapTotal - memUsage.heapUsed) / 1024 / 1024),
        total: Math.round(memUsage.heapTotal / 1024 / 1024)
      },
      uptime: Math.round(process.uptime())
    };
    
    res.status(503).json({
      success: false,
      message: 'Health check failed',
      data: healthResult
    });
  }
};

// Database performance monitoring
export const databaseStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await sequelize.query(`
      SELECT 
        schemaname,
        tablename,
        seq_scan,
        seq_tup_read,
        idx_scan,
        idx_tup_fetch,
        n_tup_ins,
        n_tup_upd,
        n_tup_del
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY seq_tup_read DESC;
    `);
    
    const indexStats = await sequelize.query(`
      SELECT 
        schemaname,
        tablename,
        indexrelname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY idx_scan DESC;
    `);
    
    res.json({
      success: true,
      data: {
        tableStats: stats[0],
        indexStats: indexStats[0]
      }
    });
    
  } catch (error) {
    console.error('Database stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch database statistics'
    });
  }
};
