// electron/run-prod.cjs
const { spawn } = require("child_process");
const path = require("path");
const waitOn = require("wait-on");
function pickPort() {
  // خليها ثابتة اذا تحب، بس أنا أخلي 3123 حتى ما تتعارك ويا 3000
  return process.env.PORT ? Number(process.env.PORT) : 3123;
}

async function main() {
  const port = pickPort();
  const cwd = path.join(__dirname, "..");

  // 1) شغّل next start
  const nextProc = spawn(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["next", "start", "-p", String(port)],
    { cwd, stdio: "inherit", env: { ...process.env } }
  );

  // 2) انتظر السيرفر يشتغل
  await waitOn({
    resources: [`http://localhost:${port}`],
    timeout: 60000,
  });

  // 3) شغّل electron ومرر الروابط
  const electronProc = spawn(
    process.platform === "win32" ? "npx.cmd" : "npx",
    [
      "electron",
      ".",
    ],
    {
      cwd,
      stdio: "inherit",
      env: {
        ...process.env,
        ELECTRON_START_URL: `http://localhost:${port}`,
        ELECTRON_SCREEN_URL: `http://localhost:${port}/screen`,
      },
    }
  );

  electronProc.on("close", () => {
    nextProc.kill();
  });
}

main().catch((e) => {
  console.error("⨯ Failed to start server", e);
  process.exit(1);
});
