import { marked } from 'marked';
import DOMPurify from 'dompurify';
import type { NotificationDetails } from '../types';
import { formatRelativeTime, humanizeReason, getReasonColor } from '../utils';
import { openUrl } from '@tauri-apps/plugin-opener';
import { Inbox, GitPullRequest, AlertCircle, Check, ExternalLink, MessageSquare } from 'lucide-react';

interface DetailPaneProps {
  details: NotificationDetails | null;
  onMarkAsDone: (id: string) => void;
}

export default function DetailPane({ details, onMarkAsDone }: DetailPaneProps) {
  if (!details) {
    return (
      <div className="detail-pane">
        <div className="detail-empty">
          <div className="detail-empty-icon"><Inbox size={48} strokeWidth={1.5} /></div>
          <div className="detail-empty-text">Select a notification</div>
        </div>
      </div>
    );
  }

  const { notification, comments, pull_request } = details;
  const prState = pull_request?.state;
  const prMerged = pull_request?.merged;

  const renderMarkdown = (text: string) => {
    const html = marked.parse(text) as string;
    const clean = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a', 'code', 'pre', 'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      ALLOWED_ATTR: ['href', 'title'],
    });
    return { __html: clean };
  };

  const openInGitHub = async () => {
    if (notification.subject.url) {
      // Convert API URL to web URL
      const webUrl = notification.subject.url
        .replace('api.github.com/repos/', 'github.com/')
        .replace('/pulls/', '/pull/')
        .replace('/issues/', '/issues/');
      await openUrl(webUrl);
    }
  };

  const getPRStateBadge = () => {
    if (prMerged) {
      return <span className="pr-badge merged">Merged</span>;
    }
    if (prState === 'closed') {
      return <span className="pr-badge closed">Closed</span>;
    }
    if (prState === 'open') {
      return <span className="pr-badge open">Open</span>;
    }
    return null;
  };

  return (
    <div className="detail-pane">
      <div className="detail-scroll">
        <div className="detail-header">
          <div className="detail-type">
            <span className="type-icon">
              {notification.subject.type === 'PullRequest' ? (
                <GitPullRequest size={20} />
              ) : (
                <AlertCircle size={20} />
              )}
            </span>
            <span className="type-label">{notification.subject.type === 'PullRequest' ? 'Pull Request' : 'Issue'}</span>
          </div>
          <h1 className="detail-title">{notification.subject.title}</h1>
          <div className="detail-repo">{notification.repository.full_name}</div>
        </div>

        <div className="detail-metadata">
          {notification.subject.type === 'PullRequest' && getPRStateBadge()}
          <span className={`reason-badge ${getReasonColor(notification.reason)}`}>
            {humanizeReason(notification.reason)}
          </span>
          <span className="detail-time">{formatRelativeTime(notification.updated_at)}</span>
        </div>

        <div className="detail-actions">
          <button 
            className="action-button primary"
            onClick={() => onMarkAsDone(notification.id)}
          >
            <Check size={16} />
            <span>Done</span>
          </button>
          <button className="action-button secondary" onClick={openInGitHub}>
            <ExternalLink size={16} />
            <span>Open on GitHub</span>
          </button>
        </div>

        <div className="detail-comments">
          <h3><MessageSquare size={18} style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'text-bottom' }} />Comments</h3>
          {!comments ? (
            <div className="comments-loading">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="comments-empty">No comments yet</div>
          ) : (
            <div className="comments-list">
              {comments.map((comment) => (
                <div key={comment.id} className="comment-card">
                  <div className="comment-header">
                    <span className="comment-author">{comment.user.login}</span>
                    <span className="comment-time">{formatRelativeTime(comment.created_at)}</span>
                  </div>
                  <div 
                    className="comment-body"
                    dangerouslySetInnerHTML={renderMarkdown(comment.body)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
