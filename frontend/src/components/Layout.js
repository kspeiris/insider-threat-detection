import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Bell, LogOut, ShieldAlert } from 'lucide-react';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
    { text: 'Alerts', icon: <Bell size={20} />, path: '/alerts' },
  ];

  return (
    <div className="flex h-screen bg-dark-900 text-slate-200 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col glass-panel m-4 z-20">
        <div className="p-6 flex items-center gap-3 border-b border-slate-700/50">
          <div className="p-2 bg-primary-500/20 rounded-lg text-primary-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            <ShieldAlert size={24} />
          </div>
          <h1 className="text-lg font-bold text-white tracking-wider">THREAT<span className="text-primary-500">OPS</span></h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <button
                key={item.text}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  active 
                    ? 'bg-primary-500/10 text-primary-500 border border-primary-500/20 shadow-inner' 
                    : 'text-slate-400 hover:bg-dark-700 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.text}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-700/50">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
