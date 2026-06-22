// electron/preload.cjs
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // شاشة العرض
  openScreenWindow: () => ipcRenderer.invoke("openScreenWindow"),
  closeScreenWindow: () => ipcRenderer.invoke("closeScreenWindow"),

  // إرسال نص للشاشة
  presentText: (payload) => ipcRenderer.invoke("presentText", payload),
  sendToScreen: (text) => ipcRenderer.send("sendToScreen", text),

  // ✅ إظهار شاشة الشعار عند الطلب
  showIdle: () => ipcRenderer.invoke("showIdle"),

  // الشاشة السوداء
  setBlack: (b) => ipcRenderer.invoke("setBlack", b),

  // الخط
  changeFont: (delta) => ipcRenderer.send("font:change", delta),
  resetFont: () => ipcRenderer.send("font:reset"),

  // استقبال أحداث (للشاشة الثانية)
  onPresentText: (cb) => ipcRenderer.on("presentText", (_e, text) => cb(text)),
  onBlack: (cb) => ipcRenderer.on("black", (_e, b) => cb(b)),
  onFont: (cb) => ipcRenderer.on("font:change", (_e, delta) => cb(delta)),
  onResetFont: (cb) => ipcRenderer.on("font:reset", () => cb()),
  onShowIdle: (cb) => ipcRenderer.on("showIdle", () => cb()),

  // تنظيف
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

  // جلب الترانيم
  getHymns: () => ipcRenderer.invoke("get-hymns"),
});
