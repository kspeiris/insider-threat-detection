import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { ArrowLeft, User as UserIcon, Shield, Activity, RefreshCw } from 'lucide-react';

const UserAnalysis = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [riskHistory, setRiskHistory] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, [id]);

  const fetchUserData = async () => {
    try {
      const [userRes, historyRes, featuresRes] = await Promise.all([
        api.get(`/users/${id}`),
        api.get(`/users/${id}/risk-history`),
        api.get(`/users/${id}/features`)
      ]);
      setUser(userRes.data);
      setRiskHistory(historyRes.data);
      setFeatures(featuresRes.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleEvaluate = async () => {
    setLoading(true);
    try {
      await api.post(`/users/${id}/evaluate`);
      await fetchUserData();
    } catch (error) {
      console.error('Error evaluating user:', error);
    }
    setLoading(false);
  };

  if (!user) return <div className="p-8 text-center text-slate-400">Loading user profile...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700/50"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          Investigate User
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Profile Card */}
        <div className="glass-panel p-6 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-primary-500/10 rounded-full flex items-center justify-center mb-4 border border-primary-500/20 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <UserIcon size={40} className="text-primary-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">{user.username}</h2>
          <p className="text-slate-400 mb-6">{user.department} Department</p>
          
          <div className="w-full flex justify-between items-center p-4 bg-dark-900 rounded-lg border border-slate-700/50 mb-6">
            <div className="text-left">
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Status</p>
              <p className="text-white font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span> Active
              </p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">User ID</p>
              <p className="text-slate-300 font-mono">#{user.id}</p>
            </div>
          </div>

          <button 
            onClick={handleEvaluate}
            disabled={loading}
            className="w-full py-3 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw size={18} className="animate-spin" /> : <Shield size={18} />}
            Force Risk Evaluation
          </button>
        </div>

        {/* Behavioral Radar Chart */}
        <div className="glass-panel p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <Activity size={20} className="text-primary-500" />
            Behavioral Profile
          </h2>
          <p className="text-slate-400 text-sm mb-6">Current activity metrics compared to baseline thresholds</p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={features}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{fill: '#94a3b8', fontSize: 12}} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name={user.username} dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Risk History Chart */}
      <div className="glass-panel p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Risk Score History (30 Days)</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={riskHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis 
                dataKey="timestamp" 
                stroke="#94a3b8" 
                tick={{fill: '#94a3b8'}} 
                tickFormatter={(str) => str ? new Date(str).toLocaleDateString() : ''} 
              />
              <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}} domain={[0, 100]} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                itemStyle={{ color: '#f8fafc' }}
                labelFormatter={(label) => new Date(label).toLocaleString()}
              />
              <Line 
                type="stepAfter" 
                dataKey="score" 
                stroke="#f59e0b" 
                strokeWidth={3} 
                dot={false}
                activeDot={{ r: 8, fill: '#f59e0b' }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default UserAnalysis;
