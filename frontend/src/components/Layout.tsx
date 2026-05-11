import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Settings, Home, Zap, BarChart3, Menu } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } transition-all duration-300 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800 flex flex-col`}
      >
        <div className="flex items-center justify-between p-4">
          {sidebarOpen && <h1 className="text-xl font-bold text-white">TradeAI</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white">
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-2">
          {[
            { icon: Home, label: 'Dashboard', path: '/' },
            { icon: Zap, label: 'Bots', path: '/bots' },
            { icon: BarChart3, label: 'Analytics', path: '/analytics' },
            { icon: Settings, label: 'Settings', path: '/settings' },
          ].map(({ icon: Icon, label, path }) => (
            <Link
              key={path}
              to={path}
              className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Icon size={20} />
              {sidebarOpen && <span>{label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
          {sidebarOpen && <p className="text-xs text-slate-500 mt-4 truncate">{user?.email}</p>}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
