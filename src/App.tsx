import { useEffect, useState } from 'react';
import { tauriAPI } from './api';
import type { HuBoxNotification, NotificationDetails, NotificationStats, ViewType } from './types';
import Titlebar from './components/Titlebar';
import TokenSetup from './components/TokenSetup';
import Sidebar from './components/Sidebar';
import NotificationList from './components/NotificationList';
import DetailPane from './components/DetailPane';
import './App.css';

function App() {
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [activeView, setActiveView] = useState<ViewType>('inbox');
  const [notifications, setNotifications] = useState<HuBoxNotification[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [details, setDetails] = useState<NotificationDetails | null>(null);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for token on mount
  useEffect(() => {
    checkToken();
  }, []);

  // Set up background sync
  useEffect(() => {
    if (hasToken) {
      const interval = setInterval(() => {
        tauriAPI.syncNotifications().then(() => {
          loadViewData();
          loadStats();
        }).catch(console.error);
      }, 300000); // 5 minutes

      return () => clearInterval(interval);
    }
  }, [hasToken, activeView]);

  // Load data when view changes
  useEffect(() => {
    if (hasToken) {
      loadViewData();
      loadStats();
    }
  }, [activeView, hasToken]);

  async function checkToken() {
    try {
      const token = await tauriAPI.getToken();
      if (token) {
        await tauriAPI.initializeManager(token);
        setHasToken(true);
        await tauriAPI.syncNotifications();
      } else {
        setHasToken(false);
      }
    } catch (err) {
      console.error('Token check failed:', err);
      setHasToken(false);
    }
  }

  async function handleTokenSubmit(token: string) {
    setLoading(true);
    setError(null);
    try {
      await tauriAPI.saveToken(token);
      await tauriAPI.initializeManager(token);
      await tauriAPI.syncNotifications();
      setHasToken(true);
    } catch (err: any) {
      setError(err.message || 'Failed to validate token');
      await tauriAPI.deleteToken();
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await tauriAPI.deleteToken();
    setHasToken(false);
    setNotifications([]);
    setSelectedId(null);
    setDetails(null);
    setStats(null);
  }

  async function loadViewData() {
    try {
      let data: HuBoxNotification[];
      switch (activeView) {
        case 'inbox':
          data = await tauriAPI.getInProgress();
          break;
        case 'all':
          data = await tauriAPI.getAllNotifications();
          break;
        case 'done':
          data = await tauriAPI.getDoneNotifications();
          break;
      }
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }

  async function loadStats() {
    try {
      const statsData = await tauriAPI.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }

  async function handleSelectNotification(id: string) {
    setSelectedId(id);
    setDetails(null);
    
    // Mark as read
    await tauriAPI.markAsRead(id);
    
    // Fetch details
    try {
      const detailsData = await tauriAPI.getNotificationDetails(id);
      setDetails(detailsData);
    } catch (err) {
      console.error('Failed to load details:', err);
    }
    
    // Refresh stats
    loadStats();
  }

  async function handleMarkAsDone(id: string) {
    await tauriAPI.markAsDone(id);
    setSelectedId(null);
    setDetails(null);
    await loadViewData();
    await loadStats();
  }

  async function handlePullMore() {
    await tauriAPI.expandInbox();
    await loadViewData();
  }

  if (hasToken === null) {
    return (
      <div className="app loading">
        <div>Loading...</div>
      </div>
    );
  }

  if (!hasToken) {
    return <TokenSetup onSubmit={handleTokenSubmit} loading={loading} error={error} />;
  }

  return (
    <>
      <Titlebar />
      <div className="app">
        <Sidebar
          activeView={activeView}
          onViewChange={(view) => {
            setActiveView(view);
            setSelectedId(null);
            setDetails(null);
          }}
          stats={stats}
          onLogout={handleLogout}
        />
        <NotificationList
          view={activeView}
        notifications={notifications}
        selectedId={selectedId}
        onSelect={handleSelectNotification}
        onPullMore={handlePullMore}
      />
      <DetailPane
        details={details}
        onMarkAsDone={handleMarkAsDone}
      />
    </div>
    </>
  );
}

export default App;
