/**
 * Jobs Page
 * 
 * Monitor and manage ingestion jobs
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Refresh,
  Delete,
  Visibility,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';
import { format } from 'date-fns';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await axios.get('/api/ingestion/jobs');
      setJobs(response.data.data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await fetchJobs();
    setLoading(false);
    toast.success('Jobs refreshed');
  };

  const handleViewDetails = async (jobId) => {
    try {
      const response = await axios.get(`/api/ingestion/jobs/${jobId}`);
      setSelectedJob(response.data.data);
      setDetailsOpen(true);
    } catch (error) {
      toast.error('Failed to fetch job details');
    }
  };

  const handleCancelJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to cancel this job?')) {
      return;
    }

    try {
      await axios.delete(`/api/ingestion/jobs/${jobId}`);
      toast.success('Job cancelled successfully');
      fetchJobs();
    } catch (error) {
      toast.error('Failed to cancel job');
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
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(parseInt(timestamp) / 1000000);
      return format(date, 'yyyy-MM-dd HH:mm:ss');
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Ingestion Jobs
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Job ID</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Target Table</TableCell>
                  <TableCell>Source Files</TableCell>
                  <TableCell>Start Time</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {jobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No jobs found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs.map((job) => (
                    <TableRow key={job.job_id}>
                      <TableCell>{job.job_id}</TableCell>
                      <TableCell>
                        <Chip
                          label={job.status}
                          color={getStatusColor(job.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{job.target_table || 'N/A'}</TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                          {job.source_data_files || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatTimestamp(job.start_timestamp)}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(job.job_id)}
                          title="View Details"
                        >
                          <Visibility />
                        </IconButton>
                        {(job.status === 'running' || job.status === 'starting') && (
                          <IconButton
                            size="small"
                            onClick={() => handleCancelJob(job.job_id)}
                            title="Cancel Job"
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Job Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Job Details</DialogTitle>
        <DialogContent>
          {selectedJob && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Job ID</Typography>
              <Typography variant="body1" gutterBottom>{selectedJob.job_id}</Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Status</Typography>
              <Chip
                label={selectedJob.status}
                color={getStatusColor(selectedJob.status)}
                size="small"
                sx={{ mb: 2 }}
              />

              <Typography variant="subtitle2" color="text.secondary">Application ID</Typography>
              <Typography variant="body1" gutterBottom>{selectedJob.application_id || 'N/A'}</Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Target Table</Typography>
              <Typography variant="body1" gutterBottom>{selectedJob.target_table || 'N/A'}</Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Source Files</Typography>
              <Typography variant="body1" gutterBottom>{selectedJob.source_data_files || 'N/A'}</Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Start Time</Typography>
              <Typography variant="body1" gutterBottom>
                {formatTimestamp(selectedJob.start_timestamp)}
              </Typography>

              {selectedJob.end_timestamp && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>End Time</Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatTimestamp(selectedJob.end_timestamp)}
                  </Typography>
                </>
              )}

              {selectedJob.details && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Details</Typography>
                  <Typography
                    variant="body2"
                    component="pre"
                    sx={{
                      backgroundColor: 'grey.100',
                      p: 2,
                      borderRadius: 1,
                      overflow: 'auto',
                      maxHeight: 300,
                    }}
                  >
                    {selectedJob.details}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Made with Bob
