require("dotenv").config();
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3307),
    user: process.env.DB_USER || "boarduser",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "boardgame_db",
    multipleStatements: true,
  });
  try {
    for (const filename of ["schema.sql", "seed.sql"]) {
      await connection.query(
        fs.readFileSync(path.join(__dirname, "..", filename), "utf8"),
      );
      console.log("Applied", filename);
    }
    console.log("Database ready");
  } finally {
    await connection.end();
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
