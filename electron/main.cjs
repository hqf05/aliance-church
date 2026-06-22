// electron/main.cjs
const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("path");

let mainWin = null;
let screenWin = null;

function createMainWindow() {
  mainWin = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "../build/icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWin.webContents.on("did-fail-load", (_e, code, desc, url) => {
    console.log("❌ did-fail-load:", code, desc, url);
  });

  const startUrl = process.env.ELECTRON_START_URL || "http://localhost:3000";
  mainWin.loadURL(startUrl);
  mainWin.on("closed", () => {
    mainWin = null;
  });
}

function getScreenBase() {
  return process.env.ELECTRON_SCREEN_URL || "http://localhost:3000/screen";
}

function createScreenWindow(initialText) {
  if (screenWin) {
    screenWin.show();
    return false;
  }

  const displays = screen.getAllDisplays();
  const external =
    displays.find((d) => d.bounds.x !== 0 || d.bounds.y !== 0) || displays[0];

  screenWin = new BrowserWindow({
    x: external.bounds.x,
    y: external.bounds.y,
    width: external.bounds.width,
    height: external.bounds.height,
    fullscreen: displays.length > 1,
    frame: displays.length === 1,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // ✅ إذا في نص ابدئي، مرره في URL حتى تظهر الكلمات فوراً بدون تأخير
  let loadUrl = getScreenBase();
  if (initialText) {
    loadUrl += "?text=" + encodeURIComponent(initialText);
  }

  screenWin.loadURL(loadUrl);
  screenWin.on("closed", () => {
    screenWin = null;
  });
  return true;
}

app.whenReady().then(() => {
  createMainWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ============================
// IPC Handlers
// ============================

ipcMain.handle("openScreenWindow", async () => {
  createScreenWindow(null);
});

ipcMain.handle("closeScreenWindow", async () => {
  if (screenWin) {
    screenWin.close();
    screenWin = null;
  }
});

// ✅ إرسال نص للشاشة
ipcMain.handle("presentText", async (_event, payload) => {
  const text = payload?.text ?? "";

  if (!screenWin) {
    // ✅ النافذة مو مفتوحة: افتحها مع النص في URL فوراً
    createScreenWindow(text);
  } else {
    // ✅ النافذة مفتوحة: أرسل مباشرة بدون تأخير
    screenWin.webContents.send("presentText", text);
  }
});

// إظهار شاشة الشعار
ipcMain.handle("showIdle", async () => {
  if (screenWin) screenWin.webContents.send("showIdle");
});

// الشاشة السوداء
ipcMain.handle("setBlack", async (_event, isBlack) => {
  if (!screenWin) return;
  screenWin.webContents.send("black", Boolean(isBlack));
});

ipcMain.on("font:reset", () => {
  if (screenWin) screenWin.webContents.send("font:reset");
});

ipcMain.on("font:change", (_event, delta) => {
  if (screenWin) screenWin.webContents.send("font:change", delta);
});
