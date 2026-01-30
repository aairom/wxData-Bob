/**
 * Ingestion Page
 * 
 * Create new data ingestion jobs
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Alert,
  LinearProgress,
  Chip,
  IconButton,
  Divider,
} from '@mui/material';
import { CloudUpload, Close, AttachFile } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const fileTypes = ['json', 'csv', 'parquet', 'avro', 'orc'];

export default function Ingestion() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFilePath, setUploadedFilePath] = useState('');
  const [formData, setFormData] = useState({
    catalog: 'iceberg_data',
    schema: '',
    table: '',
    filePath: '',
    fileType: 'json',
    bucketName: 'iceberg-bucket',
    bucketType: 'minio',
    jobId: '',
  });

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Auto-detect file type from extension
      const extension = file.name.split('.').pop().toLowerCase();
      if (fileTypes.includes(extension)) {
        setFormData({ ...formData, fileType: extension });
      }
    }
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setUploadedFilePath('');
    setUploadProgress(0);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', selectedFile);
      formDataUpload.append('bucket', formData.bucketName);
      formDataUpload.append('path', 'uploads');

      const response = await axios.post('/api/upload', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      const uploadedPath = response.data.data.s3Path;
      setUploadedFilePath(uploadedPath);
      setFormData({ ...formData, filePath: uploadedPath });
      toast.success(`File uploaded successfully: ${selectedFile.name}`);
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      toast.error(`Upload failed: ${errorMsg}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const payload = {
        target: {
          catalog: formData.catalog,
          schema: formData.schema,
          table: formData.table,
        },
        source: {
          file_paths: formData.filePath,
          file_type: formData.fileType,
          bucket_details: {
            bucket_name: formData.bucketName,
            bucket_type: formData.bucketType,
          },
        },
      };

      if (formData.jobId) {
        payload.job_id = formData.jobId;
      }

      const response = await axios.post('/api/ingestion/jobs', payload);
      
      toast.success(`Ingestion job created: ${response.data.data.job_id}`);
      navigate('/jobs');
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      toast.error(`Failed to create job: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Create Ingestion Job
      </Typography>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Alert severity="info">
                  Configure your data ingestion job. All fields marked with * are required.
                </Alert>
              </Grid>

              {/* Target Configuration */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Target Configuration
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  label="Catalog"
                  value={formData.catalog}
                  onChange={handleChange('catalog')}
                  helperText="Target catalog name"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  label="Schema"
                  value={formData.schema}
                  onChange={handleChange('schema')}
                  helperText="Target schema name"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  label="Table"
                  value={formData.table}
                  onChange={handleChange('table')}
                  helperText="Target table name"
                />
              </Grid>

              {/* Source Configuration */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Source Configuration
                </Typography>
              </Grid>

              {/* File Upload Section */}
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Option 1: Upload File
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<AttachFile />}
                        disabled={uploading}
                      >
                        Select File
                        <input
                          type="file"
                          hidden
                          accept=".json,.csv,.parquet,.avro,.orc"
                          onChange={handleFileSelect}
                        />
                      </Button>
                      
                      {selectedFile && (
                        <>
                          <Chip
                            label={selectedFile.name}
                            onDelete={handleFileRemove}
                            deleteIcon={<Close />}
                            color="primary"
                            variant="outlined"
                          />
                          <Button
                            variant="contained"
                            startIcon={<CloudUpload />}
                            onClick={handleFileUpload}
                            disabled={uploading || !selectedFile}
                          >
                            Upload to MinIO
                          </Button>
                        </>
                      )}
                    </Box>
                    
                    {uploading && (
                      <Box sx={{ width: '100%' }}>
                        <LinearProgress variant="determinate" value={uploadProgress} />
                        <Typography variant="caption" color="text.secondary">
                          Uploading... {uploadProgress}%
                        </Typography>
                      </Box>
                    )}
                    
                    {uploadedFilePath && (
                      <Alert severity="success">
                        File uploaded successfully! Path: {uploadedFilePath}
                      </Alert>
                    )}
                  </Box>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Divider>
                  <Chip label="OR" />
                </Divider>
              </Grid>

              {/* Manual Path Entry */}
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Option 2: Enter File Path Manually
                  </Typography>
                  <TextField
                    fullWidth
                    required
                    label="File Path"
                    value={formData.filePath}
                    onChange={handleChange('filePath')}
                    helperText="S3/MinIO path (e.g., s3://bucket-name/path/to/file.json)"
                    placeholder="s3://my-bucket/data/file.json"
                    sx={{ mt: 1 }}
                  />
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  select
                  label="File Type"
                  value={formData.fileType}
                  onChange={handleChange('fileType')}
                  helperText="Source file format"
                >
                  {fileTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.toUpperCase()}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  label="Bucket Name"
                  value={formData.bucketName}
                  onChange={handleChange('bucketName')}
                  helperText="S3/MinIO bucket name"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Bucket Type"
                  value={formData.bucketType}
                  onChange={handleChange('bucketType')}
                  helperText="Storage type"
                >
                  <MenuItem value="minio">MinIO</MenuItem>
                  <MenuItem value="s3">AWS S3</MenuItem>
                </TextField>
              </Grid>

              {/* Optional Configuration */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Optional Configuration
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Job ID"
                  value={formData.jobId}
                  onChange={handleChange('jobId')}
                  helperText="Custom job ID (auto-generated if not provided)"
                  placeholder="my-ingestion-job-001"
                />
              </Grid>

              {/* Actions */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/dashboard')}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<CloudUpload />}
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Job'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

// Made with Bob
