const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  connectScreen: () => ipcRenderer.invoke("connect-screen"),
  presentText: (text) => ipcRenderer.invoke("present-text", { text }),
  setBlack: (black) => ipcRenderer.invoke("black-screen", { black }),

  onPresentText: (cb) => ipcRenderer.on("present-text", (_e, text) => cb(text)),
  onBlack: (cb) => ipcRenderer.on("black-screen", (_e, black) => cb(black)),
});