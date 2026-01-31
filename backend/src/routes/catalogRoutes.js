/**
 * Catalog Routes
 * 
 * API endpoints for catalog management (CRUD operations)
 */

const express = require('express');
const router = express.Router();
const catalogService = require('../services/catalogService');
const logger = require('../utils/logger');

/**
 * GET /api/catalog
 * List all catalogs
 */
router.get('/', async (req, res) => {
  try {
    const catalogs = await catalogService.listCatalogs();

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
 * GET /api/catalog/:name
 * Get catalog details
 */
router.get('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const catalog = await catalogService.getCatalog(name);

    res.json({
      success: true,
      data: catalog
    });
  } catch (error) {
    logger.error('Failed to get catalog', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/catalog
 * Create new catalog
 */
router.post('/', async (req, res) => {
  try {
    const catalogData = req.body;

    if (!catalogData.name || !catalogData.type) {
      return res.status(400).json({
        success: false,
        error: 'Catalog name and type are required'
      });
    }

    const result = await catalogService.createCatalog(catalogData);

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Failed to create catalog', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PATCH /api/catalog/:name
 * Update catalog
 */
router.patch('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const updateData = req.body;

    const result = await catalogService.updateCatalog(name, updateData);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Failed to update catalog', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/catalog/:name
 * Delete catalog
 */
router.delete('/:name', async (req, res) => {
  try {
    const { name } = req.params;

    const result = await catalogService.deleteCatalog(name);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Failed to delete catalog', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/catalog/:name/stats
 * Get catalog statistics
 */
router.get('/:name/stats', async (req, res) => {
  try {
    const { name } = req.params;
    const stats = await catalogService.getCatalogStats(name);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get catalog stats', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/catalog/:name/tree
 * Get schema tree (hierarchical view)
 */
router.get('/:name/tree', async (req, res) => {
  try {
    const { name } = req.params;
    const tree = await catalogService.getSchemaTree(name);

    res.json({
      success: true,
      data: tree
    });
  } catch (error) {
    logger.error('Failed to get schema tree', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/catalog/:catalog/schema/:schema/table/:table/metadata
 * Get detailed table metadata
 */
router.get('/:catalog/schema/:schema/table/:table/metadata', async (req, res) => {
  try {
    const { catalog, schema, table } = req.params;
    const metadata = await catalogService.getTableMetadata(catalog, schema, table);

    res.json({
      success: true,
      data: metadata
    });
  } catch (error) {
    logger.error('Failed to get table metadata', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

// Made with Bob