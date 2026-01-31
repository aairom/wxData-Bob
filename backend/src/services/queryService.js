/**
 * Query Service
 *
 * Handles SQL query execution against watsonx.data
 */

const axios = require('axios');
const config = require('../config/watsonx.config');
const authService = require('./authService');
const logger = require('../utils/logger');

// Constants for query polling
const MAX_POLL_ATTEMPTS = 60;
const INITIAL_POLL_DELAY_MS = 1000;
const BACKOFF_MULTIPLIER = 1.5;
const MAX_POLL_DELAY_MS = 5000;
const QUERY_TIMEOUT_MS = 300000; // 5 minutes
const MAX_HISTORY_SIZE = 100;
const DEFAULT_ENGINE = 'presto-01';

// Dangerous SQL patterns to block
const DANGEROUS_SQL_PATTERNS = [
  /DROP\s+DATABASE/i,
  /DROP\s+SCHEMA/i,
  /DROP\s+TABLE/i,
  /TRUNCATE\s+TABLE/i,
  /DELETE\s+FROM\s+\w+\s*;/i, // DELETE without WHERE
  /UPDATE\s+\w+\s+SET\s+.*\s*;/i, // UPDATE without WHERE
];

class QueryService {
  constructor() {
    this.queryHistory = [];
    this.maxHistorySize = MAX_HISTORY_SIZE;
  }

  /**
   * Validate SQL query for dangerous patterns
   */
  validateSQL(sql) {
    if (!sql || typeof sql !== 'string') {
      throw new Error('SQL query must be a non-empty string');
    }

    const trimmedSQL = sql.trim();
    if (trimmedSQL.length === 0) {
      throw new Error('SQL query cannot be empty');
    }

    // Check for dangerous patterns
    for (const pattern of DANGEROUS_SQL_PATTERNS) {
      if (pattern.test(trimmedSQL)) {
        throw new Error('Query contains potentially dangerous operations. Please contact an administrator for destructive operations.');
      }
    }

    return trimmedSQL;
  }

  /**
   * Validate identifier (catalog, schema, table names)
   */
  validateIdentifier(identifier, name = 'identifier') {
    if (!identifier || typeof identifier !== 'string') {
      throw new Error(`${name} must be a non-empty string`);
    }

    // Only allow alphanumeric, underscore, and hyphen
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validPattern.test(identifier)) {
      throw new Error(`${name} contains invalid characters. Only alphanumeric, underscore, and hyphen are allowed.`);
    }

    return identifier;
  }

  /**
   * Sanitize SQL for logging (truncate and remove sensitive data)
   */
  sanitizeSQLForLogging(sql) {
    if (!sql) return '';
    
    // Truncate long queries
    const maxLength = 200;
    let sanitized = sql.length > maxLength ? sql.substring(0, maxLength) + '...' : sql;
    
    // Mask potential sensitive data patterns
    sanitized = sanitized.replace(/password\s*=\s*['"][^'"]*['"]/gi, "password='***'");
    sanitized = sanitized.replace(/token\s*=\s*['"][^'"]*['"]/gi, "token='***'");
    
    return sanitized;
  }

  /**
   * Execute SQL query
   */
  async executeQuery(sql, catalog = 'iceberg_data', schema = 'default') {
    try {
      // Validate inputs
      const validatedSQL = this.validateSQL(sql);
      const validatedCatalog = this.validateIdentifier(catalog, 'catalog');
      const validatedSchema = this.validateIdentifier(schema, 'schema');
      
      const token = await authService.getToken();
      
      logger.info('Executing query', {
        catalog: validatedCatalog,
        schema: validatedSchema,
        sqlPreview: this.sanitizeSQLForLogging(validatedSQL)
      });

      const response = await axios.post(
        `${config.watsonxData.baseUrl}/lakehouse/api/v2/queries`,
        {
          catalog: validatedCatalog,
          schema: validatedSchema,
          sql: validatedSQL,
          engine: DEFAULT_ENGINE
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Authinstanceid': config.watsonxData.instanceId,
            'Content-Type': 'application/json'
          },
          httpsAgent: config.watsonxData.httpsAgent,
          timeout: QUERY_TIMEOUT_MS
        }
      );

      const queryId = response.data.query_id;
      
      // Poll for query results
      const results = await this.pollQueryResults(queryId, token);
      
      // Add to history
      this.addToHistory({
        id: queryId,
        sql,
        catalog,
        schema,
        timestamp: new Date().toISOString(),
        status: 'completed',
        rowCount: results.rows?.length || 0,
        executionTime: results.executionTime
      });

      return {
        queryId,
        ...results
      };
    } catch (error) {
      logger.error('Query execution failed', {
        error: error.message,
        sqlPreview: this.sanitizeSQLForLogging(sql)
      });
      
      // Add failed query to history
      this.addToHistory({
        id: Date.now().toString(),
        sql,
        catalog,
        schema,
        timestamp: new Date().toISOString(),
        status: 'failed',
        error: error.message
      });

      throw new Error(`Query execution failed: ${error.message}`);
    }
  }

  /**
   * Poll for query results
   */
  async pollQueryResults(queryId, token, maxAttempts = MAX_POLL_ATTEMPTS) {
    const startTime = Date.now();
    let lastError = null;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await axios.get(
          `${config.watsonxData.baseUrl}/lakehouse/api/v2/queries/${queryId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Authinstanceid': config.watsonxData.instanceId
            },
            httpsAgent: config.watsonxData.httpsAgent,
            timeout: 10000
          }
        );

        const status = response.data.status;
        
        if (status === 'completed') {
          const executionTime = Date.now() - startTime;
          return {
            columns: response.data.columns || [],
            rows: response.data.rows || [],
            rowCount: response.data.row_count || 0,
            executionTime,
            status: 'completed'
          };
        } else if (status === 'failed' || status === 'cancelled') {
          throw new Error(`Query ${status}: ${response.data.error || 'Unknown error'}`);
        }
        
        // Wait before next poll (exponential backoff)
        const waitTime = Math.min(INITIAL_POLL_DELAY_MS * Math.pow(BACKOFF_MULTIPLIER, attempt), MAX_POLL_DELAY_MS);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
      } catch (error) {
        lastError = error;
        
        // Log intermediate errors for debugging
        if (attempt < maxAttempts - 1) {
          logger.warn('Query polling error (will retry)', {
            queryId,
            attempt: attempt + 1,
            maxAttempts,
            error: error.message
          });
          
          // For API errors (non-network), fail immediately
          if (error.response && error.response.status >= 400 && error.response.status < 500) {
            throw error;
          }
        } else {
          // Last attempt, throw the error
          throw error;
        }
      }
    }
    
    throw new Error(`Query timeout: exceeded maximum polling attempts (${maxAttempts}). Last error: ${lastError?.message || 'Unknown'}`);
  }

  /**
   * Get query status
   */
  async getQueryStatus(queryId) {
    try {
      const token = await authService.getToken();
      
      const response = await axios.get(
        `${config.watsonxData.baseUrl}/lakehouse/api/v2/queries/${queryId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Authinstanceid': config.watsonxData.instanceId
          },
          httpsAgent: config.watsonxData.httpsAgent,
          timeout: 10000
        }
      );

      return {
        queryId,
        status: response.data.status,
        progress: response.data.progress,
        rowCount: response.data.row_count
      };
    } catch (error) {
      logger.error('Failed to get query status', { queryId, error: error.message });
      throw new Error(`Failed to get query status: ${error.message}`);
    }
  }

  /**
   * Cancel query
   */
  async cancelQuery(queryId) {
    try {
      const token = await authService.getToken();
      
      await axios.delete(
        `${config.watsonxData.baseUrl}/lakehouse/api/v2/queries/${queryId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Authinstanceid': config.watsonxData.instanceId
          },
          httpsAgent: config.watsonxData.httpsAgent,
          timeout: 10000
        }
      );

      logger.info('Query cancelled', { queryId });
      return { success: true, message: 'Query cancelled successfully' };
    } catch (error) {
      logger.error('Failed to cancel query', { queryId, error: error.message });
      throw new Error(`Failed to cancel query: ${error.message}`);
    }
  }

  /**
   * List available catalogs
   */
  async listCatalogs() {
    try {
      const token = await authService.getToken();
      
      const response = await axios.get(
        `${config.watsonxData.baseUrl}/lakehouse/api/v2/catalogs`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Authinstanceid': config.watsonxData.instanceId
          },
          httpsAgent: config.watsonxData.httpsAgent,
          timeout: 10000
        }
      );

      return response.data.catalogs || [];
    } catch (error) {
      logger.error('Failed to list catalogs', { error: error.message });
      throw new Error(`Failed to list catalogs: ${error.message}`);
    }
  }

  /**
   * List schemas in a catalog
   */
  async listSchemas(catalog) {
    try {
      const validatedCatalog = this.validateIdentifier(catalog, 'catalog');
      const token = await authService.getToken();
      
      const response = await axios.get(
        `${config.watsonxData.baseUrl}/lakehouse/api/v2/catalogs/${validatedCatalog}/schemas`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Authinstanceid': config.watsonxData.instanceId
          },
          httpsAgent: config.watsonxData.httpsAgent,
          timeout: 10000
        }
      );

      return response.data.schemas || [];
    } catch (error) {
      logger.error('Failed to list schemas', { catalog: this.validateIdentifier(catalog, 'catalog'), error: error.message });
      throw new Error(`Failed to list schemas: ${error.message}`);
    }
  }

  /**
   * List tables in a schema
   */
  async listTables(catalog, schema) {
    try {
      const validatedCatalog = this.validateIdentifier(catalog, 'catalog');
      const validatedSchema = this.validateIdentifier(schema, 'schema');
      const token = await authService.getToken();
      
      const response = await axios.get(
        `${config.watsonxData.baseUrl}/lakehouse/api/v2/catalogs/${validatedCatalog}/schemas/${validatedSchema}/tables`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Authinstanceid': config.watsonxData.instanceId
          },
          httpsAgent: config.watsonxData.httpsAgent,
          timeout: 10000
        }
      );

      return response.data.tables || [];
    } catch (error) {
      logger.error('Failed to list tables', {
        catalog: this.validateIdentifier(catalog, 'catalog'),
        schema: this.validateIdentifier(schema, 'schema'),
        error: error.message
      });
      throw new Error(`Failed to list tables: ${error.message}`);
    }
  }

  /**
   * Get table schema
   */
  async getTableSchema(catalog, schema, table) {
    try {
      const validatedCatalog = this.validateIdentifier(catalog, 'catalog');
      const validatedSchema = this.validateIdentifier(schema, 'schema');
      const validatedTable = this.validateIdentifier(table, 'table');
      const token = await authService.getToken();
      
      const response = await axios.get(
        `${config.watsonxData.baseUrl}/lakehouse/api/v2/catalogs/${validatedCatalog}/schemas/${validatedSchema}/tables/${validatedTable}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Authinstanceid': config.watsonxData.instanceId
          },
          httpsAgent: config.watsonxData.httpsAgent,
          timeout: 10000
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to get table schema', {
        catalog: this.validateIdentifier(catalog, 'catalog'),
        schema: this.validateIdentifier(schema, 'schema'),
        table: this.validateIdentifier(table, 'table'),
        error: error.message
      });
      throw new Error(`Failed to get table schema: ${error.message}`);
    }
  }

  /**
   * Add query to history
   */
  addToHistory(queryInfo) {
    this.queryHistory.unshift(queryInfo);
    
    // Keep only last N queries
    if (this.queryHistory.length > this.maxHistorySize) {
      this.queryHistory = this.queryHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Get query history
   */
  getHistory(limit = 50) {
    return this.queryHistory.slice(0, limit);
  }

  /**
   * Clear query history
   */
  clearHistory() {
    this.queryHistory = [];
    logger.info('Query history cleared');
  }

  /**
   * Export results to CSV
   */
  exportToCSV(columns, rows) {
    try {
      // Create CSV header
      const header = columns.map(col => col.name).join(',');
      
      // Create CSV rows
      const csvRows = rows.map(row => {
        return columns.map(col => {
          const value = row[col.name];
          // Escape quotes and wrap in quotes if contains comma
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',');
      });
      
      return [header, ...csvRows].join('\n');
    } catch (error) {
      logger.error('Failed to export to CSV', { error: error.message });
      throw new Error(`Failed to export to CSV: ${error.message}`);
    }
  }

  /**
   * Export results to JSON
   */
  exportToJSON(columns, rows) {
    try {
      return JSON.stringify(rows, null, 2);
    } catch (error) {
      logger.error('Failed to export to JSON', { error: error.message });
      throw new Error(`Failed to export to JSON: ${error.message}`);
    }
  }
}

// Export singleton instance
module.exports = new QueryService();

// Made with Bob