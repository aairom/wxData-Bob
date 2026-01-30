/**
 * Dashboard Page
 * 
 * Main dashboard showing system overview and quick actions
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Chip,
} from '@mui/material';
import {
  CloudUpload,
  CheckCircle,
  Error,
  HourglassEmpty,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Dashboard() {
  const navigate = useNavigate();
  const [authStatus, setAuthStatus] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);

  useEffect(() => {
    fetchAuthStatus();
    fetchRecentJobs();
  }, []);

  const fetchAuthStatus = async () => {
    try {
      const response = await axios.get('/api/auth/status');
      setAuthStatus(response.data.data);
    } catch (error) {
      console.error('Error fetching auth status:', error);
    }
  };

  const fetchRecentJobs = async () => {
    try {
      const response = await axios.get('/api/ingestion/jobs?limit=5');
      setRecentJobs(response.data.data || []);
    } catch (error) {
      console.error('Error fetching recent jobs:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'failed':
        return <Error color="error" />;
      case 'running':
      case 'starting':
        return <HourglassEmpty color="warning" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'running':
      case 'starting':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Authentication Status Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Authentication Status
              </Typography>
              {authStatus ? (
                <Box>
                  <Chip
                    label={authStatus.hasToken && !authStatus.isExpired ? 'Connected' : 'Disconnected'}
                    color={authStatus.hasToken && !authStatus.isExpired ? 'success' : 'error'}
                    sx={{ mb: 2 }}
                  />
                  {authStatus.hasToken && !authStatus.isExpired && (
                    <Typography variant="body2" color="text.secondary">
                      Token expires in: {Math.floor(authStatus.expiresIn / 1000 / 60)} minutes
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Loading...
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<CloudUpload />}
                  onClick={() => navigate('/ingestion')}
                >
                  New Ingestion
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/jobs')}
                >
                  View Jobs
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Jobs Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Ingestion Jobs
              </Typography>
              {recentJobs.length > 0 ? (
                <Box>
                  {recentJobs.map((job) => (
                    <Box
                      key={job.job_id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 1,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        '&:last-child': { borderBottom: 'none' },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {getStatusIcon(job.status)}
                        <Box>
                          <Typography variant="body1">{job.job_id}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {job.target_table || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={job.status}
                        color={getStatusColor(job.status)}
                        size="small"
                      />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No recent jobs
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* System Info Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    watsonx.data URL
                  </Typography>
                  <Typography variant="body1">
                    https://localhost:6443
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Default Engine
                  </Typography>
                  <Typography variant="body1">
                    spark158
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Default Bucket
                  </Typography>
                  <Typography variant="body1">
                    iceberg-bucket
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Bucket Type
                  </Typography>
                  <Typography variant="body1">
                    MinIO
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

// Made with Bob
