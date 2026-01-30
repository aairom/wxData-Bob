/**
 * Authentication Service
 * 
 * Handles authentication with watsonx.data API including:
 * - Bearer token generation
 * - Token refresh
 * - Token validation
 */

const axios = require('axios');
const https = require('https');
const config = require('../config/watsonx.config');
const logger = require('../utils/logger');

class AuthService {
  constructor() {
    this.token = null;
    this.tokenExpiry = null;
    this.refreshTimer = null;
    
    // Create axios instance with SSL configuration
    this.axiosInstance = axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: config.watsonxData.ssl.rejectUnauthorized
      }),
      timeout: config.watsonxData.timeout
    });
  }

  /**
   * Generate a new bearer token
   * @returns {Promise<string>} Bearer token
   */
  async generateToken() {
    try {
      const url = `${config.watsonxData.baseUrl}${config.watsonxData.endpoints.auth}`;
      
      logger.info('Generating bearer token', { url });
      
      const response = await this.axiosInstance.post(url, {
        username: config.watsonxData.username,
        password: config.watsonxData.password,
        instance_id: config.watsonxData.instanceId,
        instance_name: config.watsonxData.instanceName
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.token) {
        this.token = response.data.token;
        
        // Set token expiry (default 1 hour if not provided)
        const expiryMs = response.data.expires_in 
          ? response.data.expires_in * 1000 
          : config.watsonxData.tokenRefresh.defaultExpiry;
        
        this.tokenExpiry = Date.now() + expiryMs;
        
        // Schedule token refresh
        this.scheduleTokenRefresh(expiryMs);
        
        logger.info('Bearer token generated successfully', {
          expiresIn: expiryMs / 1000 / 60 + ' minutes'
        });
        
        return this.token;
      } else {
        throw new Error('Invalid response from authentication endpoint');
      }
    } catch (error) {
      logger.error('Failed to generate bearer token', {
        error: error.message,
        response: error.response?.data
      });
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Get current valid token (generates new one if expired)
   * @returns {Promise<string>} Valid bearer token
   */
  async getToken() {
    if (!this.token || this.isTokenExpired()) {
      await this.generateToken();
    }
    return this.token;
  }

  /**
   * Check if current token is expired
   * @returns {boolean} True if token is expired
   */
  isTokenExpired() {
    if (!this.tokenExpiry) return true;
    return Date.now() >= this.tokenExpiry;
  }

  /**
   * Schedule automatic token refresh
   * @param {number} expiryMs Token expiry in milliseconds
   */
  scheduleTokenRefresh(expiryMs) {
    // Clear existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Schedule refresh before expiry
    const refreshTime = expiryMs - config.watsonxData.tokenRefresh.refreshBeforeExpiry;
    
    this.refreshTimer = setTimeout(async () => {
      try {
        logger.info('Auto-refreshing bearer token');
        await this.generateToken();
      } catch (error) {
        logger.error('Failed to auto-refresh token', { error: error.message });
      }
    }, refreshTime);
  }

  /**
   * Manually refresh the token
   * @returns {Promise<string>} New bearer token
   */
  async refreshToken() {
    logger.info('Manually refreshing bearer token');
    return await this.generateToken();
  }

  /**
   * Invalidate current token
   */
  invalidateToken() {
    this.token = null;
    this.tokenExpiry = null;
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    logger.info('Token invalidated');
  }

  /**
   * Get token info
   * @returns {Object} Token information
   */
  getTokenInfo() {
    return {
      hasToken: !!this.token,
      isExpired: this.isTokenExpired(),
      expiresAt: this.tokenExpiry ? new Date(this.tokenExpiry).toISOString() : null,
      expiresIn: this.tokenExpiry ? Math.max(0, this.tokenExpiry - Date.now()) : 0
    };
  }
}

// Export singleton instance
module.exports = new AuthService();

// Made with Bob
