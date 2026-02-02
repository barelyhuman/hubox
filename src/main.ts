import { app, BrowserWindow, ipcMain, session } from "electron";
import * as path from "path";
import { fileURLToPath } from "url";
import { registerGithubAPI } from "./lib/github";
import { registerTokenAPI } from "./lib/token-store";
import { shell } from "electron";

// Disable hardware acceleration if not needed (optional security measure)
// app.disableHardwareAcceleration();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  // Create the browser window with maximum security settings
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: "hidden",
    webPreferences: {
      // Security: Enable context isolation (separates Electron API from web content)
      contextIsolation: true,

      // Security: Disable Node.js integration in renderer process
      nodeIntegration: false,

      // Security: Enable sandbox for renderer process
      sandbox: true,

      // Security: Use a preload script for controlled API exposure
      preload: path.join(__dirname, "preload.js"),

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
        "Content-Security-Policy": [
          "default-src 'self'; " +
            "script-src 'self'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: https:; " +
            "font-src 'self' data:; " +
            "connect-src 'self'; " +
            "frame-src 'none'; " +
            "object-src 'none'; " +
            "base-uri 'self' file:;" +
            "form-action 'self'; " +
            "upgrade-insecure-requests;",
        ],
      },
    });
  });

  // Security: Prevent navigation to external URLs
  mainWindow.webContents.on("will-navigate", (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    const currentUrl = mainWindow?.webContents.getURL();

    if (!currentUrl || parsedUrl.origin !== new URL(currentUrl).origin) {
      event.preventDefault();
      console.warn("Navigation prevented:", navigationUrl);
    }
  });

  // Security: Prevent new window creation (or control it)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const _url = new URL(url);
      if (["https:", "http:"].includes(_url.protocol)) {
        shell.openExternal(url);
        return { action: "deny" };
      }
      return { action: "deny" };
    } catch (err) {
      return { action: "deny" };
    }
  });

  // Security: Disable web view tags
  mainWindow.webContents.on("will-attach-webview", (event) => {
    event.preventDefault();
    console.warn("WebView attachment prevented");
  });

  // Set up window event listeners before loading content
  mainWindow.on("maximize", () => {
    mainWindow?.webContents.send("window-maximized");
  });

  mainWindow.on("unmaximize", () => {
    mainWindow?.webContents.send("window-unmaximized");
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Show window when ready to prevent visual flash
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    // Send initial maximize state to renderer
    if (mainWindow?.isMaximized()) {
      mainWindow?.webContents.send("window-maximized");
    }
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
      const allowedPermissions = ["notifications"]; // Customize as needed

      if (allowedPermissions.includes(permission)) {
        callback(true);
      } else {
        console.warn("Permission denied:", permission);
        callback(false);
      }
    },
  );

  // Security: Handle certificate errors (reject all in production)
  app.on(
    "certificate-error",
    (event, webContents, url, error, certificate, callback) => {
      event.preventDefault();
      console.error("Certificate error:", error, url);
      // Always reject in production
      callback(false);
    },
  );

  createWindow();

  registerGithubAPI(ipcMain, app, mainWindow);
  registerTokenAPI(ipcMain, app, mainWindow);

  // Window control handlers
  ipcMain.on("window-control", (event, action) => {
    if (!mainWindow || event.sender !== mainWindow.webContents) {
      return;
    }

    switch (action) {
      case "minimize":
        mainWindow.minimize();
        break;
      case "maximize":
        if (mainWindow.isMaximized()) {
          mainWindow.unmaximize();
        } else {
          mainWindow.maximize();
        }
        break;
      case "close":
        mainWindow.close();
        break;
    }
  });

  app.on("activate", () => {
    // On macOS it's common to re-create a window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
