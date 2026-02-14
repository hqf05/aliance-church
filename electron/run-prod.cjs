const { spawn } = require("child_process");
const path = require("path");

const nextBin = path.join(__dirname, "..", "node_modules", ".bin", process.platform === "win32" ? "next.cmd" : "next");

const nextServer = spawn(nextBin, ["start", "-p", "3000"], {
  cwd: path.join(__dirname, ".."),
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: "production" },
});

nextServer.on("error", (err) => console.error("Next start error:", err));

setTimeout(() => {
  const electronBin = path.join(__dirname, "..", "node_modules", ".bin", process.platform === "win32" ? "electron.cmd" : "electron");
  spawn(electronBin, ["electron/main.cjs"], {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
    env: {
      ...process.env,
      ELECTRON_START_URL: "http://localhost:3000",
      ELECTRON_SCREEN_URL: "http://localhost:3000/screen",
    },
  });
}, 2000);