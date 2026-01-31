/**
 * Catalog Service
 * 
 * Handles catalog management operations (CRUD) for watsonx.data
 */

const axios = require('axios');
const config = require('../config/watsonx.config');
const authService = require('./authService');
const logger = require('../utils/logger');

class CatalogService {
  /**
   * Validate catalog name
   */
  validateCatalogName(name) {
    if (!name || typeof name !== 'string') {
      throw new Error('Catalog name must be a non-empty string');
    }

    const validPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validPattern.test(name)) {
      throw new Error('Catalog name contains invalid characters. Only alphanumeric, underscore, and hyphen are allowed.');
    }

    return name;
  }

  /**
   * List all catalogs
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
   * Get catalog details
   */
  async getCatalog(catalogName) {
    try {
      const validatedName = this.validateCatalogName(catalogName);
      const token = await authService.getToken();
      
      const response = await axios.get(
        `${config.watsonxData.baseUrl}/lakehouse/api/v2/catalogs/${validatedName}`,
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
      logger.error('Failed to get catalog', { catalogName, error: error.message });
      throw new Error(`Failed to get catalog: ${error.message}`);
    }
  }

  /**
   * Create new catalog
   */
  async createCatalog(catalogData) {
    try {
      const { name, type, description, properties } = catalogData;
      
      if (!name || !type) {
        throw new Error('Catalog name and type are required');
      }

      const validatedName = this.validateCatalogName(name);
      const token = await authService.getToken();
      
      logger.info('Creating catalog', { name: validatedName, type });

      const response = await axios.post(
        `${config.watsonxData.baseUrl}/lakehouse/api/v2/catalogs`,
        {
          name: validatedName,
          type,
          description: description || '',
          properties: properties || {}
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Authinstanceid': config.watsonxData.instanceId,
            'Content-Type': 'application/json'
          },
          httpsAgent: config.watsonxData.httpsAgent,
          timeout: 30000
        }
      );

      logger.info('Catalog created successfully', { name: validatedName });
      return response.data;
    } catch (error) {
      logger.error('Failed to create catalog', { error: error.message });
      throw new Error(`Failed to create catalog: ${error.message}`);
    }
  }

  /**
   * Update catalog
   */
  async updateCatalog(catalogName, updateData) {
    try {
      const validatedName = this.validateCatalogName(catalogName);
      const token = await authService.getToken();
      
      logger.info('Updating catalog', { name: validatedName });

      const response = await axios.patch(
        `${config.watsonxData.baseUrl}/lakehouse/api/v2/catalogs/${validatedName}`,
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Authinstanceid': config.watsonxData.instanceId,
            'Content-Type': 'application/json'
          },
          httpsAgent: config.watsonxData.httpsAgent,
          timeout: 30000
        }
      );

      logger.info('Catalog updated successfully', { name: validatedName });
      return response.data;
    } catch (error) {
      logger.error('Failed to update catalog', { catalogName, error: error.message });
      throw new Error(`Failed to update catalog: ${error.message}`);
    }
  }

  /**
   * Delete catalog
   */
  async deleteCatalog(catalogName) {
    try {
      const validatedName = this.validateCatalogName(catalogName);
      const token = await authService.getToken();
      
      logger.info('Deleting catalog', { name: validatedName });

      await axios.delete(
        `${config.watsonxData.baseUrl}/lakehouse/api/v2/catalogs/${validatedName}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Authinstanceid': config.watsonxData.instanceId
          },
          httpsAgent: config.watsonxData.httpsAgent,
          timeout: 30000
        }
      );

      logger.info('Catalog deleted successfully', { name: validatedName });
      return { success: true, message: 'Catalog deleted successfully' };
    } catch (error) {
      logger.error('Failed to delete catalog', { catalogName, error: error.message });
      throw new Error(`Failed to delete catalog: ${error.message}`);
    }
  }

  /**
   * Get catalog statistics
   */
  async getCatalogStats(catalogName) {
    try {
      const validatedName = this.validateCatalogName(catalogName);
      const token = await authService.getToken();
      
      // Get schemas
      const schemasResponse = await axios.get(
        `${config.watsonxData.baseUrl}/lakehouse/api/v2/catalogs/${validatedName}/schemas`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Authinstanceid': config.watsonxData.instanceId
          },
          httpsAgent: config.watsonxData.httpsAgent,
          timeout: 10000
        }
      );

      const schemas = schemasResponse.data.schemas || [];
      let totalTables = 0;

      // Count tables in each schema
      for (const schema of schemas) {
        try {
          const schemaName = schema.name || schema;
          const tablesResponse = await axios.get(
            `${config.watsonxData.baseUrl}/lakehouse/api/v2/catalogs/${validatedName}/schemas/${schemaName}/tables`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Authinstanceid': config.watsonxData.instanceId
              },
              httpsAgent: config.watsonxData.httpsAgent,
              timeout: 10000
            }
          );
          totalTables += (tablesResponse.data.tables || []).length;
        } catch (err) {
          logger.warn('Failed to get tables for schema', { schema, error: err.message });
        }
      }

      return {
        catalogName: validatedName,
        schemaCount: schemas.length,
        tableCount: totalTables
      };
    } catch (error) {
      logger.error('Failed to get catalog stats', { catalogName, error: error.message });
      throw new Error(`Failed to get catalog stats: ${error.message}`);
    }
  }

  /**
   * Get schema tree (hierarchical view)
   */
  async getSchemaTree(catalogName) {
    try {
      const validatedName = this.validateCatalogName(catalogName);
      const token = await authService.getToken();
      
      // Get schemas
      const schemasResponse = await axios.get(
        `${config.watsonxData.baseUrl}/lakehouse/api/v2/catalogs/${validatedName}/schemas`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Authinstanceid': config.watsonxData.instanceId
          },
          httpsAgent: config.watsonxData.httpsAgent,
          timeout: 10000
        }
      );

      const schemas = schemasResponse.data.schemas || [];
      const tree = [];

      // Build tree structure
      for (const schema of schemas) {
        const schemaName = schema.name || schema;
        const schemaNode = {
          name: schemaName,
          type: 'schema',
          tables: []
        };

        try {
          const tablesResponse = await axios.get(
            `${config.watsonxData.baseUrl}/lakehouse/api/v2/catalogs/${validatedName}/schemas/${schemaName}/tables`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Authinstanceid': config.watsonxData.instanceId
              },
              httpsAgent: config.watsonxData.httpsAgent,
              timeout: 10000
            }
          );

          const tables = tablesResponse.data.tables || [];
          schemaNode.tables = tables.map(table => ({
            name: table.name || table,
            type: table.type || 'TABLE'
          }));
        } catch (err) {
          logger.warn('Failed to get tables for schema', { schema: schemaName, error: err.message });
        }

        tree.push(schemaNode);
      }

      return tree;
    } catch (error) {
      logger.error('Failed to get schema tree', { catalogName, error: error.message });
      throw new Error(`Failed to get schema tree: ${error.message}`);
    }
  }

  /**
   * Get detailed table metadata
   */
  async getTableMetadata(catalogName, schemaName, tableName) {
    try {
      const validatedCatalog = this.validateCatalogName(catalogName);
      const validatedSchema = this.validateCatalogName(schemaName);
      const validatedTable = this.validateCatalogName(tableName);
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
      logger.error('Failed to get table metadata', { 
        catalogName, 
        schemaName, 
        tableName, 
        error: error.message 
      });
      throw new Error(`Failed to get table metadata: ${error.message}`);
    }
  }
}

// Export singleton instance
module.exports = new CatalogService();

// Made with Bob