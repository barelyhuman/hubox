import type { HuBoxNotification, ViewType } from '../types';
import { formatRelativeTime, humanizeReason } from '../utils';
import { CheckCircle, GitPullRequest, AlertCircle, ChevronDown } from 'lucide-react';

interface NotificationListProps {
  view: ViewType;
  notifications: HuBoxNotification[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onPullMore: () => void;
}

export default function NotificationList({
  view,
  notifications,
  selectedId,
  onSelect,
  onPullMore,
}: NotificationListProps) {
  const viewTitles: Record<ViewType, string> = {
    inbox: 'Inbox',
    all: 'All Notifications',
    done: 'Done',
  };

  return (
    <div className="notification-list">
      <div className="list-header">
        <h2>{viewTitles[view]}</h2>
      </div>
      
      <div className="list-scroll">
        {notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><CheckCircle size={48} strokeWidth={1.5} /></div>
            <div className="empty-text">All caught up</div>
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${selectedId === notification.id ? 'selected' : ''}`}
                onClick={() => onSelect(notification.id)}
              >
                {notification.unread && !notification.is_read && (
                  <div className="unread-indicator"></div>
                )}
                
                <div className="notification-content">
                  <div className="notification-icon">
                    {notification.subject.type === 'PullRequest' ? (
                      <GitPullRequest size={16} />
                    ) : (
                      <AlertCircle size={16} />
                    )}
                  </div>
                  
                  <div className="notification-body">
                    <div className="notification-title">{notification.subject.title}</div>
                    <div className="notification-meta">
                      <span className="repo-name">{notification.repository.name}</span>
                      <span className="meta-separator">·</span>
                      <span className="reason">{humanizeReason(notification.reason)}</span>
                      <span className="meta-separator">·</span>
                      <span className="time">{formatRelativeTime(notification.updated_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {view === 'inbox' && notifications.length > 0 && (
              <button className="pull-more-button" onClick={onPullMore}>
                <ChevronDown size={16} />
                <span>Pull More</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
