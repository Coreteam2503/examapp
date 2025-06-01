const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authController = {
  async register(req, res) {
    try {
      const { email, password, first_name, last_name, role } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const userData = {
        email,
        password: hashedPassword,
        first_name,
        last_name,
        role
      };

      const user = await User.create(userData);

      // Remove password from response
      const { password: _, ...userResponse } = user;

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: userResponse
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during registration'
      });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check if user is active
      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated. Please contact support.'
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET || 'your-super-secret-jwt-key',
        { expiresIn: '24h' }
      );

      // Remove password from response
      const { password: _, ...userResponse } = user;

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          token,
          expiresIn: '24h'
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during login'
      });
    }
  },

  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Remove password from response
      const { password: _, ...userResponse } = user;

      res.json({
        success: true,
        data: {
          user: userResponse
        }
      });

    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  async refreshToken(req, res) {
    try {
      const user = await User.findById(req.user.userId);
      
      if (!user || !user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'User not found or inactive'
        });
      }

      // Generate new JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET || 'your-super-secret-jwt-key',
        { expiresIn: '24h' }
      );

      // Remove password from response
      const { password: _, ...userResponse } = user;

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          user: userResponse,
          token,
          expiresIn: '24h'
        }
      });

    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

module.exports = authController;
