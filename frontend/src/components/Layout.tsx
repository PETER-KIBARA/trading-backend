import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  ChevronRight,
  CircleDollarSign,
  type LucideIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navigation = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Target, label: 'Bots', path: '/bots' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: Shield, label: 'Settings', path: '/settings' },
  ];

  const NavItem = ({
    icon: Icon,
    label,
    path,
    compact = false,
  }: {
    icon: LucideIcon;
    label: string;
    path: string;
    compact?: boolean;
  }) => (
    <NavLink
      to={path}
      end={path === '/'}
      onClick={() => setMobileOpen(false)}
      className={({ isActive }) =>
        [
          'group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-white/10 text-white shadow-[0_0_30px_rgba(124,58,237,0.25)] ring-1 ring-white/10'
            : 'text-slate-300 hover:bg-white/5 hover:text-white',
          compact ? 'justify-center px-3' : '',
        ].join(' ')
      }
    >
      <Icon size={18} className="shrink-0" />
      {!compact && <span>{label}</span>}
      {!compact && <ChevronRight size={16} className="ml-auto opacity-0 transition group-hover:opacity-100" />}
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="app-bg" />

      {/* Mobile header */}
      <header className="sticky top-0 z-40 border-b border-white/8 bg-slate-950/70 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">TradeAI</p>
            <h1 className="text-lg font-semibold text-white">Trading Command Center</h1>
          </div>
          <button
            onClick={() => setMobileOpen((value) => !value)}
            className="rounded-2xl border border-white/10 bg-white/5 p-2 text-white"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      <div className="mx-auto flex min-h-screen max-w-[1800px]">
        {/* Sidebar */}
        <aside
          className={[
            'fixed inset-y-0 left-0 z-50 w-80 border-r border-white/8 bg-slate-950/90 px-4 py-5 backdrop-blur-xl transition-transform duration-300 lg:static lg:translate-x-0 lg:flex lg:w-[320px] lg:flex-col',
            mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
            sidebarOpen ? '' : 'lg:w-[108px]',
          ].join(' ')}
        >
          <div className="flex items-center justify-between gap-3 rounded-3xl border border-white/8 bg-white/5 px-4 py-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30">
                <Sparkles size={20} />
              </div>
              {sidebarOpen && (
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-400">TradeAI</p>
                  <h1 className="text-xl font-semibold text-white">Command Center</h1>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen((value) => !value)}
              className="hidden rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10 lg:grid"
              aria-label="Collapse sidebar"
            >
              <ChevronRight size={18} className={sidebarOpen ? '' : 'rotate-180'} />
            </button>
          </div>

          <div className="mt-6 rounded-3xl border border-white/8 bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-cyan-500/10 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-violet-200">
                <CircleDollarSign size={20} />
              </div>
              {sidebarOpen && (
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Connected user</p>
                  <p className="truncate text-sm font-semibold text-white">{user?.email || 'No account connected'}</p>
                </div>
              )}
            </div>
          </div>

          <nav className="mt-6 flex-1 space-y-2 overflow-y-auto pb-6 pr-1">
            {navigation.map(({ icon, label, path }) => (
              <NavItem key={path} icon={icon} label={label} path={path} compact={!sidebarOpen} />
            ))}
          </nav>

          <div className="space-y-3 border-t border-white/8 pt-4">
            <div className="rounded-3xl border border-white/8 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-500/15 text-cyan-300">
                  <Bell size={18} />
                </div>
                {sidebarOpen && (
                  <div>
                    <p className="text-sm font-semibold text-white">System status</p>
                    <p className="text-xs text-slate-400">All services online</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-2xl border border-red-500/15 bg-red-500/5 px-4 py-3 text-sm font-medium text-red-200 transition hover:bg-red-500/10"
            >
              <LogOut size={18} />
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>

          {mobileOpen && <button className="fixed inset-0 -z-10 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />}
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden lg:pl-0">
          <div className="flex min-h-screen flex-col">
            <div className="hidden border-b border-white/8 bg-slate-950/50 px-8 py-4 backdrop-blur-xl lg:block">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">TradeAI</p>
                  <h2 className="text-2xl font-semibold text-white">Trading Command Center</h2>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-2 text-sm text-slate-300">
                  {user?.firstName ? `Welcome back, ${user.firstName}` : 'Welcome back'}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto px-4 py-6 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-7xl">{children}</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
