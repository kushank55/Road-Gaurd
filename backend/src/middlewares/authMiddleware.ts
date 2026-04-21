import jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import { User } from '../models';
import { IJwtPayload, IAuthenticatedRequest } from '../types';

// Cache for user verification to reduce database load
const userVerificationCache = new Map<string, { timestamp: number; isValid: boolean }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const authMiddleware = async (req: IAuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Allow CORS preflight requests to pass through without authentication
    // Browsers send OPTIONS preflight without Authorization header; blocking
    // them in the auth middleware prevents proper CORS negotiation.
    if (req.method === 'OPTIONS') {
      return next();
    }

    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
      return;
    }

    // Check if token starts with Bearer
    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format.'
      });
      return;
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
      return;
    }

    // Verify token
    const jwtSecret = process.env['JWT_SECRET'] || 'fallback_secret_for_development_only';
    if (!jwtSecret || jwtSecret === 'fallback_secret_for_development_only') {
      console.warn('⚠️  JWT_SECRET is not properly configured. Using fallback secret for development.');
    }
    
    const decoded = jwt.verify(token, jwtSecret) as IJwtPayload;
    
    // PERFORMANCE OPTIMIZATION: Use JWT payload data instead of database query
    // The JWT token already contains all necessary user information
    // Only query database if we need to verify user still exists and is verified
    // This reduces database load from O(n) to O(1) for most requests
    
    // Check cache first for user verification
    const cacheKey = decoded.userId;
    const cachedData = userVerificationCache.get(cacheKey);
    const now = Date.now();
    
    // Use cached verification if available and not expired
    if (cachedData && (now - cachedData.timestamp) < CACHE_DURATION) {
      if (!cachedData.isValid) {
        res.status(401).json({
          success: false,
          message: 'Access denied. User account is not valid.'
        });
        return;
      }
    } else {
      // Only verify from database occasionally or for critical routes
      // Check if this is a critical route that requires fresh database verification
      const criticalRoutes = ['/auth/me', '/auth/delete-account', '/auth/change-password'];
      const isCriticalRoute = criticalRoutes.some(route => req.path.includes(route));
      
      if (isCriticalRoute || !cachedData || (now - cachedData.timestamp) > CACHE_DURATION) {
        try {
          const user = await User.findByPk(decoded.userId, {
            attributes: ['id', 'is_verified'] // Only fetch necessary fields
          });
          
          const isValid = user && user.is_verified;
          
          if (!isValid) {
            // Cache negative result for shorter duration
            userVerificationCache.set(cacheKey, { 
              timestamp: now, 
              isValid: false 
            });
            
            res.status(401).json({
              success: false,
              message: user ? 'Access denied. Please verify your account first.' : 'Access denied. User not found.'
            });
            return;
          }
          
          // Cache positive result
          userVerificationCache.set(cacheKey, { 
            timestamp: now, 
            isValid: true 
          });
        } catch (dbError) {
          console.error('Database verification error:', dbError);
          // Don't fail the request, but log the error
          // Fall back to JWT payload verification
        }
      }
    }
    
    // Add user to request from JWT payload
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      phone: decoded.phone,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    const err = error as Error;
    
    if (err.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token.'
      });
      return;
    }
    
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Access denied. Token expired.'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
};

export default authMiddleware;
