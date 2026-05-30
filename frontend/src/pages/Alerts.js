import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ShieldAlert, CheckCircle, Clock } from 'lucide-react';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/alerts?status=new');
      setAlerts(response.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const handleResolve = async (id) => {
    try {
      await api.post(`/alerts/${id}/resolve`);
      fetchAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldAlert className="text-danger" size={28} /> Active Alerts
        </h1>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-dark-800/50 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Time</th>
                <th className="px-6 py-4 font-medium">User ID</th>
                <th className="px-6 py-4 font-medium">Severity</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {alerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-dark-700/30 transition-colors">
                  <td className="px-6 py-4 text-slate-300">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-slate-500" />
                      {new Date(alert.timestamp).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white font-medium">
                    {alert.user_id}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border inline-block
                      ${alert.severity === 'Critical' ? 'bg-danger/10 text-danger border-danger/20' : 
                        alert.severity === 'High' ? 'bg-warning/10 text-warning border-warning/20' : 
                        alert.severity === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                        'bg-success/10 text-success border-success/20'}`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300 max-w-md truncate">
                    {alert.description}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleResolve(alert.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-success/10 text-success hover:bg-success hover:text-white border border-success/20 rounded-lg text-sm font-medium transition-all"
                    >
                      <CheckCircle size={16} /> Resolve
                    </button>
                  </td>
                </tr>
              ))}
              {alerts.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <CheckCircle size={48} className="text-success mb-4 opacity-50" />
                      <p className="text-lg">No active alerts</p>
                      <p className="text-sm">Your network is secure</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Alerts;
