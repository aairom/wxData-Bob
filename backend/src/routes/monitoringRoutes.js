/**
 * Monitoring Routes
 * 
 * API endpoints for system monitoring and metrics
 */

const express = require('express');
const router = express.Router();
const monitoringService = require('../services/monitoringService');
const logger = require('../utils/logger');

/**
 * GET /api/monitoring/metrics
 * Get current system metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = monitoringService.getMetrics();
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Error fetching metrics', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch metrics'
    });
  }
});

/**
 * GET /api/monitoring/dashboard
 * Get comprehensive dashboard data
 */
router.get('/dashboard', async (req, res) => {
  try {
    const dashboardData = await monitoringService.getDashboardData();
    
    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    logger.error('Error fetching dashboard data', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
});

/**
 * GET /api/monitoring/realtime
 * Get real-time metrics for streaming
 */
router.get('/realtime', (req, res) => {
  try {
    const realtimeMetrics = monitoringService.getRealTimeMetrics();
    
    res.json({
      success: true,
      data: realtimeMetrics
    });
  } catch (error) {
    logger.error('Error fetching real-time metrics', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch real-time metrics'
    });
  }
});

/**
 * GET /api/monitoring/health
 * Get watsonx.data health status
 */
router.get('/health', async (req, res) => {
  try {
    const health = await monitoringService.getWatsonxHealth();
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    logger.error('Error fetching health status', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch health status'
    });
  }
});

/**
 * POST /api/monitoring/reset
 * Reset metrics (admin only)
 */
router.post('/reset', (req, res) => {
  try {
    monitoringService.resetMetrics();
    
    logger.info('Metrics reset by user');
    
    res.json({
      success: true,
      message: 'Metrics reset successfully'
    });
  } catch (error) {
    logger.error('Error resetting metrics', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to reset metrics'
    });
  }
});

/**
 * GET /api/monitoring/system
 * Get system information
 */
router.get('/system', (req, res) => {
  try {
    const metrics = monitoringService.getMetrics();
    
    res.json({
      success: true,
      data: {
        system: metrics.system,
        uptime: metrics.uptime
      }
    });
  } catch (error) {
    logger.error('Error fetching system info', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system information'
    });
  }
});

module.exports = router;

// Made with Bob