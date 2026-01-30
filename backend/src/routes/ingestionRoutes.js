/**
 * Ingestion Routes
 * 
 * API routes for data ingestion operations
 */

const express = require('express');
const router = express.Router();
const ingestionService = require('../services/ingestionService');
const logger = require('../utils/logger');

/**
 * POST /api/ingestion/jobs
 * Create a new ingestion job
 */
router.post('/jobs', async (req, res) => {
  try {
    // Validate configuration
    const validation = ingestionService.validateIngestionConfig(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }

    // Create ingestion job
    const result = await ingestionService.createIngestionJob(req.body);
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error creating ingestion job', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ingestion/jobs
 * List all ingestion jobs
 */
router.get('/jobs', async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      limit: req.query.limit || 50,
      offset: req.query.offset || 0
    };

    const jobs = await ingestionService.listJobs(filters);
    
    res.json({
      success: true,
      data: jobs
    });
  } catch (error) {
    logger.error('Error listing ingestion jobs', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ingestion/jobs/:jobId
 * Get ingestion job status
 */
router.get('/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const status = await ingestionService.getJobStatus(jobId);
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Error fetching job status', { 
      jobId: req.params.jobId,
      error: error.message 
    });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/ingestion/jobs/:jobId
 * Cancel an ingestion job
 */
router.delete('/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const result = await ingestionService.cancelJob(jobId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error cancelling job', { 
      jobId: req.params.jobId,
      error: error.message 
    });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ingestion/config/default
 * Get default ingestion configuration
 */
router.get('/config/default', (req, res) => {
  try {
    const defaultConfig = ingestionService.getDefaultConfig();
    
    res.json({
      success: true,
      data: defaultConfig
    });
  } catch (error) {
    logger.error('Error fetching default config', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ingestion/file-types
 * Get supported file types
 */
router.get('/file-types', (req, res) => {
  try {
    const fileTypes = ingestionService.getSupportedFileTypes();
    
    res.json({
      success: true,
      data: fileTypes
    });
  } catch (error) {
    logger.error('Error fetching file types', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ingestion/validate
 * Validate ingestion configuration
 */
router.post('/validate', (req, res) => {
  try {
    const validation = ingestionService.validateIngestionConfig(req.body);
    
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    logger.error('Error validating config', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

// Made with Bob
