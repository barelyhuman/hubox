# Hubox - GitHub Notification Inbox Manager

A desktop application built with Tauri that provides a rolling inbox system for managing GitHub notifications. Hubox helps developers focus on a manageable subset of notifications while maintaining an offline-first architecture.

## Features

### Core Functionality

- **Rolling Inbox System**: Displays a limited number of active notifications (default: 10) at a time. When items are marked as done, new ones automatically backfill.
- **Offline-First Architecture**: Works completely offline after initial sync with automatic background synchronization every 5 minutes.
- **Secure Token Storage**: GitHub Personal Access Tokens are encrypted and stored using OS-level encryption (Keychain on macOS, DPAPI on Windows, libsecret on Linux).
- **Three-View Interface**:
  - **Inbox**: Shows notifications in the rolling inbox (in-progress items)
  - **All**: Shows all cached notifications
  - **Done**: Shows completed notifications
- **Notification Details**: View full notification details with comments rendered in GitHub-flavored markdown
- **Background Sync**: Automatic synchronization with GitHub API every 5 minutes

### Technical Features

- **OS-Level Token Encryption**: Secure storage using platform-specific keychains
- **HTTP Response Caching**: 5-minute TTL to reduce API calls and avoid rate limiting
- **Custom State Management**: Track read/done status independently from GitHub's state
- **Content Security Policy**: Prevents XSS attacks and restricts resource loading
- **Markdown Sanitization**: Safe rendering of user-generated content

## Architecture

### Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Rust (Tauri)
- **UI**: Custom CSS with 3-column grid layout
- **Markdown**: Marked.js with DOMPurify sanitization

### Project Structure

```
hubox-tauri/
├── src/                      # Frontend React code
│   ├── components/          # React components
│   │   ├── TokenSetup.tsx
│   │   ├── Sidebar.tsx
│   │   ├── NotificationList.tsx
│   │   └── DetailPane.tsx
│   ├── api.ts               # Tauri API wrapper
│   ├── types.ts             # TypeScript type definitions
│   ├── utils.ts             # Utility functions
│   ├── App.tsx              # Main app component
│   └── App.css              # Application styles
└── src-tauri/               # Backend Rust code
    ├── src/
    │   ├── lib.rs                    # Main entry point with Tauri commands
    │   ├── types.rs                  # Rust type definitions
    │   ├── github.rs                 # GitHub API client
    │   ├── notification_manager.rs   # Core business logic
    │   └── storage/
    │       ├── token.rs              # Secure token storage
    │       ├── file_storage.rs       # JSON file persistence
    │       └── cache.rs              # HTTP response cache
    └── Cargo.toml
```

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- Rust (latest stable)
- System-specific requirements:
  - **macOS**: Xcode Command Line Tools
  - **Linux**: Build essentials, libwebkit2gtk-4.0-dev, etc.
  - **Windows**: Microsoft C++ Build Tools

### Installation

1. Clone the repository:
   ```bash
   cd hubox-tauri
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run in development mode:
   ```bash
   npm run tauri dev
   ```

4. Build for production:
   ```bash
   npm run tauri build
   ```

### GitHub Token Setup

1. Create a GitHub Personal Access Token:
   - Go to https://github.com/settings/tokens/new
   - Add description: "Hubox"
   - Select scope: `notifications`
   - Generate token

2. Launch Hubox and paste the token on the setup screen

3. The token will be securely encrypted and stored in your OS keychain

## Data Storage

Hubox stores data in `~/.hubox/`:

- `github-notifications.json`: All notifications with custom states
- `request-cache.json`: HTTP response cache with TTL

## Key Features Explained

### Rolling Inbox Algorithm

The inbox maintains a "rolling" list of active notifications:
1. Shows newest notifications first (sorted by `updated_at`)
2. Excludes notifications marked as done
3. Preserves currently active notifications
4. Automatically backfills when items are marked done
5. User can expand inbox size by clicking "Pull More" (+10 each time)

### Custom State Management

Hubox tracks custom states independent of GitHub:
- `isRead`: User viewed this notification (app-level)
- `isDone`: User marked as complete
- `priority`: Custom priority value (reserved for future use)
- `lastViewedAt`: Timestamp of last view

These states survive:
- App restarts (persisted to disk)
- GitHub sync operations (merge strategy preserves custom states)

### Offline Mode

The app works completely offline:
- Uses cached data when network is unavailable
- Syncs automatically when network is restored
- Shows online/offline status in sidebar
- State changes persist locally and sync later

## Security

### Implemented Security Measures

1. **OS-Level Token Encryption**: Tokens never stored in plain text
2. **Content Security Policy**: Restricts resource loading and prevents XSS
3. **Markdown Sanitization**: Allowlist-based HTML sanitization with DOMPurify
4. **Context Isolation**: Renderer process runs in sandboxed environment
5. **IPC Validation**: All commands validate sender origin

### CSP Configuration

```
default-src 'self'; 
connect-src 'self' https://api.github.com; 
img-src 'self' data: https:; 
style-src 'self' 'unsafe-inline'
```

## Development

### Available Scripts

- `npm run dev` - Start Vite dev server
- `npm run build` - Build frontend for production
- `npm run tauri dev` - Run Tauri app in development mode
- `npm run tauri build` - Build Tauri app for production

### Adding New Features

1. **Backend (Rust)**:
   - Add Tauri commands in `src-tauri/src/lib.rs`
   - Implement business logic in appropriate modules
   - Update types in `src-tauri/src/types.rs`

2. **Frontend (React)**:
   - Add API wrappers in `src/api.ts`
   - Create/update components in `src/components/`
   - Update types in `src/types.ts`

## Troubleshooting

### Token Validation Fails

- Ensure token has `notifications` scope
- Check network connectivity
- Verify token hasn't been revoked on GitHub

### Build Errors

- Run `cargo clean` and rebuild
- Ensure all system dependencies are installed
- Check Tauri prerequisites: https://tauri.app/v1/guides/getting-started/prerequisites

### App Won't Start

- Check logs in console
- Verify data directory permissions (`~/.hubox/`)
- Try removing cached data and re-syncing

## Contributing

This project was built from the specification in `/Users/sid/code/hubox/specs/base.md`. When contributing:

1. Follow the existing architecture patterns
2. Maintain type safety in both Rust and TypeScript
3. Add appropriate error handling
4. Update this README for significant changes

## License

[Add your license here]

## Acknowledgments

Built with:
- [Tauri](https://tauri.app/) - Desktop app framework
- [React](https://react.dev/) - UI library
- [Marked](https://marked.js.org/) - Markdown parser
- [DOMPurify](https://github.com/cure53/DOMPurify) - HTML sanitizer

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
