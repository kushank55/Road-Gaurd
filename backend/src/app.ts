import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/authRoutes';
import workshopRoutes from './routes/workshopRoutes';
import serviceRequestRoutes from './routes/serviceRequestRoutes';
import quotationRoutes from './routes/quotationRoutes';
import workerRoutes from './routes/workerRoutes';
import uploadRoutes from './routes/uploadRoutes';

dotenv.config();

// Create Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
// Allow common dev origins (Vite, CRA) and any value provided in FRONTEND_URL.
// Use a dynamic origin callback so we can keep credentials: true and reflect the
// incoming origin when allowed.
const allowedOrigins = [
  process.env['FRONTEND_URL'],
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173'
].filter(Boolean);

// Debug logger for incoming Origin header on service-requests paths
app.use((req, _res, next) => {
  if (req.path.startsWith('/service-requests')) {
    console.log('Incoming request Origin header:', req.headers.origin);
    console.log('Request method:', req.method);
    console.log('Request path:', req.path);
  }
  next();
});

// CORS configuration: reflect origin when allowed. Be forgiving for local dev
// origins (localhost/127.0.0.1 and Vite default ports). This will ensure
// Access-Control-Allow-Origin is present on both preflight and actual responses
// for development environments.
app.use(cors({
  origin: (origin, callback) => {
    console.log('CORS check for origin:', origin);
    
    // Allow requests with no origin (curl, server-to-server, mobile apps)
    if (!origin) {
      console.log('No origin - allowing request');
      return callback(null, true);
    }

    // Allow explicit allowed origins
    if (allowedOrigins.includes(origin)) {
      console.log('Origin in allowed list - allowing request');
      return callback(null, true);
    }

    // Allow local host variants (ports, IPv4 loopback, and Vite dev host)
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin) || 
        /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin) || 
        origin.includes('5173') || 
        origin.includes('4173')) {
      console.log('Local development origin - allowing request');
      return callback(null, true);
    }

    // Allow Render deployed apps (any subdomain of onrender.com)
    if (origin.endsWith('.onrender.com')) {
      console.log('Render domain - allowing request');
      return callback(null, true);
    }

    // Otherwise deny
    console.log('Origin not allowed:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200
}));

// Rate limiting - More reasonable limits
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increase general limit to 500 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests from counting against limit for better UX
  skip: (req, res) => res.statusCode < 400
});

// Apply rate limiting to all routes
app.use(limiter);

// Stricter rate limiting for auth routes - but more reasonable
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Increase auth limit to 50 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Different limits for different auth endpoints
  keyGenerator: (req) => {
    // More lenient for general auth routes
    if (req.path === '/auth/me' || req.path === '/auth/logout') {
      return `${req.ip}-general-auth`;
    }
    // Stricter for login/signup
    return `${req.ip}-sensitive-auth`;
  }
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/', (_, res) => {
  res.status(200).json({
    success: true,
    message: 'RoadGuard API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env['NODE_ENV'] || 'development'
  });
});

// API Routes
app.use('/auth', authLimiter, authRoutes);
app.use('/workshops', workshopRoutes);
app.use('/service-requests', serviceRequestRoutes);
app.use('/quotations', quotationRoutes);
app.use('/workers', workerRoutes);
app.use('/upload', uploadRoutes);

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((error: Error, _: express.Request, res: express.Response, __: express.NextFunction) => {
  console.error('Global error handler:', error);
  
  // Default error status and message
  let status = 500;
  let message = 'Internal server error';

  const err = error as any;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation error';
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid data format';
  } else if (err.code === 11000) {
    status = 409;
    message = 'Duplicate data error';
  }

  // Send error response
  res.status(status).json({
    success: false,
    message,
    ...(process.env['NODE_ENV'] === 'development' && {
      error: error.message,
      stack: error.stack
    })
  });
});

// Graceful shutdown handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;
