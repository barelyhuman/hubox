# GitHub Notifications Store

A robust offline-first notification manager for GitHub notifications in Electron applications.

## Features

### ✅ Completed

- **Offline Support**: All notifications are cached locally and work offline
- **Smart Syncing**: Automatically syncs with GitHub when online, preserves data when offline
- **Custom Read State**: Maintain your own read/unread state independent of GitHub's state
- **Priority Management**: Assign custom priorities to notifications
- **Done State**: Mark notifications as "done" to remove them from your active list
- **In-Progress View**: Shows the newest unread 10 notifications by default (configurable)
- **Fetch All**: Ability to fetch all notifications from GitHub
- **Rich Details**: Fetch complete issue/PR details including comments
- **Persistent Cache**: Both notifications and HTTP requests are cached to disk
- **Statistics**: Get comprehensive stats about your notifications

## Architecture

### Components

1. **NotificationManager** (`src/github-store/index.ts`)
   - Main class for managing GitHub notifications
   - Handles fetching, syncing, and state management
   - Persists data to disk for offline access

2. **RequestCache** (`src/github-store/request-cache.ts`)
   - Caches HTTP requests to reduce API calls
   - Persists cache to disk for offline access
   - Configurable TTL (default: 5 minutes)

3. **IPC Handlers** (`src/main.ts`)
   - Secure IPC communication between main and renderer
   - Exposes NotificationManager methods to renderer

4. **Preload API** (`src/preload.ts`)
   - Safe API exposure to renderer process
   - Type-safe interface for renderer

## Usage

### In Main Process

```typescript
import { NotificationManager } from './github-store';

// Provide storage path (e.g., Electron's userData path, or any directory)
const storagePath = '/path/to/storage';
const manager = new NotificationManager(GITHUB_TOKEN, 10, storagePath);

// Get in-progress notifications (newest unread 10)
const inProgress = await manager.getInProgress();

// Get all notifications
const all = await manager.getAll();

// Sync with GitHub
await manager.sync();

// Get detailed information about a notification
const details = await manager.getNotificationDetails(notificationId);

// Mark as read (app-level state)
await manager.markAsRead(notificationId);

// Mark as done (removes from in-progress)
await manager.markAsDone(notificationId);

// Set priority
await manager.setPriority(notificationId, 5);

// Get statistics
const stats = manager.getStats();
```

### In Renderer Process

```typescript
// Get in-progress notifications
const notifications = await window.githubAPI.getInProgress();

// Get all notifications
const all = await window.githubAPI.getAll();

// Sync
await window.githubAPI.sync();

// Get details
const details = await window.githubAPI.getDetails(notificationId);

// Mark as read
await window.githubAPI.markAsRead(notificationId);

// Mark as done
await window.githubAPI.markAsDone(notificationId);

// Mark as unread
await window.githubAPI.markAsUnread(notificationId);

// Set priority
await window.githubAPI.setPriority(notificationId, 5);

// Get stats
const stats = await window.githubAPI.getStats();
```

## Data Model

### HuBoxNotification

```typescript
{
  id: string;
  reason: string; // e.g., "mention", "author", "comment"
  repository: {
    full_name: string;
    owner: { login: string };
    name: string;
  };
  subject: {
    title: string;
    type: string; // "Issue", "PullRequest", etc.
    url: string | null;
    latest_comment_url: string | null;
  };
  updated_at: string;
  unread: boolean; // GitHub's unread state
  url: string;

  // App-level custom state
  isRead?: boolean; // Your custom read state
  isDone?: boolean; // Marked as done
  priority?: number; // Custom priority
  lastViewedAt?: number; // Timestamp
}
```

### NotificationStats

```typescript
{
  total: number; // Total notifications cached
  unread: number; // GitHub unread count
  appUnread: number; // App-level unread count
  done: number; // Marked as done
  inProgress: number; // Currently in-progress
  lastSync: number; // Last sync timestamp
  isOnline: boolean; // Online/offline status
}
```

## Storage

All data is stored in the Electron user data directory:

- **Notifications**: `github-notifications.json`
  - All notifications with custom states
  - Last sync timestamp
  - Custom state mappings

- **Request Cache**: `request-cache.json`
  - HTTP request cache
  - TTL-based expiration

## Configuration

### Environment Variables

- `GITHUB_TOKEN`: Your GitHub personal access token (required)
  - Constructor Parameters

- `token`: GitHub personal access token (required)
- `maxActive`: Maximum number of in-progress notifications (required)
- `storagePath`: Directory path for storing notifications and cache (required)
- `cacheTTL`: Request cache TTL in milliseconds (optional,
- `maxActive`: Maximum number of in-progress notifications (default: 10)
- `ttl`: Request cache TTL in milliseconds (default: 300000 / 5 minutes)

## Testing

```bash
# Set your GitHub token
export GITHUB_TOKEN=your_token_here

# Run tests
pnpm test
```

## Security

- All IPC handlers validate the sender
- Secure contextBridge API exposure
- No direct Node.js access from renderer
- Token stored securely via environment variables

## Future Enhancements

Possible additions:
- [ ] Notification filtering by repository/type
- [ ] Search functionality
- [ ] Export/import notification states
- [ ] Notification grouping by repository
- [ ] Desktop notifications for new items
- [ ] Keyboard shortcuts
- [ ] Multi-account support
