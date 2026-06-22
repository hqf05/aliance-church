const { spawn } = require("child_process");
const path = require("path");

function startNext(port = 3000) {
  // هذا يشغل next start
  const nextBin = path.join(__dirname, "..", "node_modules", ".bin", "next");
  const proc = spawn(nextBin, ["start", "-p", String(port)], {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
    shell: true,
    env: { ...process.env, PORT: String(port) },
  });

  return proc;
}

module.exports = { startNext };