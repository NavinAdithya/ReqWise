import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { 
  Bell, 
  LogOut, 
  LayoutDashboard, 
  FileText, 
  CheckSquare, 
  BarChart3, 
  FolderLock,
  History,
  ClipboardList,
  Users
} from 'lucide-react';

interface SidebarLink {
  to: string;
  label: string;
  icon: React.ReactNode;
}

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, notifications, fetchNotifications, markNotificationRead } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getLinks = (): SidebarLink[] => {
    if (!user) return [];
    switch (user.role) {
      case 'ADMIN':
        return [
          { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
          { to: '/projects', label: 'Projects', icon: <FolderLock size={18} /> },
          { to: '/review', label: 'Admin Review', icon: <ClipboardList size={18} /> },
          { to: '/employees', label: 'Employees', icon: <Users size={18} /> },
          { to: '/analytics', label: 'Analytics', icon: <BarChart3 size={18} /> }
        ];
      case 'QA':
        return [
          { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
          { to: '/analysis', label: 'QA Workspace', icon: <CheckSquare size={18} /> },
          { to: '/history', label: 'History', icon: <History size={18} /> }
        ];
      case 'CLIENT':
        return [
          { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
          { to: '/recommendations', label: 'Decisions', icon: <FileText size={18} /> },
          { to: '/history', label: 'History', icon: <History size={18} /> }
        ];
      default:
        return [];
    }
  };

  const links = getLinks();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen w-screen bg-transparent overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-60 border-r border-slate-200/60 bg-white/70 backdrop-blur-xl flex flex-col z-20">
        <div className="h-14 flex items-center px-6 border-b border-slate-100">
          <span className="text-sm font-bold tracking-wider text-slate-800 uppercase">
            Req<span className="text-brand-600">wise</span>
          </span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-brand-50 to-transparent text-brand-700 shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-100/50 hover:text-slate-900'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 flex flex-col space-y-2">
          <div className="flex items-center space-x-3 px-2">
            <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center font-semibold text-slate-700 text-xs uppercase">
              {(user?.name || 'US').slice(0, 2)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold text-slate-800 truncate">{user?.name}</p>
              <p className="text-[10px] font-medium text-brand-600 tracking-wider uppercase">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-2 py-2 text-slate-500 hover:text-red-600 rounded text-xs font-medium transition-all duration-150"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Top Header */}
        <header className="h-14 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl flex items-center justify-between px-8 relative z-30">
          <h1 className="text-sm font-semibold text-slate-800">
            {links.find((l) => l.to === location.pathname)?.label || 'System'}
          </h1>

          <div className="flex items-center space-x-4">
            {/* Notification Button */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 hover:bg-slate-50 rounded text-slate-600 relative transition-all duration-150"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-brand-500 rounded-full border border-white"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded shadow-sm py-2 z-50 text-xs scale-in">
                  <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        {unreadCount} New
                      </span>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-center py-6 text-slate-400">No notifications.</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          onClick={() => markNotificationRead(n._id)}
                          className={`px-4 py-2.5 border-b border-slate-50 cursor-pointer transition-all duration-150 ${
                            n.read ? 'opacity-60' : 'bg-brand-50/30'
                          }`}
                        >
                          <p className="font-medium text-slate-800">{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(n.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-8 fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
