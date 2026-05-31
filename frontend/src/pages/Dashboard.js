import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend, AreaChart, Area
} from 'recharts';
import {
  Users, Activity, AlertTriangle, ShieldAlert, ArrowUpRight, ArrowRight,
  FileText, Loader2, Shield, Clock, CheckCircle, XCircle
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const COLORS = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#f59e0b',
  Low: '#10b981'
};

const PIE_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981'];

// ── Reusable stat card ─────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon, trend }) => (
  <div className="glass-panel p-6 flex flex-col justify-between group hover:border-slate-600 transition-colors">
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-white">{value !== null && value !== undefined ? value : '-'}</h3>
      </div>
      <div className="p-3 rounded-xl bg-primary-500/10 text-primary-400">
        {icon}
      </div>
    </div>
    {trend && (
      <div className="flex items-center gap-1 text-xs text-slate-400">
        <ArrowUpRight size={14} className="text-emerald-400" />
        <span className="text-emerald-400">Active tracking</span>
      </div>
    )}
  </div>
);

// ── Hidden "print-ready" report template ───────────────────────────────────────
const ReportTemplate = React.forwardRef(({ stats, riskTrends, alertsDist, hourlyAct, riskyUsers }, ref) => {
  const now = new Date();
  return (
    <div
      ref={ref}
      style={{
        position: 'fixed', top: '-9999px', left: '-9999px',
        width: '1200px', background: '#0f172a', color: '#f1f5f9',
        fontFamily: "'Inter', sans-serif", padding: '48px',
      }}
    >
      {/* Cover Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '2px solid #334155', paddingBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '56px', height: '56px', background: 'rgba(99,102,241,0.15)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(99,102,241,0.3)' }}>
            <Shield size={28} color="#818cf8" />
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#f1f5f9', letterSpacing: '-0.5px' }}>THREAT<span style={{ color: '#818cf8' }}>OPS</span></div>
            <div style={{ fontSize: '14px', color: '#94a3b8' }}>Insider Threat Detection System</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#f1f5f9' }}>Security Intelligence Report</div>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}>
            <Clock size={14} />
            Generated: {now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} at {now.toLocaleTimeString()}
          </div>
          <div style={{ marginTop: '8px', display: 'inline-block', padding: '4px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', fontSize: '11px', color: '#f87171', fontWeight: '600', letterSpacing: '0.05em' }}>CONFIDENTIAL</div>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '20px', marginBottom: '40px' }}>
        {[
          { label: 'Total Users', value: stats?.total_users ?? 0, color: '#818cf8', icon: <Users size={22} color="#818cf8" /> },
          { label: 'Active (24h)', value: stats?.active_users ?? 0, color: '#34d399', icon: <Activity size={22} color="#34d399" /> },
          { label: 'High Risk Users', value: stats?.high_risk_users ?? 0, color: '#fb923c', icon: <AlertTriangle size={22} color="#fb923c" /> },
          { label: 'Critical Alerts', value: stats?.critical_alerts ?? 0, color: '#f87171', icon: <ShieldAlert size={22} color="#f87171" /> },
        ].map((item) => (
          <div key={item.label} style={{ background: '#1e293b', borderRadius: '16px', padding: '24px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                <div style={{ fontSize: '36px', fontWeight: '800', color: item.color }}>{item.value}</div>
              </div>
              <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>{item.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '32px' }}>
        {/* Risk Trend */}
        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '24px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '20px', color: '#f1f5f9' }}>Network Risk Trend (7 Days)</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={riskTrends}>
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(s) => s ? s.split('-').slice(1).join('/') : ''} />
              <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
              <RechartsTooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} itemStyle={{ color: '#f1f5f9' }} />
              <Area type="monotone" dataKey="avg_risk" stroke="#6366f1" strokeWidth={3} fill="url(#riskGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Alert Severity Pie */}
        <div style={{ background: '#1e293b', borderRadius: '16px', padding: '24px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '20px', color: '#f1f5f9' }}>Alert Severity Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={alertsDist} cx="50%" cy="45%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                {alertsDist.map((entry, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <RechartsTooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} itemStyle={{ color: '#f1f5f9' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ background: '#1e293b', borderRadius: '16px', padding: '24px', border: '1px solid #334155', marginBottom: '32px' }}>
        <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '20px', color: '#f1f5f9' }}>System Activity by Hour (7-Day Aggregate)</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={hourlyAct}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="hour" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(v) => v ? v.split(':')[0] + 'h' : ''} />
            <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
            <RechartsTooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} itemStyle={{ color: '#f1f5f9' }} />
            <Legend iconType="rect" wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
            <Bar dataKey="logins" stackId="a" fill="#10b981" name="Logins" radius={[0, 0, 0, 0]} />
            <Bar dataKey="file_access" stackId="a" fill="#3b82f6" name="File Access" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Risk Users Table */}
      <div style={{ background: '#1e293b', borderRadius: '16px', padding: '24px', border: '1px solid #334155', marginBottom: '40px' }}>
        <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '20px', color: '#f1f5f9' }}>Top Risky Users — Requires Immediate Investigation</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0f172a' }}>
              {['Rank', 'Username', 'Department', 'Risk Score', 'Risk Level', 'Status'].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: '600' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {riskyUsers.map((u, i) => (
              <tr key={u.user_id} style={{ borderTop: '1px solid #334155' }}>
                <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px' }}>#{i + 1}</td>
                <td style={{ padding: '14px 16px', color: '#f1f5f9', fontWeight: '600', fontSize: '14px' }}>{u.username}</td>
                <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px' }}>{u.department || '—'}</td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '80px', height: '6px', background: '#1e293b', borderRadius: '3px', border: '1px solid #334155' }}>
                      <div style={{ width: `${u.risk_score}%`, height: '100%', borderRadius: '3px', background: u.risk_score > 75 ? '#ef4444' : u.risk_score > 50 ? '#f97316' : '#10b981' }} />
                    </div>
                    <span style={{ color: '#f1f5f9', fontSize: '13px', fontWeight: '600' }}>{u.risk_score?.toFixed(1)}</span>
                  </div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                    background: u.risk_level === 'Critical' ? 'rgba(239,68,68,0.15)' : u.risk_level === 'High' ? 'rgba(249,115,22,0.15)' : 'rgba(245,158,11,0.15)',
                    color: u.risk_level === 'Critical' ? '#f87171' : u.risk_level === 'High' ? '#fb923c' : '#fbbf24',
                    border: `1px solid ${u.risk_level === 'Critical' ? 'rgba(239,68,68,0.3)' : u.risk_level === 'High' ? 'rgba(249,115,22,0.3)' : 'rgba(245,158,11,0.3)'}`
                  }}>
                    {u.risk_level}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#f87171' }}>
                    <XCircle size={14} /> Under Review
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #334155', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '12px', color: '#475569' }}>ThreatOps Security Intelligence Platform • AI-Powered Insider Threat Detection</div>
        <div style={{ fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle size={13} color="#34d399" /> ML Model Active
        </div>
      </div>
    </div>
  );
});

// ── Main Dashboard ─────────────────────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const reportRef = useRef(null);
  const [stats, setStats] = useState(null);
  const [riskTrends, setRiskTrends] = useState([]);
  const [alertsDist, setAlertsDist] = useState([]);
  const [hourlyAct, setHourlyAct] = useState([]);
  const [riskyUsers, setRiskyUsers] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

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

  const generatePDF = async () => {
    if (!reportRef.current || isGenerating) return;
    setIsGenerating(true);
    try {
      // Wait a tick for React to render the hidden template
      await new Promise(r => setTimeout(r, 300));
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#0f172a',
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pdfW) / canvas.width;
      let offset = 0;
      let remaining = imgH;
      while (remaining > 0) {
        pdf.addImage(imgData, 'PNG', 0, offset === 0 ? 0 : -offset, pdfW, imgH, '', 'FAST');
        remaining -= pdfH;
        if (remaining > 0) {
          pdf.addPage();
          offset += pdfH;
        }
      }
      const dateStr = new Date().toISOString().split('T')[0];
      pdf.save(`ThreatOps_Security_Report_${dateStr}.pdf`);
    } catch (e) {
      console.error('PDF generation failed:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden report template rendered off-screen */}
      <ReportTemplate
        ref={reportRef}
        stats={stats}
        riskTrends={riskTrends}
        alertsDist={alertsDist}
        hourlyAct={hourlyAct}
        riskyUsers={riskyUsers}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Security Overview</h1>
        <button
          onClick={generatePDF}
          disabled={isGenerating}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-70 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-primary-900/30 hover:shadow-primary-500/20 transform hover:-translate-y-0.5 active:translate-y-0"
        >
          {isGenerating ? (
            <><Loader2 size={16} className="animate-spin" /> Generating PDF...</>
          ) : (
            <><FileText size={16} /> Generate Report</>
          )}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats?.total_users} icon={<Users size={24} />} trend />
        <StatCard title="Active (24h)" value={stats?.active_users} icon={<Activity size={24} />} />
        <StatCard title="High Risk Users" value={stats?.high_risk_users} icon={<AlertTriangle size={24} />} />
        <StatCard title="Critical Alerts" value={stats?.critical_alerts} icon={<ShieldAlert size={24} />} trend />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Trend Chart */}
        <div className="glass-panel p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-6">Network Risk Trend (7 Days)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={riskTrends}>
                <defs>
                  <linearGradient id="riskGradMain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} tickFormatter={(str) => str ? str.split('-').slice(1).join('/') : ''} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Area type="monotone" dataKey="avg_risk" stroke="#6366f1" strokeWidth={3} fill="url(#riskGradMain)" dot={{ fill: '#6366f1', strokeWidth: 2 }} activeDot={{ r: 7 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alert Distribution */}
        <div className="glass-panel p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Alert Severity</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={alertsDist} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {alertsDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name] || PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend verticalAlign="bottom" height={36} />
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
                <XAxis dataKey="hour" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} tickFormatter={(v) => v ? v.split(':')[0] : ''} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend />
                <Bar dataKey="logins" stackId="a" fill="#10b981" name="Logins" />
                <Bar dataKey="file_access" stackId="a" fill="#3b82f6" name="File Access" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Risky Users */}
        <div className="glass-panel p-0 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Top Risky Users</h2>
            <button
              onClick={() => navigate('/users')}
              className="text-sm text-primary-500 hover:text-primary-400 flex items-center gap-1 transition-colors"
            >
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
                    <td className="px-6 py-4 text-white font-medium">{user.username}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-dark-700 rounded-full h-2 max-w-[80px]">
                          <div
                            className={`h-2 rounded-full ${user.risk_score > 75 ? 'bg-red-500' : user.risk_score > 50 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                            style={{ width: `${user.risk_score}%` }}
                          />
                        </div>
                        <span className="text-slate-300 text-sm">{user.risk_score?.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border
                        ${user.risk_level === 'Critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          user.risk_level === 'High' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                          user.risk_level === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                        {user.risk_level}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/users/${user.user_id}`)}
                        className="text-primary-400 hover:text-primary-300 text-sm font-medium"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))}
                {riskyUsers.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500">No risky users detected</td>
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
