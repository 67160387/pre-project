require("dotenv").config();
const express = require("express");
const path = require("path");
const { errorHandler, notFound } = require("./errors");
const app = express();
app.use(express.json());
app.get("/health", (req, res) => res.json({ status: "ok", mode: "gateway" }));
require("./docs")(app);
// Allow all three external attempts plus backoff and overhead to finish.
const enrichmentTimeout =
  3 * Number(process.env.EXTERNAL_TIMEOUT_MS || 1800) + 2300;
app.use(
  "/api/v1/games/:id/background",
  proxy(
    process.env.ENRICHMENT_URL || "http://127.0.0.1:4003",
    enrichmentTimeout,
  ),
);
app.use(
  "/api/v1/games",
  proxy(process.env.GAME_URL || "http://127.0.0.1:4001"),
);
app.use(
  "/api/v1/publishers",
  proxy(process.env.CATALOG_URL || "http://127.0.0.1:4002"),
);
app.use(
  "/api/v1/categories",
  proxy(process.env.CATALOG_URL || "http://127.0.0.1:4002"),
);
app.use(express.static(path.join(__dirname, "../frontend")));
app.use(notFound);
app.use(errorHandler);
function proxy(base, timeoutMs = 3000) {
  return async (req, res) => {
    try {
      // Never retry writes automatically: a timeout does not mean the write failed.
      const upstream = await fetch(
        base + req.originalUrl.replace(/^\/api\/v1/, ""),
        {
          method: req.method,
          headers: { "content-type": "application/json" },
          body: ["GET", "HEAD"].includes(req.method)
            ? undefined
            : JSON.stringify(req.body || {}),
          signal: AbortSignal.timeout(timeoutMs),
        },
      );
      const body = await upstream.text();
      res.status(upstream.status);
      if (upstream.status === 204) return res.end();
      res
        .type(upstream.headers.get("content-type") || "application/json")
        .send(body);
    } catch (err) {
      res
        .status(503)
        .json({
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "Downstream service temporarily unavailable",
          },
        });
    }
  };
}
if (require.main === module)
  require("./auth")(app, require("path").resolve(__dirname, "../frontend")).listen(Number(process.env.PORT || 3000), "127.0.0.1", () =>
    console.log("Gateway: http://localhost:" + (process.env.PORT || 3000)),
  );
module.exports = app;
