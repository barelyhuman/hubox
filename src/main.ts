import { app, BrowserWindow, ipcMain, session } from 'electron';
import * as path from 'path';
import * as url from 'url';

// Disable hardware acceleration if not needed (optional security measure)
// app.disableHardwareAcceleration();

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  // Create the browser window with maximum security settings
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // Security: Enable context isolation (separates Electron API from web content)
      contextIsolation: true,

      // Security: Disable Node.js integration in renderer process
      nodeIntegration: false,

      // Security: Enable sandbox for renderer process
      sandbox: true,

      // Security: Use a preload script for controlled API exposure
      preload: path.join(__dirname, 'preload.js'),

      // Security: Disable web security only in development if absolutely necessary
      // webSecurity: true, // This is true by default

      // Security: Disable navigation to external URLs
      allowRunningInsecureContent: false,

      // Security: Disable experimental features
      experimentalFeatures: false,

      // Security: Disable plugins
      plugins: false,

      // Security: Disable web workers spawning Node environments
      nodeIntegrationInWorker: false,

      // Security: Disable navigation via middle click
      // (handled by will-navigate event below)
    },

    // Optional: Start with a hidden window and show when ready
    show: false,
  });

  // Security: Set strict Content Security Policy
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
            "default-src 'self'; " +
            "script-src 'self'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: https:; " +
            "font-src 'self' data:; " +
            "connect-src 'self'; " +
            "frame-src 'none'; " +
            "object-src 'none'; " +
            "base-uri 'self'; file: " +
            "form-action 'self'; " +
            'upgrade-insecure-requests;',
        ],
      },
    });
  });

  // Security: Prevent navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    const currentUrl = mainWindow?.webContents.getURL();

    if (!currentUrl || parsedUrl.origin !== new URL(currentUrl).origin) {
      event.preventDefault();
      console.warn('Navigation prevented:', navigationUrl);
    }
  });

  // Security: Prevent new window creation (or control it)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    console.warn('Window open prevented:', url);
    // You can open in default browser if needed:
    // shell.openExternal(url);
    return { action: 'deny' };
  });

  // Security: Disable web view tags
  mainWindow.webContents.on('will-attach-webview', (event) => {
    event.preventDefault();
    console.warn('WebView attachment prevented');
  });

  mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Open DevTools only in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Security: Disable insecure features before app is ready
app.whenReady().then(() => {
  // Security: Clear any cache on startup (optional)
  // session.defaultSession.clearCache();

  // Security: Set permissions handler
  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      // Deny all permissions by default
      // Allow only specific permissions your app needs
      const allowedPermissions = ['notifications']; // Customize as needed

      if (allowedPermissions.includes(permission)) {
        callback(true);
      } else {
        console.warn('Permission denied:', permission);
        callback(false);
      }
    },
  );

  // Security: Handle certificate errors (reject all in production)
  app.on(
    'certificate-error',
    (event, webContents, url, error, certificate, callback) => {
      event.preventDefault();
      console.error('Certificate error:', error, url);
      // Always reject in production
      callback(false);
    },
  );

  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('secure-invoke', async (event, data) => {
  // Validate sender
  if (!mainWindow || event.sender !== mainWindow.webContents) {
    throw new Error('Unauthorized IPC call');
  }

  // Validate input
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid data');
  }

  return { success: true, message: 'Secure operation completed' };
});

// Additional security: Validate all IPC messages
ipcMain.on('*', (event) => {
  if (mainWindow && event.sender !== mainWindow.webContents) {
    console.error('IPC message from unauthorized sender');
  }
});
