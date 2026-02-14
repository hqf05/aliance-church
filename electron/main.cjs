const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("path");

let mainWin = null;
let screenWin = null;

function createMainWindow() {
  mainWin = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const url = process.env.ELECTRON_START_URL || "http://localhost:3000";
  mainWin.loadURL(url);
}

function createScreenWindow() {
  const displays = screen.getAllDisplays();
  const external = displays.find((d) => d.bounds.x !== 0 || d.bounds.y !== 0) || displays[0];

  screenWin = new BrowserWindow({
    x: external.bounds.x,
    y: external.bounds.y,
    width: external.bounds.width,
    height: external.bounds.height,
    fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const url = process.env.ELECTRON_SCREEN_URL || "http://localhost:3000/screen";
  screenWin.loadURL(url);
}

app.whenReady().then(() => {
  createMainWindow();
  createScreenWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
      createScreenWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// IPC: إرسال النص للشاشة
ipcMain.on("present:text", (event, payload) => {
  if (!screenWin) return;
  screenWin.webContents.send("present:text", payload?.text || "");
});

ipcMain.on("present:black", (event, payload) => {
  if (!screenWin) return;
  screenWin.webContents.send("present:black", Boolean(payload?.isBlack));
});