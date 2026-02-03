import type { ViewType, NotificationStats } from '../types';
import { formatRelativeTime } from '../utils';
import { Inbox, List, CheckCircle, LogOut } from 'lucide-react';

interface SidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  stats: NotificationStats | null;
  onLogout: () => void;
}

export default function Sidebar({ activeView, onViewChange, stats, onLogout }: SidebarProps) {
  return (
    <div className="sidebar">
      {/* <div className="sidebar-header">
        <h1 className="logo">hubox</h1>
      </div> */}
      
      <nav className="sidebar-nav">
        <button
          className={`nav-item ${activeView === 'inbox' ? 'active' : ''}`}
          onClick={() => onViewChange('inbox')}
        >
          <span className="nav-icon"><Inbox size={18} /></span>
          <span className="nav-label">Inbox</span>
          {stats && stats.app_unread > 0 && (
            <span className="nav-badge">{stats.app_unread}</span>
          )}
        </button>
        
        <button
          className={`nav-item ${activeView === 'all' ? 'active' : ''}`}
          onClick={() => onViewChange('all')}
        >
          <span className="nav-icon"><List size={18} /></span>
          <span className="nav-label">All</span>
          {stats && (
            <span className="nav-badge">{stats.total}</span>
          )}
        </button>
        
        <button
          className={`nav-item ${activeView === 'done' ? 'active' : ''}`}
          onClick={() => onViewChange('done')}
        >
          <span className="nav-icon"><CheckCircle size={18} /></span>
          <span className="nav-label">Done</span>
          {stats && (
            <span className="nav-badge">{stats.done}</span>
          )}
        </button>
      </nav>
      
      <div className="sidebar-footer">
        <div className="sync-status">
          <span className={`status-dot ${stats?.is_online ? 'online' : 'offline'}`}></span>
          <span className="sync-time">
            {stats?.last_sync ? formatRelativeTime(new Date(stats.last_sync).toISOString()) : 'Never'}
          </span>
        </div>
        <button className="logout-button" onClick={onLogout}>
          <LogOut size={16} />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );
}
