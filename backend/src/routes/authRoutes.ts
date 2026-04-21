import express from 'express';
import { 
  requestEmailVerification, 
  verifyEmail, 
  resendEmailVerification, 
  signup, 
  verifyOtp, 
  login, 
  getMe, 
  resendOtp,
  logout
} from '../controllers/authController';
import authMiddleware from '../middlewares/authMiddleware';
import { testEmailConfiguration } from '../services/emailService';

const router = express.Router();

// Test email configuration route
router.get('/test-email', async (req, res) => {
  try {
    const isValid = await testEmailConfiguration();
    if (isValid) {
      res.status(200).json({
        success: true,
        message: 'Email configuration is valid and ready to use.'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Email configuration is invalid. Please check your environment variables.'
      });
    }
  } catch (error) {
    console.error('Email test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing email configuration.'
    });
  }
});

// Public routes - Pre-verification flow
router.post('/request-email-verification', requestEmailVerification);
router.post('/verify-email', verifyEmail);
router.post('/resend-email-verification', resendEmailVerification);
router.post('/signup', signup); // Now requires email verification

// Post-registration verification routes
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);

// Authentication routes
router.post('/login', login);

// Protected routes
router.get('/me', authMiddleware, getMe);
router.post('/logout', authMiddleware, logout);

// Public logout route (for client-side logout)
router.post('/logout-public', logout);

export default router;
