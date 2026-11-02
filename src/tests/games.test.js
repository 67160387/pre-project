jest.mock("../db", () => ({ query: jest.fn(), execute: jest.fn() }));
const request = require("supertest");
const app = require("../app");
const db = require("../db");
beforeEach(() => jest.clearAllMocks());
test("GET games from database result", async () => {
  db.query.mockResolvedValue([[{ id: 1, name: "Catan" }]]);
  const r = await request(app).get("/api/v1/games");
  expect(r.status).toBe(200);
  expect(r.body.data[0].name).toBe("Catan");
  expect(db.query).toHaveBeenCalledTimes(1);
});
test("GET nonexisting game 404", async () => {
  db.query.mockResolvedValue([[]]);
  const r = await request(app).get("/api/v1/games/99");
  expect(r.status).toBe(404);
});
test("POST invalid fields 400", async () => {
  const r = await request(app)
    .post("/api/v1/games")
    .send({ name: "x", minPlayers: 5, maxPlayers: 2 });
  expect(r.status).toBe(400);
  expect(db.execute).not.toHaveBeenCalled();
});
test("POST valid 201", async () => {
  db.execute.mockResolvedValue([{ insertId: 7 }]);
  const payload = {
    name: "Test",
    minPlayers: 2,
    maxPlayers: 4,
    playingTimeMinutes: 20,
    publisherId: 1,
    categoryId: 2,
  };
  const r = await request(app).post("/api/v1/games").send(payload);
  expect(r.status).toBe(201);
  expect(r.body.data.id).toBe(7);
});
test("PUT not found 404", async () => {
  db.execute.mockResolvedValue([{ affectedRows: 0 }]);
  const payload = {
    name: "Test",
    minPlayers: 2,
    maxPlayers: 4,
    playingTimeMinutes: 20,
    publisherId: 1,
    categoryId: 2,
  };
  expect(
    (await request(app).put("/api/v1/games/44").send(payload)).status,
  ).toBe(404);
});
test("DELETE success 204", async () => {
  db.execute.mockResolvedValue([{ affectedRows: 1 }]);
  expect((await request(app).delete("/api/v1/games/4")).status).toBe(204);
});
test("GET publishers", async () => {
  db.query.mockResolvedValue([[{ id: 1, name: "Asmodee" }]]);
  expect((await request(app).get("/api/v1/publishers")).body.data).toHaveLength(
    1,
  );
});
test("error from MySQL gives 500", async () => {
  db.query.mockRejectedValue(new Error("database offline"));
  expect((await request(app).get("/api/v1/games")).status).toBe(500);
});
