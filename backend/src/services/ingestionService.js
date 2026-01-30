/**
 * Ingestion Service
 * 
 * Handles data ingestion operations with watsonx.data including:
 * - Creating ingestion jobs
 * - Monitoring job status
 * - Managing ingestion configurations
 */

const axios = require('axios');
const https = require('https');
const config = require('../config/watsonx.config');
const authService = require('./authService');
const logger = require('../utils/logger');

class IngestionService {
  constructor() {
    this.axiosInstance = axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: config.watsonxData.ssl.rejectUnauthorized
      }),
      timeout: config.watsonxData.timeout
    });
  }

  /**
   * Create a new ingestion job
   * @param {Object} jobConfig - Ingestion job configuration
   * @returns {Promise<Object>} Job creation response
   */
  async createIngestionJob(jobConfig) {
    try {
      const token = await authService.getToken();
      const url = `${config.watsonxData.baseUrl}${config.watsonxData.endpoints.ingestion}`;

      // Merge with default engine config
      const executeConfig = {
        ...config.watsonxData.defaultEngine,
        ...jobConfig.execute_config
      };

      const payload = {
        target: jobConfig.target,
        source: jobConfig.source,
        job_id: jobConfig.job_id || `ingestion-${Date.now()}`,
        engine_id: jobConfig.engine_id || config.watsonxData.defaultEngine.engineId,
        execute_config: {
          driver_memory: executeConfig.driverMemory,
          driver_cores: executeConfig.driverCores,
          executor_memory: executeConfig.executorMemory,
          executor_cores: executeConfig.executorCores,
          num_executors: executeConfig.numExecutors
        }
      };

      logger.info('Creating ingestion job', { jobId: payload.job_id });

      const response = await this.axiosInstance.post(url, payload, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Authinstanceid': config.watsonxData.instanceId
        }
      });

      logger.info('Ingestion job created successfully', {
        jobId: response.data.job_id,
        applicationId: response.data.application_id,
        status: response.data.status
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to create ingestion job', {
        error: error.message,
        response: error.response?.data
      });
      throw new Error(`Ingestion job creation failed: ${error.message}`);
    }
  }

  /**
   * Get ingestion job status
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} Job status
   */
  async getJobStatus(jobId) {
    try {
      const token = await authService.getToken();
      const url = `${config.watsonxData.baseUrl}${config.watsonxData.endpoints.ingestion}/${jobId}`;

      logger.info('Fetching job status', { jobId });

      const response = await this.axiosInstance.get(url, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Authinstanceid': config.watsonxData.instanceId
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to fetch job status', {
        jobId,
        error: error.message
      });
      throw new Error(`Failed to get job status: ${error.message}`);
    }
  }

  /**
   * List all ingestion jobs
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of jobs
   */
  async listJobs(filters = {}) {
    try {
      const token = await authService.getToken();
      const url = `${config.watsonxData.baseUrl}${config.watsonxData.endpoints.ingestion}`;

      logger.info('Listing ingestion jobs', { filters });

      const response = await this.axiosInstance.get(url, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Authinstanceid': config.watsonxData.instanceId
        },
        params: filters
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to list jobs', {
        error: error.message
      });
      throw new Error(`Failed to list jobs: ${error.message}`);
    }
  }

  /**
   * Cancel an ingestion job
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} Cancellation response
   */
  async cancelJob(jobId) {
    try {
      const token = await authService.getToken();
      const url = `${config.watsonxData.baseUrl}${config.watsonxData.endpoints.ingestion}/${jobId}`;

      logger.info('Cancelling ingestion job', { jobId });

      const response = await this.axiosInstance.delete(url, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Authinstanceid': config.watsonxData.instanceId
        }
      });

      logger.info('Job cancelled successfully', { jobId });

      return response.data;
    } catch (error) {
      logger.error('Failed to cancel job', {
        jobId,
        error: error.message
      });
      throw new Error(`Failed to cancel job: ${error.message}`);
    }
  }

  /**
   * Validate ingestion configuration
   * @param {Object} config - Ingestion configuration
   * @returns {Object} Validation result
   */
  validateIngestionConfig(config) {
    const errors = [];

    // Validate target
    if (!config.target) {
      errors.push('Target configuration is required');
    } else {
      if (!config.target.catalog) errors.push('Target catalog is required');
      if (!config.target.schema) errors.push('Target schema is required');
      if (!config.target.table) errors.push('Target table is required');
    }

    // Validate source
    if (!config.source) {
      errors.push('Source configuration is required');
    } else {
      if (!config.source.file_paths) errors.push('Source file paths are required');
      if (!config.source.file_type) errors.push('Source file type is required');
      
      const validFileTypes = ['json', 'csv', 'parquet', 'avro', 'orc'];
      if (config.source.file_type && !validFileTypes.includes(config.source.file_type.toLowerCase())) {
        errors.push(`Invalid file type. Must be one of: ${validFileTypes.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get supported file types
   * @returns {Array<string>} List of supported file types
   */
  getSupportedFileTypes() {
    return ['json', 'csv', 'parquet', 'avro', 'orc'];
  }

  /**
   * Get default ingestion configuration
   * @returns {Object} Default configuration
   */
  getDefaultConfig() {
    return {
      engine_id: config.watsonxData.defaultEngine.engineId,
      execute_config: {
        driver_memory: config.watsonxData.defaultEngine.driverMemory,
        driver_cores: config.watsonxData.defaultEngine.driverCores,
        executor_memory: config.watsonxData.defaultEngine.executorMemory,
        executor_cores: config.watsonxData.defaultEngine.executorCores,
        num_executors: config.watsonxData.defaultEngine.numExecutors
      },
      bucket_details: {
        bucket_name: config.watsonxData.defaultBucket.bucketName,
        bucket_type: config.watsonxData.defaultBucket.bucketType
      }
    };
  }
}

module.exports = new IngestionService();

// Made with Bob
