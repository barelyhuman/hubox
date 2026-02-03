import { invoke } from '@tauri-apps/api/core';
import type { HuBoxNotification, NotificationDetails, NotificationStats } from './types';

export const tauriAPI = {
  // Token management
  async saveToken(token: string): Promise<void> {
    return invoke('save_token', { token });
  },

  async getToken(): Promise<string | null> {
    return invoke('get_token');
  },

  async deleteToken(): Promise<void> {
    return invoke('delete_token');
  },

  // Notification manager
  async initializeManager(token: string): Promise<void> {
    return invoke('initialize_manager', { token });
  },

  async syncNotifications(): Promise<void> {
    return invoke('sync_notifications');
  },

  async getInProgress(): Promise<HuBoxNotification[]> {
    return invoke('get_in_progress');
  },

  async getAllNotifications(): Promise<HuBoxNotification[]> {
    return invoke('get_all_notifications');
  },

  async getDoneNotifications(): Promise<HuBoxNotification[]> {
    return invoke('get_done_notifications');
  },

  async getNotificationDetails(id: string): Promise<NotificationDetails> {
    return invoke('get_notification_details', { id });
  },

  async markAsRead(id: string): Promise<void> {
    return invoke('mark_as_read', { id });
  },

  async markAsDone(id: string): Promise<void> {
    return invoke('mark_as_done', { id });
  },

  async expandInbox(): Promise<void> {
    return invoke('expand_inbox');
  },

  async getStats(): Promise<NotificationStats> {
    return invoke('get_stats');
  },
};
