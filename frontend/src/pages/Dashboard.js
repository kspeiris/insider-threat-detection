import React, { useState, useEffect } from 'react';
import {
  Grid, Paper, Typography, Box, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

function Dashboard() {
  const [stats, setStats] = useState({
    total_users: 0,
    active_users: 0,
    high_risk_users: 0,
    critical_alerts: 0,
    total_alerts: 0
  });
  const [riskTrends, setRiskTrends] = useState([]);
  const [topRiskyUsers, setTopRiskyUsers] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, trendsRes, usersRes, alertsRes] = await Promise.all([
        axios.get(`${API_URL}/dashboard/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/dashboard/risk-trends`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/dashboard/top-risky-users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/alerts/?status=new`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setStats(statsRes.data);
      setRiskTrends(trendsRes.data);
      setTopRiskyUsers(usersRes.data);
      setRecentAlerts(alertsRes.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const riskColors = {
    Low: '#4caf50',
    Medium: '#ff9800',
    High: '#f44336',
    Critical: '#9c27b0'
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Security Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Users</Typography>
              <Typography variant="h3">{stats.total_users}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Active Users (24h)</Typography>
              <Typography variant="h3">{stats.active_users}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#ffebee' }}>
            <CardContent>
              <Typography color="error" gutterBottom>High Risk Users</Typography>
              <Typography variant="h3" color="error">{stats.high_risk_users}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fce4ec' }}>
            <CardContent>
              <Typography color="error" gutterBottom>Critical Alerts</Typography>
              <Typography variant="h3" color="error">{stats.critical_alerts}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Risk Score Trends (7 Days)</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={riskTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avg_risk" stroke="#f44336" name="Average Risk Score" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Top Risky Users</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell align="right">Risk Score</TableCell>
                    <TableCell align="right">Level</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topRiskyUsers.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell align="right">{user.risk_score.toFixed(1)}</TableCell>
                      <TableCell align="right">
                        <span style={{ color: riskColors[user.risk_level] }}>
                          {user.risk_level}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Recent Alerts</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Severity</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentAlerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <span style={{
                          backgroundColor: riskColors[alert.severity],
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}>
                          {alert.severity}
                        </span>
                      </TableCell>
                      <TableCell>{alert.description}</TableCell>
                      <TableCell>{new Date(alert.timestamp).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
