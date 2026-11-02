const request = require("supertest");
const app = require("../gateway");
const original = global.fetch;
beforeEach(() => {
  global.fetch = jest.fn();
});
afterAll(() => {
  global.fetch = original;
});
test("forwards PUT body and path", async () => {
  global.fetch.mockResolvedValue(new Response('{"data":{"id":8}}'));
  const r = await request(app).put("/api/v1/games/8").send({ name: "Edit" });
  expect(r.status).toBe(200);
  expect(global.fetch.mock.calls[0][0]).toBe("http://127.0.0.1:4001/games/8");
  expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toEqual({
    name: "Edit",
  });
});
test.each([
  ["publishers", 4002],
  ["categories", 4002],
  ["games/1/background", 4003],
])("routes %s", async (path, port) => {
  global.fetch.mockResolvedValue(new Response("{}"));
  expect((await request(app).get("/api/v1/" + path)).status).toBe(200);
  expect(global.fetch.mock.calls[0][0]).toBe(
    `http://127.0.0.1:${port}/${path}`,
  );
});
test("offline upstream returns 503 without crashing", async () => {
  global.fetch.mockRejectedValue(new Error("ECONNREFUSED"));
  const r = await request(app).get("/api/v1/games");
  expect(r.status).toBe(503);
  expect(r.body.error.code).toBe("SERVICE_UNAVAILABLE");
  expect((await request(app).get("/health")).status).toBe(200);
});
test("preserves upstream 404 and 204", async () => {
  global.fetch.mockResolvedValueOnce(new Response("{}", { status: 404 }));
  expect((await request(app).get("/api/v1/games/7")).status).toBe(404);
  global.fetch.mockResolvedValueOnce(new Response(null, { status: 204 }));
  const r = await request(app).delete("/api/v1/games/7");
  expect(r.status).toBe(204);
  expect(r.text).toBe("");
});
test("rejects invalid JSON before proxy", async () => {
  expect(
    (
      await request(app)
        .post("/api/v1/games")
        .set("content-type", "application/json")
        .send("{")
    ).status,
  ).toBe(400);
  expect(global.fetch).not.toHaveBeenCalled();
});
