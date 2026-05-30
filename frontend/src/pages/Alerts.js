import React, { useState, useEffect } from 'react';
import {
  Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, Box, FormControl, InputLabel,
  Select, MenuItem, IconButton, Tooltip
} from '@mui/material';
import { CheckCircle, Visibility, Done } from '@mui/icons-material';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchAlerts = async () => {
    try {
      let url = `${API_URL}/alerts/`;
      if (filter !== 'all') {
        url += `?status=${filter}`;
      }
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(response.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const resolveAlert = async (alertId) => {
    try {
      await axios.put(`${API_URL}/alerts/${alertId}/resolve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const investigateAlert = async (alertId) => {
    try {
      await axios.put(`${API_URL}/alerts/${alertId}/investigate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAlerts();
    } catch (error) {
      console.error('Error investigating alert:', error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical': return 'error';
      case 'High': return 'warning';
      case 'Medium': return 'info';
      default: return 'success';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'error';
      case 'investigating': return 'warning';
      case 'resolved': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Alert Management
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select
            value={filter}
            label="Filter by Status"
            onChange={(e) => setFilter(e.target.value)}
          >
            <MenuItem value="all">All Alerts</MenuItem>
            <MenuItem value="new">New</MenuItem>
            <MenuItem value="investigating">Investigating</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
          </Select>
        </FormControl>
        <Button variant="outlined" onClick={fetchAlerts}>Refresh</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Severity</TableCell>
              <TableCell>User ID</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {alerts.map((alert) => (
              <TableRow key={alert.id} hover>
                <TableCell>
                  <Chip
                    label={alert.severity}
                    color={getSeverityColor(alert.severity)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{alert.user_id}</TableCell>
                <TableCell>{alert.alert_type}</TableCell>
                <TableCell>{alert.description}</TableCell>
                <TableCell>
                  <Chip
                    label={alert.status}
                    color={getStatusColor(alert.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{new Date(alert.timestamp).toLocaleString()}</TableCell>
                <TableCell>
                  <Tooltip title="Investigate">
                    <IconButton
                      size="small"
                      onClick={() => investigateAlert(alert.id)}
                      disabled={alert.status !== 'new'}
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Resolve">
                    <IconButton
                      size="small"
                      onClick={() => resolveAlert(alert.id)}
                      disabled={alert.status === 'resolved'}
                    >
                      <Done />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {alerts.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
          <Typography color="textSecondary">No alerts found</Typography>
        </Paper>
      )}
    </Box>
  );
}

export default Alerts;
