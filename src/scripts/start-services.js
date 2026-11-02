const { spawn } = require("child_process");
const path = require("path");
const root = path.join(__dirname, "..");
const files = [
  "microservices/game-service/index.js",
  "microservices/catalog-service/index.js",
  "microservices/enrichment-service/index.js",
  "gateway.js",
];
let stopping = false;
const processes = files.map((file) =>
  spawn(process.execPath, [path.join(root, file)], {
    cwd: path.join(root, ".."),
    stdio: "inherit",
    env: process.env,
    windowsHide: true,
  }),
);
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of processes) child.kill();
  process.exitCode = code;
}
for (const child of processes) {
  child.on("error", (err) => {
    console.error(err.message);
    stop(1);
  });
  child.on("exit", (code) => {
    if (!stopping) stop(code || 1);
  });
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
