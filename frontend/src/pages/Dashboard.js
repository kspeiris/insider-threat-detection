import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { Users, Activity, AlertTriangle, ShieldAlert, ArrowUpRight, ArrowRight } from 'lucide-react';

const COLORS = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#f59e0b',
  Low: '#10b981'
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [riskTrends, setRiskTrends] = useState([]);
  const [alertsDist, setAlertsDist] = useState([]);
  const [hourlyAct, setHourlyAct] = useState([]);
  const [riskyUsers, setRiskyUsers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, trendsRes, alertsRes, hourlyRes, usersRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/risk-trends'),
          api.get('/dashboard/alerts-distribution'),
          api.get('/dashboard/hourly-activity'),
          api.get('/dashboard/top-risky-users')
        ]);
        setStats(statsRes.data);
        setRiskTrends(trendsRes.data);
        setAlertsDist(alertsRes.data);
        setHourlyAct(hourlyRes.data);
        setRiskyUsers(usersRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    fetchData();
  }, []);

  const StatCard = ({ title, value, icon, color, trend }) => (
    <div className="glass-panel p-6 flex flex-col justify-between group hover:border-slate-600 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-white">{value !== null ? value : '-'}</h3>
        </div>
        <div className={`p-3 rounded-xl bg-${color}/10 text-${color} shadow-[0_0_15px_rgba(var(--tw-colors-${color}),0.2)]`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <ArrowUpRight size={14} className="text-success" />
          <span className="text-success">Active tracking</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Security Overview</h1>
        <button className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors">
          Generate Report
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats?.total_users} icon={<Users size={24} />} color="primary-500" trend />
        <StatCard title="Active (24h)" value={stats?.active_users} icon={<Activity size={24} />} color="success" />
        <StatCard title="High Risk Users" value={stats?.high_risk_users} icon={<AlertTriangle size={24} />} color="warning" />
        <StatCard title="Critical Alerts" value={stats?.critical_alerts} icon={<ShieldAlert size={24} />} color="danger" trend />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Trend Chart */}
        <div className="glass-panel p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-6">Network Risk Trend (7 Days)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={riskTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{fill: '#94a3b8'}} tickFormatter={(str) => str ? str.split('-').slice(1).join('/') : ''} />
                <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Line type="monotone" dataKey="avg_risk" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', strokeWidth: 2 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alert Distribution */}
        <div className="glass-panel p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Alert Severity</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={alertsDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {alertsDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#8884d8'} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Activity */}
        <div className="glass-panel p-6">
          <h2 className="text-lg font-semibold text-white mb-6">System Activity (24h)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyAct}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="hour" stroke="#94a3b8" tick={{fill: '#94a3b8'}} tickFormatter={(v) => v ? v.split(':')[0] : ''} />
                <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend />
                <Bar dataKey="logins" stackId="a" fill="#10b981" name="Logins" />
                <Bar dataKey="file_access" stackId="a" fill="#3b82f6" name="File Access" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Risky Users */}
        <div className="glass-panel p-0 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Top Risky Users</h2>
            <button className="text-sm text-primary-500 hover:text-primary-400 flex items-center gap-1 transition-colors">
              View all <ArrowRight size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left">
              <thead className="bg-dark-800/50 text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Risk Score</th>
                  <th className="px-6 py-4 font-medium">Level</th>
                  <th className="px-6 py-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {riskyUsers.map((user) => (
                  <tr key={user.user_id} className="hover:bg-dark-700/30 transition-colors">
                    <td className="px-6 py-4 text-white font-medium">
                      {user.username}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-dark-700 rounded-full h-2 max-w-[80px]">
                          <div 
                            className={`h-2 rounded-full ${user.risk_score > 75 ? 'bg-danger' : user.risk_score > 50 ? 'bg-warning' : 'bg-success'}`} 
                            style={{width: `${user.risk_score}%`}}
                          ></div>
                        </div>
                        <span className="text-slate-300 text-sm">{user.risk_score.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border 
                        ${user.risk_level === 'Critical' ? 'bg-danger/10 text-danger border-danger/20' : 
                          user.risk_level === 'High' ? 'bg-warning/10 text-warning border-warning/20' : 
                          user.risk_level === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                          'bg-success/10 text-success border-success/20'}`}>
                        {user.risk_level}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => navigate(`/users/${user.user_id}`)}
                        className="text-primary-500 hover:text-primary-400 text-sm font-medium"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))}
                {riskyUsers.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                      No risky users detected
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
