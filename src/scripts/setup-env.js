const fs = require("fs"),
  crypto = require("crypto");
if (fs.existsSync(".env")) {
  console.error(".env already exists; preserved.");
  process.exitCode = 1;
} else {
  fs.writeFileSync(
    ".env",
    [
      "PORT=3000",
      "DB_HOST=127.0.0.1",
      "DB_PORT=3307",
      "DB_USER=boarduser",
      "DB_NAME=boardgame_db",
      "DB_PASSWORD=" + crypto.randomBytes(24).toString("hex"),
      "DB_ROOT_PASSWORD=" + crypto.randomBytes(32).toString("hex"),
    ].join("\n"),
  );
  console.log("Created .env with random local passwords. Keep it private.");
}
