jest.mock("../db", () => ({ query: jest.fn(), execute: jest.fn() }));
const request = require("supertest");
const app = require("../app");
const db = require("../db");
const good = {
  name: "Demo",
  minPlayers: 2,
  maxPlayers: 4,
  playingTimeMinutes: 30,
  publisherId: 1,
  categoryId: 1,
};
beforeEach(() => jest.clearAllMocks());
test.each(["abc", "0", "-1", "1.5", "2147483648"])(
  "rejects ID %s before SQL",
  async (id) => {
    expect((await request(app).get("/api/v1/games/" + id)).status).toBe(400);
    expect(db.query).not.toHaveBeenCalled();
  },
);
test.each([
  { name: " " },
  { minPlayers: 0 },
  { maxPlayers: 1 },
  { playingTimeMinutes: 1.5 },
  { publisherId: 2147483648 },
])("rejects fields %j", async (change) => {
  expect(
    (
      await request(app)
        .post("/api/v1/games")
        .send({ ...good, ...change })
    ).status,
  ).toBe(400);
  expect(db.execute).not.toHaveBeenCalled();
});
test.each([
  ["ER_DUP_ENTRY", 409],
  ["ER_NO_REFERENCED_ROW_2", 400],
  ["ER_CHECK_CONSTRAINT_VIOLATED", 400],
])("maps MySQL %s", async (code, status) => {
  db.execute.mockRejectedValue(Object.assign(new Error("test"), { code }));
  expect((await request(app).post("/api/v1/games").send(good)).status).toBe(
    status,
  );
});
test("update returns correct shape", async () => {
  db.execute.mockResolvedValue([{ affectedRows: 1 }]);
  expect(
    (await request(app).put("/api/v1/games/8").send(good)).body.data,
  ).toEqual({ id: 8, ...good });
});
test("delete missing returns 404", async () => {
  db.execute.mockResolvedValue([{ affectedRows: 0 }]);
  expect((await request(app).delete("/api/v1/games/8")).status).toBe(404);
});
test.each(["publishers", "categories"])("catalog %s", async (route) => {
  expect((await request(app).get("/api/v1/" + route + "/bad")).status).toBe(
    400,
  );
  db.query.mockResolvedValue([[]]);
  expect((await request(app).get("/api/v1/" + route + "/123")).status).toBe(
    404,
  );
  db.query.mockResolvedValue([[{ id: 1, name: "One" }]]);
  expect((await request(app).get("/api/v1/" + route + "/1")).body.data.id).toBe(
    1,
  );
});
test("enrichment rejects invalid and missing ID", async () => {
  expect((await request(app).get("/api/v1/games/bad/background")).status).toBe(
    400,
  );
  db.query.mockResolvedValue([[]]);
  expect((await request(app).get("/api/v1/games/9/background")).status).toBe(
    404,
  );
});
test("unknown route JSON 404", async () => {
  const r = await request(app).get("/api/v1/no-route");
  expect(r.status).toBe(404);
  expect(r.body.error.code).toBe("NOT_FOUND");
});
