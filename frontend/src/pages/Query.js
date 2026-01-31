/**
 * Query Page
 * 
 * SQL query interface with editor, history, and result visualization
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
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
  Tabs,
  Tab,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Tooltip,
  Menu,
  MenuItem as MenuItemComponent,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  History,
  Download,
  Delete,
  ContentCopy,
  TableChart,
  BarChart as BarChartIcon,
  Code,
  Refresh,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';

// Simple SQL syntax highlighting component
const SQLEditor = ({ value, onChange, disabled }) => {
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <TextField
      multiline
      fullWidth
      rows={12}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      placeholder="Enter your SQL query here...&#10;&#10;Example:&#10;SELECT * FROM iceberg_data.default.customers LIMIT 10;"
      sx={{
        fontFamily: 'monospace',
        '& .MuiInputBase-input': {
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          fontSize: '14px',
          lineHeight: '1.5',
        },
      }}
    />
  );
};

export default function Query() {
  const [sql, setSql] = useState('');
  const [catalog, setCatalog] = useState('iceberg_data');
  const [schema, setSchema] = useState('default');
  const [catalogs, setCatalogs] = useState([]);
  const [schemas, setSchemas] = useState([]);
  const [tables, setTables] = useState([]);
  const [executing, setExecuting] = useState(false);
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);

  // Load catalogs on mount
  useEffect(() => {
    loadCatalogs();
    loadHistory();
  }, []);

  // Load schemas when catalog changes
  useEffect(() => {
    if (catalog) {
      loadSchemas(catalog);
    }
  }, [catalog]);

  // Load tables when schema changes
  useEffect(() => {
    if (catalog && schema) {
      loadTables(catalog, schema);
    }
  }, [catalog, schema]);

  const loadCatalogs = async () => {
    try {
      const response = await axios.get('/api/query/catalogs');
      setCatalogs(response.data.data || []);
    } catch (error) {
      console.error('Failed to load catalogs:', error);
      toast.error('Failed to load catalogs');
    }
  };

  const loadSchemas = async (catalogName) => {
    try {
      const response = await axios.get(`/api/query/catalogs/${catalogName}/schemas`);
      setSchemas(response.data.data || []);
    } catch (error) {
      console.error('Failed to load schemas:', error);
      setSchemas([]);
    }
  };

  const loadTables = async (catalogName, schemaName) => {
    try {
      const response = await axios.get(`/api/query/catalogs/${catalogName}/schemas/${schemaName}/tables`);
      setTables(response.data.data || []);
    } catch (error) {
      console.error('Failed to load tables:', error);
      setTables([]);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await axios.get('/api/query/history');
      setHistory(response.data.data || []);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const executeQuery = async () => {
    if (!sql.trim()) {
      toast.warning('Please enter a SQL query');
      return;
    }

    setExecuting(true);
    setResults(null);

    try {
      const response = await axios.post('/api/query/execute', {
        sql,
        catalog,
        schema,
      });

      setResults(response.data.data);
      setActiveTab(0); // Switch to results tab
      toast.success(`Query executed successfully! ${response.data.data.rowCount} rows returned`);
      
      // Reload history
      loadHistory();
    } catch (error) {
      console.error('Query execution failed:', error);
      toast.error(error.response?.data?.error || 'Query execution failed');
    } finally {
      setExecuting(false);
    }
  };

  const loadQueryFromHistory = (historyItem) => {
    setSql(historyItem.sql);
    setCatalog(historyItem.catalog);
    setSchema(historyItem.schema);
    toast.info('Query loaded from history');
  };

  const clearHistory = async () => {
    try {
      await axios.delete('/api/query/history');
      setHistory([]);
      toast.success('History cleared');
    } catch (error) {
      console.error('Failed to clear history:', error);
      toast.error('Failed to clear history');
    }
  };

  const handleExport = async (format) => {
    if (!results || !results.rows || results.rows.length === 0) {
      toast.warning('No results to export');
      return;
    }

    try {
      const response = await axios.post('/api/query/export', {
        columns: results.columns,
        rows: results.rows,
        format,
      }, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `query_results_${Date.now()}.${format === 'json' ? 'json' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success(`Results exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export results');
    }

    setExportMenuAnchor(null);
  };

  const insertTableName = (tableName) => {
    const tableRef = `${catalog}.${schema}.${tableName}`;
    setSql(prev => prev + (prev ? '\n' : '') + `SELECT * FROM ${tableRef} LIMIT 10;`);
    toast.info(`Table ${tableName} inserted into query`);
  };

  const copySql = () => {
    navigator.clipboard.writeText(sql);
    toast.success('SQL copied to clipboard');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          SQL Query Interface
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadCatalogs}
          >
            Refresh Metadata
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Panel - Query Editor */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Catalog</InputLabel>
                  <Select
                    value={catalog}
                    label="Catalog"
                    onChange={(e) => setCatalog(e.target.value)}
                    disabled={executing}
                  >
                    {catalogs.map((cat) => (
                      <MenuItem key={cat.name || cat} value={cat.name || cat}>
                        {cat.name || cat}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Schema</InputLabel>
                  <Select
                    value={schema}
                    label="Schema"
                    onChange={(e) => setSchema(e.target.value)}
                    disabled={executing}
                  >
                    {schemas.map((sch) => (
                      <MenuItem key={sch.name || sch} value={sch.name || sch}>
                        {sch.name || sch}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box sx={{ flexGrow: 1 }} />

                <Tooltip title="Copy SQL">
                  <IconButton onClick={copySql} disabled={!sql}>
                    <ContentCopy />
                  </IconButton>
                </Tooltip>
              </Box>

              <SQLEditor
                value={sql}
                onChange={setSql}
                disabled={executing}
              />

              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={executing ? <CircularProgress size={20} /> : <PlayArrow />}
                  onClick={executeQuery}
                  disabled={executing || !sql.trim()}
                  fullWidth
                >
                  {executing ? 'Executing...' : 'Execute Query'}
                </Button>
              </Box>

              {results && (
                <Box sx={{ mt: 2 }}>
                  <Alert severity="success">
                    Query executed in {results.executionTime}ms • {results.rowCount} rows returned
                  </Alert>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
                  <Tab icon={<TableChart />} label="Results" />
                  <Tab icon={<History />} label="History" />
                </Tabs>

                {activeTab === 0 && results && (
                  <Box>
                    <Button
                      startIcon={<Download />}
                      onClick={(e) => setExportMenuAnchor(e.currentTarget)}
                    >
                      Export
                    </Button>
                    <Menu
                      anchorEl={exportMenuAnchor}
                      open={Boolean(exportMenuAnchor)}
                      onClose={() => setExportMenuAnchor(null)}
                    >
                      <MenuItemComponent onClick={() => handleExport('csv')}>
                        Export as CSV
                      </MenuItemComponent>
                      <MenuItemComponent onClick={() => handleExport('json')}>
                        Export as JSON
                      </MenuItemComponent>
                    </Menu>
                  </Box>
                )}

                {activeTab === 1 && history.length > 0 && (
                  <Button
                    startIcon={<Delete />}
                    onClick={clearHistory}
                    color="error"
                  >
                    Clear History
                  </Button>
                )}
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Results Tab */}
              {activeTab === 0 && (
                <Box>
                  {results ? (
                    <TableContainer sx={{ maxHeight: 500 }}>
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow>
                            {results.columns.map((col, idx) => (
                              <TableCell key={idx}>
                                <strong>{col.name}</strong>
                                <Typography variant="caption" display="block" color="text.secondary">
                                  {col.type}
                                </Typography>
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {results.rows.map((row, rowIdx) => (
                            <TableRow key={rowIdx} hover>
                              {results.columns.map((col, colIdx) => (
                                <TableCell key={colIdx}>
                                  {row[col.name] !== null && row[col.name] !== undefined
                                    ? String(row[col.name])
                                    : <em style={{ color: '#999' }}>NULL</em>}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No results yet. Execute a query to see results here.
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {/* History Tab */}
              {activeTab === 1 && (
                <Box>
                  {history.length > 0 ? (
                    <List>
                      {history.map((item, idx) => (
                        <ListItem
                          key={idx}
                          secondaryAction={
                            <Chip
                              label={item.status}
                              color={item.status === 'completed' ? 'success' : 'error'}
                              size="small"
                            />
                          }
                          disablePadding
                        >
                          <ListItemButton onClick={() => loadQueryFromHistory(item)}>
                            <ListItemText
                              primary={
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontFamily: 'monospace',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {item.sql}
                                </Typography>
                              }
                              secondary={
                                <>
                                  {new Date(item.timestamp).toLocaleString()} • 
                                  {item.catalog}.{item.schema}
                                  {item.rowCount !== undefined && ` • ${item.rowCount} rows`}
                                  {item.executionTime && ` • ${item.executionTime}ms`}
                                </>
                              }
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No query history yet.
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Panel - Schema Browser */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Schema Browser
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {tables.length > 0 ? (
                <List dense>
                  {tables.map((table, idx) => (
                    <ListItem
                      key={idx}
                      secondaryAction={
                        <Tooltip title="Insert into query">
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => insertTableName(table.name || table)}
                          >
                            <Code />
                          </IconButton>
                        </Tooltip>
                      }
                      disablePadding
                    >
                      <ListItemButton>
                        <ListItemText
                          primary={table.name || table}
                          secondary={table.type || 'TABLE'}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No tables found in {catalog}.{schema}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Quick Examples */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Examples
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List dense>
                <ListItemButton onClick={() => setSql('SELECT * FROM iceberg_data.default.customers LIMIT 10;')}>
                  <ListItemText
                    primary="Select from customers"
                    secondary="Basic SELECT query"
                  />
                </ListItemButton>
                <ListItemButton onClick={() => setSql('SELECT COUNT(*) as total FROM iceberg_data.default.customers;')}>
                  <ListItemText
                    primary="Count records"
                    secondary="Aggregate function"
                  />
                </ListItemButton>
                <ListItemButton onClick={() => setSql('SHOW TABLES FROM iceberg_data.default;')}>
                  <ListItemText
                    primary="Show tables"
                    secondary="List all tables"
                  />
                </ListItemButton>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

// Made with Bob