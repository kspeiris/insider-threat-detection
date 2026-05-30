import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Paper, Typography, Box, Grid, Card, CardContent, Chip,
  Table, TableBody, TableCell, TableContainer, TableRow,
  CircularProgress, Alert
} from '@mui/material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

function UserAnalysis() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [riskHistory, setRiskHistory] = useState([]);
  const [currentRisk, setCurrentRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const [userRes, riskRes, historyRes] = await Promise.all([
        axios.get(`${API_URL}/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.post(`${API_URL}/risk/evaluate/${userId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/users/${userId}/risk-history`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setUser(userRes.data);
      setCurrentRisk(riskRes.data);
      setRiskHistory(historyRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error fetching user data');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'Critical': return '#9c27b0';
      case 'High': return '#f44336';
      case 'Medium': return '#ff9800';
      default: return '#4caf50';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        User Analysis
      </Typography>

      <Grid container spacing={3}>
        {/* User Info Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>User Information</Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell><strong>Username</strong></TableCell>
                      <TableCell>{user?.username}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Email</strong></TableCell>
                      <TableCell>{user?.email}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Department</strong></TableCell>
                      <TableCell>{user?.department}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Role</strong></TableCell>
                      <TableCell>{user?.role}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Current Risk Card */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Current Risk Assessment</Typography>
              {currentRisk && (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h1" sx={{ color: getRiskColor(currentRisk.risk_level) }}>
                    {currentRisk.risk_score}
                  </Typography>
                  <Chip
                    label={currentRisk.risk_level}
                    sx={{
                      backgroundColor: getRiskColor(currentRisk.risk_level),
                      color: 'white',
                      fontSize: '1rem',
                      p: 2
                    }}
                  />
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Anomaly Score: {currentRisk.anomaly_score?.toFixed(4)}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Risk History Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Risk Score History (30 Days)</Typography>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={riskHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#f44336"
                  name="Risk Score"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default UserAnalysis;
