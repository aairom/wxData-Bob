/**
 * Authentication Routes
 * 
 * API routes for authentication operations
 */

const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const logger = require('../utils/logger');

/**
 * POST /api/auth/login
 * Generate bearer token
 */
router.post('/login', async (req, res) => {
  try {
    const token = await authService.generateToken();
    
    res.json({
      success: true,
      data: {
        token,
        tokenInfo: authService.getTokenInfo()
      }
    });
  } catch (error) {
    logger.error('Login failed', { error: error.message });
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh bearer token
 */
router.post('/refresh', async (req, res) => {
  try {
    const token = await authService.refreshToken();
    
    res.json({
      success: true,
      data: {
        token,
        tokenInfo: authService.getTokenInfo()
      }
    });
  } catch (error) {
    logger.error('Token refresh failed', { error: error.message });
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/auth/status
 * Get authentication status
 */
router.get('/status', (req, res) => {
  try {
    const tokenInfo = authService.getTokenInfo();
    
    res.json({
      success: true,
      data: tokenInfo
    });
  } catch (error) {
    logger.error('Error fetching auth status', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/auth/logout
 * Invalidate current token
 */
router.post('/logout', (req, res) => {
  try {
    authService.invalidateToken();
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

// Made with Bob
