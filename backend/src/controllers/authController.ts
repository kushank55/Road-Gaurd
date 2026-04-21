import jwt, { SignOptions } from 'jsonwebtoken';
import { Request, Response } from 'express';
import { Op, Transaction } from 'sequelize';
import { User, Otp, Worker, Workshop } from '../models';
import { ICreateUser, ILoginUser, IAuthenticatedRequest, IJwtPayload, UserRole } from '../types';
import { sendOtpEmail } from '../services/emailService';
import { sequelize } from '../config/db';

// Generate JWT Token
const generateToken = (user: User): string => {
  const payload: IJwtPayload = {
    userId: user.id,
    email: user.email,
    phone: user.phone,
    role: user.role
  };

  const secret = process.env['JWT_SECRET'] || 'fallback_secret_for_development_only';
  if (!secret || secret === 'fallback_secret_for_development_only') {
    console.warn('⚠️  JWT_SECRET is not properly configured. Using fallback secret for development.');
  }
  
  return jwt.sign(payload, secret, { expiresIn: '7d' });
};

// Send OTP via email
const sendOtp = async (phone: string, email: string, otpCode: string, userName: string): Promise<void> => {
  const expiryMinutes = parseInt(process.env['OTP_EXPIRY_MINUTES'] || '5', 10);
  
  // Send email OTP
  const emailSent = await sendOtpEmail(email, userName, otpCode, expiryMinutes);
  
  if (emailSent) {
    console.log(`📧 OTP email sent successfully to ${email}`);
  } else {
    console.error(`❌ Failed to send OTP email to ${email}`);
  }
  
  // For now, still log to console for phone (you can integrate SMS service later)
  console.log('\n📱 OTP NOTIFICATION:');
  console.log('====================');
  console.log(`📧 Email: ${email}`);
  console.log(`📱 Phone: ${phone}`);
  console.log(`🔐 OTP Code: ${otpCode}`);
  console.log(`⏰ Valid for: ${expiryMinutes} minutes`);
  console.log('====================\n');
};

// POST /auth/request-email-verification - Step 1: Request email verification before signup
const requestEmailVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name } = req.body;

    // Validate required fields
    if (!email || !name) {
      res.status(400).json({
        success: false,
        message: 'Email and name are required.'
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Invalid email format.'
      });
      return;
    }

    // OPTIMIZATION: Combined query to check existing user and clean up OTPs in one transaction
    const transaction = await sequelize.transaction();
    
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        where: { email },
        attributes: ['id'], // Only fetch id to minimize data transfer
        transaction
      });

      if (existingUser) {
        await transaction.rollback();
        res.status(409).json({
          success: false,
          message: 'User with this email already exists.'
        });
        return;
      }

      // Delete any existing verification OTPs for this email (cleanup)
      await Otp.destroy({
        where: {
          email,
          purpose: 'EMAIL_VERIFICATION',
          is_used: false
        },
        transaction
      });

      // Generate OTP
      const otpCode = Otp.generateOtpCode();
      const expiresAt = Otp.getExpiryTime(parseInt(process.env['OTP_EXPIRY_MINUTES'] || '5', 10));

      // Store OTP in database (without user_id since user doesn't exist yet)
      await Otp.create({
        user_id: null, // No user yet
        email,
        otp_code: otpCode,
        purpose: 'EMAIL_VERIFICATION',
        expires_at: expiresAt,
        is_used: false
      }, { transaction });

      // Commit transaction
      await transaction.commit();

      // Send OTP via email (async, don't wait for it)
      const expiryMinutes = parseInt(process.env['OTP_EXPIRY_MINUTES'] || '5', 10);
      sendOtpEmail(email, name, otpCode, expiryMinutes).then(emailSent => {
        if (emailSent) {
          console.log(`📧 Email verification OTP sent to ${email}`);
        } else {
          console.error(`❌ Failed to send email verification OTP to ${email}`);
        }
      }).catch(err => {
        console.error('Email sending error:', err);
      });

      res.status(200).json({
        success: true,
        message: 'Email verification OTP sent successfully. Please check your email and verify your email address.',
        data: {
          email,
          name
        }
      });

    } catch (transactionError) {
      await transaction.rollback();
      throw transactionError;
    }

  } catch (error) {
    console.error('Request email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during email verification request.'
    });
  }
};

// POST /auth/verify-email - Step 2: Verify email with OTP
const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otpCode, otp } = req.body;
    
    // Accept both 'otp' and 'otpCode' for flexibility
    const finalOtpCode = otpCode || otp;

    // Validate required fields
    if (!email || !finalOtpCode) {
      res.status(400).json({
        success: false,
        message: 'Email and OTP code are required.'
      });
      return;
    }

    // Find valid OTP for email verification
    const otpRecord = await Otp.findOne({
      where: {
        email,
        otp_code: finalOtpCode,
        purpose: 'EMAIL_VERIFICATION',
        is_used: false
      }
    });

    if (!otpRecord) {
      res.status(400).json({
        success: false,
        message: 'Invalid OTP code.'
      });
      return;
    }

    // Check if OTP is expired
    if (otpRecord.isExpired()) {
      await otpRecord.destroy();
      res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
      return;
    }

    // Mark OTP as used (keep it for signup verification)
    await otpRecord.update({ is_used: true });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now proceed with registration.',
      data: {
        email,
        is_email_verified: true
      }
    });

  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during email verification.'
    });
  }
};

// POST /auth/resend-email-verification - Resend email verification OTP
const resendEmailVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name } = req.body;

    // Validate required fields
    if (!email || !name) {
      res.status(400).json({
        success: false,
        message: 'Email and name are required.'
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email }
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'User with this email already exists.'
      });
      return;
    }

    // Delete existing OTPs
    await Otp.destroy({
      where: {
        email,
        purpose: 'EMAIL_VERIFICATION'
      }
    });

    // Generate new OTP
    const otpCode = Otp.generateOtpCode();
    const expiresAt = Otp.getExpiryTime(parseInt(process.env['OTP_EXPIRY_MINUTES'] || '5', 10));

    // Store new OTP
    await Otp.create({
      user_id: null,
      email,
      otp_code: otpCode,
      purpose: 'EMAIL_VERIFICATION',
      expires_at: expiresAt,
      is_used: false
    });

    // Send OTP
    const expiryMinutes = parseInt(process.env['OTP_EXPIRY_MINUTES'] || '5', 10);
    await sendOtpEmail(email, name, otpCode, expiryMinutes);

    res.status(200).json({
      success: true,
      message: 'Email verification OTP resent successfully.',
      data: {
        email,
        name
      }
    });

  } catch (error) {
    console.error('Resend email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during resending email verification.'
    });
  }
};

// POST /auth/signup - Step 3: Register user (requires email verification)
const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, password, role, workshop_id }: ICreateUser & { workshop_id?: string } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      res.status(400).json({
        success: false,
        message: 'Name, email, phone, and password are required.'
      });
      return;
    }

    // Validate role
    const validRoles = Object.values(UserRole);
    if (role && !validRoles.includes(role)) {
      res.status(400).json({
        success: false,
        message: 'Invalid role specified.'
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email },
          { phone }
        ]
      }
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'User with this email or phone already exists.'
      });
      return;
    }

    // CRITICAL: Check if email has been verified
    const verifiedEmailOtp = await Otp.findOne({
      where: {
        email,
        purpose: 'EMAIL_VERIFICATION',
        is_used: true // Must be used (verified)
      }
    });

    if (!verifiedEmailOtp) {
      res.status(400).json({
        success: false,
        message: 'Please verify your email address before registering. Use /auth/request-email-verification first.'
      });
      return;
    }

    // For mechanics, validate workshop selection
    if ((role === UserRole.MECHANIC_EMPLOYEE || role === UserRole.MECHANIC_OWNER) && !workshop_id) {
      res.status(400).json({
        success: false,
        message: 'Workshop selection is required for mechanics.'
      });
      return;
    }

    // If workshop_id is provided, verify the workshop exists
    if (workshop_id) {
      const workshop = await Workshop.findByPk(workshop_id);
      if (!workshop) {
        res.status(400).json({
          success: false,
          message: 'Selected workshop not found.'
        });
        return;
      }
    }

    // Use database transaction to ensure atomicity
    const transaction = await sequelize.transaction();

    try {
      // Create user with is_verified = true (since email is already verified)
      const user = await User.create({
        name,
        email,
        phone,
        password,
        role: role || UserRole.USER,
        is_verified: true // User is verified since email was verified
      }, { transaction });

      // If user is a mechanic and workshop is selected, create worker record
      let workerData = null;
      if ((role === UserRole.MECHANIC_EMPLOYEE || role === UserRole.MECHANIC_OWNER) && workshop_id) {
        try {
          const worker = await Worker.create({
            workshop_id,
            user_id: user.id,
            name: user.name,
            phone: user.phone,
            email: user.email,
            specialization: [], // Empty array, can be updated later
            is_available: true,
            current_location_latitude: null,
            current_location_longitude: null
          }, { transaction });

          // Include worker data in response
          workerData = {
            id: worker.id,
            workshop_id: worker.workshop_id,
            specialization: worker.specialization,
            is_available: worker.is_available
          };

          console.log(`✅ Worker created successfully: ${worker.id} for user ${user.id} in workshop ${workshop_id}`);
        } catch (workerError) {
          console.error('❌ Failed to create worker record:', workerError);
          throw new Error('Failed to create worker profile');
        }
      }

      // Clean up verification OTP (no longer needed)
      await Otp.destroy({
        where: {
          email,
          purpose: 'EMAIL_VERIFICATION'
        },
        transaction
      });

      // Commit transaction
      await transaction.commit();

      // Generate JWT token immediately
      const token = generateToken(user);

      console.log(`✅ User registered successfully: ${user.email} with role ${user.role}${workshop_id ? ` in workshop ${workshop_id}` : ''}`);

      const responseData: any = {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          is_verified: user.is_verified
        }
      };

      // Include worker data if user is a mechanic
      if (workerData) {
        responseData.worker = workerData;
      }

      res.status(201).json({
        success: true,
        message: 'User registered successfully.',
        data: responseData
      });

    } catch (transactionError) {
      // Rollback transaction on error
      await transaction.rollback();
      throw transactionError;
    }

  } catch (error) {
    console.error('Signup error:', error);
    
    const err = error as any;
    
    if (err.name === 'SequelizeValidationError') {
      res.status(400).json({
        success: false,
        message: 'Validation error.',
        errors: err.errors.map((e: any) => ({
          field: e.path,
          message: e.message
        }))
      });
      return;
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
      res.status(409).json({
        success: false,
        message: 'Email or phone already exists.'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during signup.'
    });
  }
};

// POST /auth/verify-otp
const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, otpCode }: { identifier: string; otpCode: string } = req.body;

    // Validate required fields
    if (!identifier || !otpCode) {
      res.status(400).json({
        success: false,
        message: 'Email/phone and OTP code are required.'
      });
      return;
    }

    // Find user by email or phone
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: identifier },
          { phone: identifier }
        ]
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found.'
      });
      return;
    }

    // Find valid OTP
    const otp = await Otp.findOne({
      where: {
        user_id: user.id,
        otp_code: otpCode,
        is_used: false
      }
    });

    if (!otp) {
      res.status(400).json({
        success: false,
        message: 'Invalid OTP code.'
      });
      return;
    }

    // Check if OTP is expired
    if (otp.isExpired()) {
      // Delete expired OTP
      await otp.destroy();
      res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
      return;
    }

    // Mark user as verified
    await user.update({ is_verified: true });

    // Mark OTP as used
    await otp.update({ is_used: true });

    // Generate JWT token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Account verified successfully.',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          is_verified: true
        }
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during OTP verification.'
    });
  }
};

// POST /auth/login
const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password }: ILoginUser = req.body;

    // Validate required fields
    if (!identifier || !password) {
      res.status(400).json({
        success: false,
        message: 'Email/phone and password are required.'
      });
      return;
    }

    // OPTIMIZATION: Single query to find user by email or phone with only necessary fields
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: identifier },
          { phone: identifier }
        ]
      },
      attributes: ['id', 'name', 'email', 'phone', 'password', 'role', 'is_verified'] // Only fetch necessary fields
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
      return;
    }

    // Verify password
    const isPasswordValid = await user.checkPassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
      return;
    }

    // Check if user is verified
    if (!user.is_verified) {
      res.status(401).json({
        success: false,
        message: 'Please verify your account first.'
      });
      return;
    }

    // Generate JWT token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          is_verified: user.is_verified
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login.'
    });
  }
};

// GET /auth/me (protected route)
const getMe = async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // User info is already attached to req.user by authMiddleware
    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully.',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching user profile.'
    });
  }
};

// POST /auth/resend-otp
const resendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier }: { identifier: string } = req.body;

    // Validate required fields
    if (!identifier) {
      res.status(400).json({
        success: false,
        message: 'Email/phone is required.'
      });
      return;
    }

    // Find user by email or phone
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: identifier },
          { phone: identifier }
        ]
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found.'
      });
      return;
    }

    // Check if user is already verified
    if (user.is_verified) {
      res.status(400).json({
        success: false,
        message: 'User is already verified.'
      });
      return;
    }

    // Delete any existing unused OTPs for this user
    await Otp.destroy({
      where: {
        user_id: user.id,
        is_used: false
      }
    });

    // Generate new OTP
    const otpCode = Otp.generateOtpCode();
    const expiresAt = Otp.getExpiryTime(parseInt(process.env['OTP_EXPIRY_MINUTES'] || '5', 10));

    // Store new OTP in database
    await Otp.create({
      user_id: user.id,
      email: user.email,
      otp_code: otpCode,
      purpose: 'VERIFICATION',
      expires_at: expiresAt,
      is_used: false
    });

    // Send new OTP via email
    await sendOtp(user.phone, user.email, otpCode, user.name);

    res.status(200).json({
      success: true,
      message: 'New OTP sent successfully to your email and phone.'
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while resending OTP.'
    });
  }
};

// POST /auth/logout
const logout = async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // In a stateless JWT system, we don't need to do anything on the server side
    // The client should remove the token from storage
    // However, we can implement a blacklist if needed for security
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during logout.'
    });
  }
};

export {
  requestEmailVerification,
  verifyEmail,
  resendEmailVerification,
  signup,
  verifyOtp,
  login,
  getMe,
  resendOtp,
  logout
};
