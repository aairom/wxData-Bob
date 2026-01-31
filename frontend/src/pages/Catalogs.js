/**
 * Catalogs Page
 * 
 * Catalog management with CRUD operations, schema visualization, and table metadata
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Collapse,
  Tooltip,
  TreeView,
  TreeItem,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Refresh,
  Storage,
  Folder,
  TableChart,
  ExpandMore,
  ChevronRight,
  Info,
  Assessment,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';

export default function Catalogs() {
  const [catalogs, setCatalogs] = useState([]);
  const [selectedCatalog, setSelectedCatalog] = useState(null);
  const [schemaTree, setSchemaTree] = useState([]);
  const [catalogStats, setCatalogStats] = useState(null);
  const [tableMetadata, setTableMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [metadataDialogOpen, setMetadataDialogOpen] = useState(false);
  const [expandedSchemas, setExpandedSchemas] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'iceberg',
    description: '',
    properties: {}
  });

  useEffect(() => {
    loadCatalogs();
  }, []);

  useEffect(() => {
    if (selectedCatalog) {
      loadSchemaTree(selectedCatalog);
      loadCatalogStats(selectedCatalog);
    }
  }, [selectedCatalog]);

  const loadCatalogs = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/catalog');
      setCatalogs(response.data.data || []);
    } catch (error) {
      console.error('Failed to load catalogs:', error);
      toast.error('Failed to load catalogs');
    } finally {
      setLoading(false);
    }
  };

  const loadSchemaTree = async (catalogName) => {
    try {
      const response = await axios.get(`/api/catalog/${catalogName}/tree`);
      setSchemaTree(response.data.data || []);
    } catch (error) {
      console.error('Failed to load schema tree:', error);
      toast.error('Failed to load schema tree');
    }
  };

  const loadCatalogStats = async (catalogName) => {
    try {
      const response = await axios.get(`/api/catalog/${catalogName}/stats`);
      setCatalogStats(response.data.data);
    } catch (error) {
      console.error('Failed to load catalog stats:', error);
    }
  };

  const loadTableMetadata = async (catalog, schema, table) => {
    try {
      const response = await axios.get(
        `/api/catalog/${catalog}/schema/${schema}/table/${table}/metadata`
      );
      setTableMetadata(response.data.data);
      setMetadataDialogOpen(true);
    } catch (error) {
      console.error('Failed to load table metadata:', error);
      toast.error('Failed to load table metadata');
    }
  };

  const handleCreateCatalog = async () => {
    try {
      await axios.post('/api/catalog', formData);
      toast.success('Catalog created successfully');
      setCreateDialogOpen(false);
      resetForm();
      loadCatalogs();
    } catch (error) {
      console.error('Failed to create catalog:', error);
      toast.error(error.response?.data?.error || 'Failed to create catalog');
    }
  };

  const handleUpdateCatalog = async () => {
    try {
      await axios.patch(`/api/catalog/${formData.name}`, {
        description: formData.description,
        properties: formData.properties
      });
      toast.success('Catalog updated successfully');
      setEditDialogOpen(false);
      resetForm();
      loadCatalogs();
    } catch (error) {
      console.error('Failed to update catalog:', error);
      toast.error(error.response?.data?.error || 'Failed to update catalog');
    }
  };

  const handleDeleteCatalog = async () => {
    try {
      await axios.delete(`/api/catalog/${selectedCatalog}`);
      toast.success('Catalog deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedCatalog(null);
      loadCatalogs();
    } catch (error) {
      console.error('Failed to delete catalog:', error);
      toast.error(error.response?.data?.error || 'Failed to delete catalog');
    }
  };

  const openEditDialog = (catalog) => {
    setFormData({
      name: catalog.name || catalog,
      type: catalog.type || 'iceberg',
      description: catalog.description || '',
      properties: catalog.properties || {}
    });
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'iceberg',
      description: '',
      properties: {}
    });
  };

  const toggleSchema = (schemaName) => {
    setExpandedSchemas(prev => ({
      ...prev,
      [schemaName]: !prev[schemaName]
    }));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Catalog Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadCatalogs}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Catalog
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Panel - Catalog List */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Catalogs
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : catalogs.length > 0 ? (
                <List>
                  {catalogs.map((catalog, idx) => {
                    const catalogName = catalog.name || catalog;
                    return (
                      <ListItem
                        key={idx}
                        secondaryAction={
                          <Box>
                            <Tooltip title="Edit">
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={() => openEditDialog(catalog)}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={() => {
                                  setSelectedCatalog(catalogName);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        }
                        disablePadding
                      >
                        <ListItemButton
                          selected={selectedCatalog === catalogName}
                          onClick={() => setSelectedCatalog(catalogName)}
                        >
                          <Storage sx={{ mr: 2 }} />
                          <ListItemText
                            primary={catalogName}
                            secondary={catalog.type || 'Unknown'}
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No catalogs found
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Panel - Schema Tree & Stats */}
        <Grid item xs={12} md={8}>
          {selectedCatalog ? (
            <>
              {/* Catalog Stats */}
              {catalogStats && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Assessment sx={{ mr: 1 }} />
                      <Typography variant="h6">
                        Statistics
                      </Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="primary">
                            {catalogStats.schemaCount}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Schemas
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="primary">
                            {catalogStats.tableCount}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Tables
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Chip
                            label={selectedCatalog}
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}

              {/* Schema Tree */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Schema Browser
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  {schemaTree.length > 0 ? (
                    <List>
                      {schemaTree.map((schema, idx) => (
                        <Box key={idx}>
                          <ListItemButton onClick={() => toggleSchema(schema.name)}>
                            <Folder sx={{ mr: 2 }} />
                            <ListItemText
                              primary={schema.name}
                              secondary={`${schema.tables.length} tables`}
                            />
                            {expandedSchemas[schema.name] ? <ExpandMore /> : <ChevronRight />}
                          </ListItemButton>
                          <Collapse in={expandedSchemas[schema.name]} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                              {schema.tables.map((table, tableIdx) => (
                                <ListItem
                                  key={tableIdx}
                                  sx={{ pl: 4 }}
                                  secondaryAction={
                                    <Tooltip title="View Metadata">
                                      <IconButton
                                        edge="end"
                                        size="small"
                                        onClick={() => loadTableMetadata(
                                          selectedCatalog,
                                          schema.name,
                                          table.name
                                        )}
                                      >
                                        <Info />
                                      </IconButton>
                                    </Tooltip>
                                  }
                                >
                                  <TableChart sx={{ mr: 2, fontSize: 20 }} />
                                  <ListItemText
                                    primary={table.name}
                                    secondary={table.type}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Collapse>
                        </Box>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No schemas found in this catalog
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent>
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Storage sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Select a catalog to view details
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Create Catalog Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Catalog</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Catalog Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                label="Type"
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <MenuItem value="iceberg">Iceberg</MenuItem>
                <MenuItem value="hive">Hive</MenuItem>
                <MenuItem value="delta">Delta Lake</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateCatalog} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Catalog Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Catalog</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Catalog Name"
              value={formData.name}
              fullWidth
              disabled
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateCatalog} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Catalog</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone. All schemas and tables in this catalog will be removed.
          </Alert>
          <Typography>
            Are you sure you want to delete catalog <strong>{selectedCatalog}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteCatalog} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Table Metadata Dialog */}
      <Dialog
        open={metadataDialogOpen}
        onClose={() => setMetadataDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Table Metadata</DialogTitle>
        <DialogContent>
          {tableMetadata && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {tableMetadata.name}
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Columns
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Name</strong></TableCell>
                      <TableCell><strong>Type</strong></TableCell>
                      <TableCell><strong>Nullable</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(tableMetadata.columns || []).map((col, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{col.name}</TableCell>
                        <TableCell>{col.type}</TableCell>
                        <TableCell>
                          <Chip
                            label={col.nullable ? 'Yes' : 'No'}
                            size="small"
                            color={col.nullable ? 'default' : 'primary'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {tableMetadata.properties && Object.keys(tableMetadata.properties).length > 0 && (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    Properties
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableBody>
                        {Object.entries(tableMetadata.properties).map(([key, value]) => (
                          <TableRow key={key}>
                            <TableCell><strong>{key}</strong></TableCell>
                            <TableCell>{String(value)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMetadataDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Made with Bob