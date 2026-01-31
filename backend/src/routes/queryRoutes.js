/**
 * Query Routes
 * 
 * API endpoints for SQL query execution and management
 */

const express = require('express');
const router = express.Router();
const queryService = require('../services/queryService');
const logger = require('../utils/logger');

/**
 * POST /api/query/execute
 * Execute SQL query
 */
router.post('/execute', async (req, res) => {
  try {
    const { sql, catalog, schema } = req.body;

    if (!sql || sql.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'SQL query is required'
      });
    }

    logger.info('Executing query', { 
      catalog: catalog || 'iceberg_data',
      schema: schema || 'default',
      sqlLength: sql.length
    });

    const results = await queryService.executeQuery(
      sql,
      catalog || 'iceberg_data',
      schema || 'default'
    );

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Query execution failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/query/status/:queryId
 * Get query status
 */
router.get('/status/:queryId', async (req, res) => {
  try {
    const { queryId } = req.params;

    const status = await queryService.getQueryStatus(queryId);

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Failed to get query status', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/query/cancel/:queryId
 * Cancel running query
 */
router.delete('/cancel/:queryId', async (req, res) => {
  try {
    const { queryId } = req.params;

    const result = await queryService.cancelQuery(queryId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Failed to cancel query', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/query/catalogs
 * List available catalogs
 */
router.get('/catalogs', async (req, res) => {
  try {
    const catalogs = await queryService.listCatalogs();

    res.json({
      success: true,
      data: catalogs
    });
  } catch (error) {
    logger.error('Failed to list catalogs', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/query/catalogs/:catalog/schemas
 * List schemas in a catalog
 */
router.get('/catalogs/:catalog/schemas', async (req, res) => {
  try {
    const { catalog } = req.params;

    const schemas = await queryService.listSchemas(catalog);

    res.json({
      success: true,
      data: schemas
    });
  } catch (error) {
    logger.error('Failed to list schemas', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/query/catalogs/:catalog/schemas/:schema/tables
 * List tables in a schema
 */
router.get('/catalogs/:catalog/schemas/:schema/tables', async (req, res) => {
  try {
    const { catalog, schema } = req.params;

    const tables = await queryService.listTables(catalog, schema);

    res.json({
      success: true,
      data: tables
    });
  } catch (error) {
    logger.error('Failed to list tables', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/query/catalogs/:catalog/schemas/:schema/tables/:table
 * Get table schema
 */
router.get('/catalogs/:catalog/schemas/:schema/tables/:table', async (req, res) => {
  try {
    const { catalog, schema, table } = req.params;

    const tableSchema = await queryService.getTableSchema(catalog, schema, table);

    res.json({
      success: true,
      data: tableSchema
    });
  } catch (error) {
    logger.error('Failed to get table schema', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/query/history
 * Get query history
 */
router.get('/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const history = queryService.getHistory(limit);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error('Failed to get query history', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/query/history
 * Clear query history
 */
router.delete('/history', (req, res) => {
  try {
    queryService.clearHistory();

    res.json({
      success: true,
      message: 'Query history cleared'
    });
  } catch (error) {
    logger.error('Failed to clear query history', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/query/export
 * Export query results
 */
router.post('/export', (req, res) => {
  try {
    const { columns, rows, format } = req.body;

    if (!columns || !rows) {
      return res.status(400).json({
        success: false,
        error: 'Columns and rows are required'
      });
    }

    let exportData;
    let contentType;
    let filename;

    if (format === 'json') {
      exportData = queryService.exportToJSON(columns, rows);
      contentType = 'application/json';
      filename = `query_results_${Date.now()}.json`;
    } else {
      // Default to CSV
      exportData = queryService.exportToCSV(columns, rows);
      contentType = 'text/csv';
      filename = `query_results_${Date.now()}.csv`;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportData);
  } catch (error) {
    logger.error('Failed to export results', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

// Made with Bob