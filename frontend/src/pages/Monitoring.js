/**
 * Monitoring Page
 * 
 * Real-time system monitoring dashboard with metrics, resource utilization, and performance analytics
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Alert,
} from '@mui/material';
import {
  Speed,
  Memory,
  Storage,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  Refresh,
  TrendingUp,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import axios from 'axios';

export default function Monitoring() {
  const [dashboardData, setDashboardData] = useState(null);
  const [realtimeData, setRealtimeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchRealtimeMetrics();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/monitoring/dashboard');
      setDashboardData(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const fetchRealtimeMetrics = async () => {
    try {
      const response = await axios.get('/api/monitoring/realtime');
      const newData = response.data.data;
      
      setRealtimeData(prev => {
        const updated = [...prev, {
          time: new Date(newData.timestamp).toLocaleTimeString(),
          cpu: parseFloat(newData.cpu),
          memory: parseFloat(newData.memory),
          requests: newData.requests.total,
        }];
        
        // Keep only last 20 data points
        return updated.slice(-20);
      });
    } catch (error) {
      console.error('Error fetching realtime metrics:', error);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getHealthColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'degraded':
      case 'unhealthy':
        return 'error';
      default:
        return 'default';
    }
  };

  const getHealthIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle color="success" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'degraded':
      case 'unhealthy':
        return <ErrorIcon color="error" />;
      default:
        return null;
    }
  };

  if (loading || !dashboardData) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Monitoring Dashboard
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Monitoring Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant={autoRefresh ? 'contained' : 'outlined'}
            onClick={() => setAutoRefresh(!autoRefresh)}
            startIcon={<TrendingUp />}
          >
            {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
          </Button>
          <Button
            variant="outlined"
            onClick={handleRefresh}
            startIcon={<Refresh />}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Overall Health Status */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Alert 
            severity={dashboardData.health.overall === 'healthy' ? 'success' : 'warning'}
            icon={getHealthIcon(dashboardData.health.overall)}
          >
            <Typography variant="h6">
              System Status: {dashboardData.health.overall.toUpperCase()}
            </Typography>
            <Typography variant="body2">
              Last updated: {new Date(dashboardData.timestamp).toLocaleString()}
            </Typography>
          </Alert>
        </Grid>
      </Grid>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Speed color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">CPU Usage</Typography>
              </Box>
              <Typography variant="h3" color="primary">
                {dashboardData.system.cpu?.usage || 0}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={dashboardData.system.cpu?.usage || 0} 
                sx={{ mt: 2 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {dashboardData.system.cpu?.cores} cores
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Memory color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">Memory</Typography>
              </Box>
              <Typography variant="h3" color="secondary">
                {dashboardData.system.memory?.usagePercent}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={parseFloat(dashboardData.system.memory?.usagePercent || 0)}
                color="secondary"
                sx={{ mt: 2 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {formatBytes(dashboardData.system.memory?.used)} / {formatBytes(dashboardData.system.memory?.total)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Storage color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Requests</Typography>
              </Box>
              <Typography variant="h3" color="success.main">
                {dashboardData.requests.total}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Success Rate: {dashboardData.requests.successRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Failed: {dashboardData.requests.failed}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Performance</Typography>
              </Box>
              <Typography variant="h3" color="info.main">
                {dashboardData.performance.avgResponseTime}ms
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Avg Response Time
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Uptime: {formatUptime(dashboardData.uptime)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Real-time Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                CPU & Memory Usage (Real-time)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={realtimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="cpu" stroke="#1976d2" name="CPU %" />
                  <Line type="monotone" dataKey="memory" stroke="#9c27b0" name="Memory %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Request Volume (Real-time)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={realtimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="requests" stroke="#2e7d32" fill="#4caf50" name="Total Requests" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Component Health Status */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Component Health
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getHealthIcon(dashboardData.health.components.api)}
                    <Typography variant="body1">API Server</Typography>
                    <Chip 
                      label={dashboardData.health.components.api} 
                      color={getHealthColor(dashboardData.health.components.api)}
                      size="small"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getHealthIcon(dashboardData.health.components.memory)}
                    <Typography variant="body1">Memory</Typography>
                    <Chip 
                      label={dashboardData.health.components.memory} 
                      color={getHealthColor(dashboardData.health.components.memory)}
                      size="small"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getHealthIcon(dashboardData.health.components.watsonx)}
                    <Typography variant="body1">watsonx.data</Typography>
                    <Chip 
                      label={dashboardData.health.components.watsonx} 
                      color={getHealthColor(dashboardData.health.components.watsonx)}
                      size="small"
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Endpoint Performance */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Endpoint Performance
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Endpoint</TableCell>
                      <TableCell align="right">Total Requests</TableCell>
                      <TableCell align="right">Success</TableCell>
                      <TableCell align="right">Failed</TableCell>
                      <TableCell align="right">Success Rate</TableCell>
                      <TableCell align="right">Avg Response Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData.endpoints && dashboardData.endpoints.length > 0 ? (
                      dashboardData.endpoints.map((endpoint) => (
                        <TableRow key={endpoint.endpoint}>
                          <TableCell>{endpoint.endpoint}</TableCell>
                          <TableCell align="right">{endpoint.total}</TableCell>
                          <TableCell align="right">{endpoint.success}</TableCell>
                          <TableCell align="right">{endpoint.failed}</TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={`${endpoint.successRate}%`}
                              color={parseFloat(endpoint.successRate) > 95 ? 'success' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">{endpoint.avgResponseTime}ms</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          No endpoint data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

// Made with Bob