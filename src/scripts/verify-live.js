const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "../..");
require("dotenv").config({ path: path.join(root, ".env") });
const assert = require("node:assert/strict");
const http = require("node:http");
const base = process.env.API_BASE_URL || "http://127.0.0.1:3000";
let sessionCookie = "";
const results = [];
const items = [];
const payload = {
  name: "Verification " + Date.now(),
  minPlayers: 2,
  maxPlayers: 4,
  playingTimeMinutes: 30,
  publisherId: 1,
  categoryId: 1,
};
let createdId;
async function call(name, method, url, expected, body) {
  const started = Date.now();
  const response = await fetch(base + url, {
    method,
    headers: { "content-type": "application/json", cookie: sessionCookie },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const raw = await response.text();
  assert.equal(response.status, expected, name + ": " + raw);
  const request = {
    method,
    header: [{ key: "Content-Type", value: "application/json" }],
    url: "{{baseUrl}}" + url,
  };
  if (body !== undefined)
    request.body = {
      mode: "raw",
      raw: JSON.stringify(body, null, 2),
      options: { raw: { language: "json" } },
    };
  const test = [
    `pm.test('HTTP ${expected}',()=>pm.response.to.have.status(${expected}));`,
  ];
  if (name === "Create game") {
    request.body.raw = JSON.stringify(
      { ...body, name: "{{runName}}" },
      null,
      2,
    );
    test.push(
      "pm.collectionVariables.set('createdId',pm.response.json().data.id);",
    );
  }
  if (name === "Duplicate game")
    request.body.raw = JSON.stringify(
      { ...body, name: "{{runName}}" },
      null,
      2,
    );
  if (createdId && url.includes("/games/" + createdId))
    request.url =
      "{{baseUrl}}" +
      url.replace("/games/" + createdId, "/games/{{createdId}}");
  items.push({
    name,
    request,
    response: [
      {
        name: "Captured live response " + new Date().toISOString(),
        originalRequest: request,
        status: http.STATUS_CODES[expected],
        code: expected,
        header: [...response.headers].map(([key, value]) => ({ key, value })),
        body: raw,
      },
    ],
    event: [
      { listen: "test", script: { type: "text/javascript", exec: test } },
    ],
  });
  results.push({
    name,
    status: response.status,
    durationMs: Date.now() - started,
  });
  console.log("PASS", name, expected);
  return raw ? JSON.parse(raw) : null;
}
async function run() {
  if (!process.env.AUTH_TEST_PASSWORD) throw Error('Set AUTH_TEST_PASSWORD to your local login password before verification.');
  const login = await fetch(base + '/api/auth/login', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username:process.env.AUTH_USERNAME || 'admin',password:process.env.AUTH_TEST_PASSWORD})});
  assert.equal(login.status,200,'Login failed');
  sessionCookie = login.headers.get('set-cookie').split(';')[0];
  fs.mkdirSync(path.join(root, "src/reports"), { recursive: true });
  const health = await call("Gateway health", "GET", "/health", 200);
  assert.equal(health.mode, "gateway");
  for (const route of ["games", "publishers", "categories"]) {
    const r = await call("List " + route, "GET", "/api/v1/" + route, 200);
    assert.ok(r.data.length >= 3);
    await call("Get " + route, "GET", "/api/v1/" + route + "/1", 200);
    await call(
      "Missing " + route,
      "GET",
      "/api/v1/" + route + "/2147483647",
      404,
    );
  }
  createdId = (await call("Create game", "POST", "/api/v1/games", 201, payload))
    .data.id;
  try {
    await call("Duplicate game", "POST", "/api/v1/games", 409, payload);
    await call("Invalid foreign key", "POST", "/api/v1/games", 400, {
      ...payload,
      publisherId: 2147483647,
    });
    await call("Invalid player counts", "POST", "/api/v1/games", 400, {
      ...payload,
      maxPlayers: 1,
    });
    const updated = await call(
      "Update game",
      "PUT",
      "/api/v1/games/" + createdId,
      200,
      { ...payload, name: "Updated verification" },
    );
    assert.equal(updated.data.name, "Updated verification");
    const read = await call(
      "Read updated game",
      "GET",
      "/api/v1/games/" + createdId,
      200,
    );
    assert.equal(read.data.name, "Updated verification");
    await call("Delete game", "DELETE", "/api/v1/games/" + createdId, 204);
    await call("Deleted game absent", "GET", "/api/v1/games/" + createdId, 404);
  } finally {
    await fetch(base + "/api/v1/games/" + createdId, { method: "DELETE", headers: {cookie: sessionCookie} });
  }
  const ext = await call(
    "Wikipedia background",
    "GET",
    "/api/v1/games/1/background",
    200,
  );
  assert.equal(ext.data.external.source, "wikipedia");
  assert.equal(ext.data.external.available, true);
  await call("Invalid ID", "GET", "/api/v1/games/abc", 400);
  for (const url of ["/", "/api-docs/", "/openapi.yaml"]) {
    const r = await fetch(base + url, {headers: {cookie: sessionCookie}});
    assert.equal(r.status, 200);
    results.push({ name: url, status: 200 });
  }
  const db = require("../db");
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    for (const [name, sql, code] of [
      [
        "UNIQUE publisher",
        "INSERT INTO publishers(name,country) SELECT name,country FROM publishers WHERE id=1",
        "ER_DUP_ENTRY",
      ],
      [
        "CHECK players",
        "INSERT INTO boardgames(name,min_players,max_players,playing_time_minutes,publisher_id,category_id) VALUES ('Invalid',5,2,10,1,1)",
        "ER_CHECK_CONSTRAINT_VIOLATED",
      ],
      [
        "FK missing publisher",
        "INSERT INTO boardgames(name,min_players,max_players,playing_time_minutes,publisher_id,category_id) VALUES ('Invalid',2,4,10,2147483647,1)",
        "ER_NO_REFERENCED_ROW_2",
      ],
      [
        "RESTRICT referenced publisher",
        "DELETE FROM publishers WHERE id=1",
        "ER_ROW_IS_REFERENCED_2",
      ],
    ]) {
      await assert.rejects(connection.query(sql), (e) => e.code === code);
      results.push({ name, status: "PASS", mysqlError: code });
    }
  } finally {
    await connection.rollback();
    connection.release();
    await db.end();
  }
  // Real HTTP failure servers: these test network and timeout behavior without relying on public outages.
  const { getGameBackground } = require("../services/external-api");
  let calls = 0;
  const mock = http.createServer((req, res) => {
    calls++;
    res.writeHead(503);
    res.end("{}");
  });
  await new Promise((r) => mock.listen(0, "127.0.0.1", r));
  const old = process.env.EXTERNAL_API_URL;
  process.env.EXTERNAL_API_URL = "http://127.0.0.1:" + mock.address().port;
  try {
    const r = await getGameBackground("Catan", { delayMs: 10 });
    assert.equal(calls, 3);
    assert.equal(r.source, "fallback");
    results.push({
      name: "HTTP 503 retries then fallback",
      status: "PASS",
      attempts: calls,
    });
  } finally {
    await new Promise((r) => mock.close(r));
  }
  calls = 0;
  const slow = http.createServer(() => {
    calls++;
  });
  await new Promise((r) => slow.listen(0, "127.0.0.1", r));
  process.env.EXTERNAL_API_URL = "http://127.0.0.1:" + slow.address().port;
  const started = Date.now();
  try {
    const r = await getGameBackground("Catan", { timeoutMs: 100, delayMs: 10 });
    assert.equal(r.source, "fallback");
    assert.equal(calls, 3);
    results.push({
      name: "Real HTTP timeout and fallback",
      status: "PASS",
      attempts: calls,
      durationMs: Date.now() - started,
    });
  } finally {
    slow.closeAllConnections();
    await new Promise((r) => slow.close(r));
    if (old) process.env.EXTERNAL_API_URL = old;
    else delete process.env.EXTERNAL_API_URL;
  }
  // Obtain an unused port then close it, to simulate a genuinely unavailable service.
  const unused = http.createServer();
  await new Promise((r) => unused.listen(0, "127.0.0.1", r));
  const deadPort = unused.address().port;
  await new Promise((r) => unused.close(r));
  process.env.GAME_URL = "http://127.0.0.1:" + deadPort;
  const gateway = require("../gateway");
  const server = gateway.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  try {
    const url = "http://127.0.0.1:" + server.address().port;
    assert.equal((await fetch(url + "/api/v1/games")).status, 503);
    assert.equal((await fetch(url + "/health")).status, 200);
    results.push({
      name: "Actual unavailable service: gateway 503 and stays alive",
      status: "PASS",
    });
  } finally {
    await new Promise((r) => server.close(r));
  }
  const collection = {
    info: {
      name: "Board Game Management API - actual recorded responses",
      schema:
        "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      description:
        "Requests and examples captured by verify-live.js against MySQL and gateway. Replayed and exported using Postman Newman.",
    },
    variable: [
      { key: "baseUrl", value: base },
      { key: "runName", value: "Postman demo" },
      { key: "createdId", value: "" },
    ],
    event: [
      {
        listen: "prerequest",
        script: {
          type: "text/javascript",
          exec: [
            "if(pm.info.requestName==='Create game') pm.collectionVariables.set('runName','Postman '+Date.now());",
          ],
        },
      },
    ],
    item: items,
  };
  fs.writeFileSync(
    path.join(root, "src/postman_collection.json"),
    JSON.stringify(collection, null, 2),
  );
  fs.writeFileSync(
    path.join(root, "src/reports/live-results.json"),
    JSON.stringify(
      {
        testedAt: new Date().toISOString(),
        database: "MySQL 8.4.13",
        base,
        results,
      },
      null,
      2,
    ),
  );
  console.log(
    "All",
    results.length,
    "live checks passed; recorded Postman examples saved.",
  );
}
run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
