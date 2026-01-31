/**
 * Query Service
 * 
 * Handles SQL query execution against watsonx.data
 */

const axios = require('axios');
const config = require('../config/watsonx.config');
const authService = require('./authService');
const logger = require('../utils/logger');

class QueryService {
  constructor() {
    this.queryHistory = [];
    this.maxHistorySize = 100;
  }

  /**
   * Execute SQL query
   */
  async executeQuery(sql, catalog = 'iceberg_data', schema = 'default') {
    try {
      const token = await authService.getToken();
      
      logger.info('Executing query', { 
        catalog, 
        schema, 
        sqlLength: sql.length 
      });

      const response = await axios.post(
        `${config.watsonxData.baseUrl}/lakehouse/api/v2/queries`,
        {
          catalog,
          schema,
          sql,
          engine: 'presto-01'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Authinstanceid': config.watsonxData.instanceId,
            'Content-Type': 'application/json'
          },
          httpsAgent: config.watsonxData.httpsAgent,
          timeout: 300000 // 5 minutes for long queries
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
        sql: sql.substring(0, 100)
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
  async pollQueryResults(queryId, token, maxAttempts = 60) {
    const startTime = Date.now();
    
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
        const waitTime = Math.min(1000 * Math.pow(1.5, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw error;
        }
      }
    }
    
    throw new Error('Query timeout: exceeded maximum polling attempts');
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
      const token = await authService.getToken();
      
      const response = await axios.get(
        `${config.watsonxData.baseUrl}/lakehouse/api/v2/catalogs/${catalog}/schemas`,
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
      logger.error('Failed to list schemas', { catalog, error: error.message });
      throw new Error(`Failed to list schemas: ${error.message}`);
    }
  }

  /**
   * List tables in a schema
   */
  async listTables(catalog, schema) {
    try {
      const token = await authService.getToken();
      
      const response = await axios.get(
        `${config.watsonxData.baseUrl}/lakehouse/api/v2/catalogs/${catalog}/schemas/${schema}/tables`,
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
      logger.error('Failed to list tables', { catalog, schema, error: error.message });
      throw new Error(`Failed to list tables: ${error.message}`);
    }
  }

  /**
   * Get table schema
   */
  async getTableSchema(catalog, schema, table) {
    try {
      const token = await authService.getToken();
      
      const response = await axios.get(
        `${config.watsonxData.baseUrl}/lakehouse/api/v2/catalogs/${catalog}/schemas/${schema}/tables/${table}`,
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
      logger.error('Failed to get table schema', { catalog, schema, table, error: error.message });
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