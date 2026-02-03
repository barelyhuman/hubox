export interface HuBoxNotification {
  id: string;
  reason: string;
  repository: Repository;
  subject: Subject;
  updated_at: string;
  unread: boolean;
  url: string;
  is_read?: boolean;
  is_done?: boolean;
  priority?: number;
  last_viewed_at?: number;
}

export interface Repository {
  full_name: string;
  owner: Owner;
  name: string;
}

export interface Owner {
  login: string;
}

export interface Subject {
  title: string;
  type: string;
  url?: string;
  latest_comment_url?: string;
}

export interface NotificationDetails {
  notification: HuBoxNotification;
  comments?: Comment[];
  issue?: any;
  pull_request?: any;
}

export interface Comment {
  id: number;
  user: User;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  login: string;
  avatar_url: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  app_unread: number;
  done: number;
  in_progress: number;
  last_sync: number;
  is_online: boolean;
}

export type ViewType = 'inbox' | 'all' | 'done';
