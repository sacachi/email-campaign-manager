import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setSidebarOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="layout-wrapper">
      {/* Sidebar */}
      <aside className={`layout-sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="flex items-center gap-3">
            <i className="pi pi-megaphone" style={{ fontSize: '1.5rem', color: '#60a5fa' }} />
            <div>
              <h1 className="text-base font-bold text-white m-0">Campaign</h1>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Manager</span>
            </div>
          </div>
        </div>

        <div className="sidebar-section-title">Main Menu</div>
        <ul className="sidebar-menu">
          <li>
            <NavLink to="/dashboard" end>
              <i className="pi pi-chart-bar" />
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/campaigns" end>
              <i className="pi pi-list" />
              <span>All Campaigns</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/campaigns/new">
              <i className="pi pi-plus-circle" />
              <span>New Campaign</span>
            </NavLink>
          </li>
        </ul>

        <div className="sidebar-section-title">Management</div>
        <ul className="sidebar-menu">
          <li>
            <NavLink to="/recipients">
              <i className="pi pi-users" />
              <span>Recipients</span>
            </NavLink>
          </li>
        </ul>

        {/* User section at bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="px-4 py-3">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 32,
                  height: 32,
                  background: 'rgba(96,165,250,0.2)',
                  color: '#60a5fa',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white m-0 truncate">{user?.name || 'User'}</p>
                <p className="text-xs m-0 truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {user?.email || ''}
                </p>
              </div>
            </div>
            <ul className="sidebar-menu" style={{ padding: 0 }}>
              <li>
                <button onClick={handleLogout} style={{ padding: '0.5rem 0' }}>
                  <i className="pi pi-sign-out" />
                  <span>Sign Out</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="layout-main">
        <header className="layout-topbar">
          <div className="flex items-center gap-3">
            <button
              className="sidebar-toggle-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              <i className={`pi ${sidebarOpen ? 'pi-times' : 'pi-bars'}`} />
            </button>
          </div>
        </header>
        <main className="layout-content">
          {children}
        </main>
      </div>
    </div>
  );
}
