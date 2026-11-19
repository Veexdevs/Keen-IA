/**
 * Keew IA — desktop window.
 *
 * The desktop app loads the deployed site, so an update to the site is an
 * update to the app: there is no second copy of the interface to keep in
 * step. Links that leave Keew open in the real browser, and the login
 * redirects still land back inside this window.
 */
const { app, BrowserWindow, shell, session } = require("electron");
const path = require("node:path");

const APP_URL = process.env.KEEW_URL || "https://keew-ia.vercel.app";
const APP_ORIGIN = new URL(APP_URL).origin;

/** @type {BrowserWindow | null} */
let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 420,
    minHeight: 560,
    backgroundColor: "#0a0a0a",
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
    },
  });

  win.once("ready-to-show", () => win && win.show());

  /* the app's own pages stay in the window; everything else goes to a browser */
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(APP_ORIGIN)) return { action: "allow" };
    void shell.openExternal(url);
    return { action: "deny" };
  });

  win.webContents.on("will-navigate", (event, url) => {
    if (url.startsWith(APP_ORIGIN)) return;
    event.preventDefault();
    void shell.openExternal(url);
  });

  win.on("closed", () => {
    win = null;
  });

  void win.loadURL(APP_URL);
}

/* only one window, ever — a second launch focuses the first */
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
  });

  app.whenReady().then(() => {
    /* microphone for dictation, camera for attachments, notifications */
    session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
      const allowed = new Set(["media", "notifications", "clipboard-read"]);
      callback(allowed.has(permission));
    });

    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
