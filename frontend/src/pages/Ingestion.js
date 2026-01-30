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
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const fileTypes = ['json', 'csv', 'parquet', 'avro', 'orc'];

export default function Ingestion() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="File Path"
                  value={formData.filePath}
                  onChange={handleChange('filePath')}
                  helperText="S3/MinIO path (e.g., s3://bucket-name/path/to/file.json)"
                  placeholder="s3://my-bucket/data/file.json"
                />
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
