const express = require("express");
const db = require("../db");
const { asyncRoute, validId } = require("../errors");
const router = express.Router();
const fields =
  "g.id,g.name,g.min_players AS minPlayers,g.max_players AS maxPlayers,g.playing_time_minutes AS playingTimeMinutes,g.publisher_id AS publisherId,p.name AS publisher,g.category_id AS categoryId,c.name AS category";
const joins =
  " FROM boardgames g JOIN publishers p ON p.id=g.publisher_id JOIN categories c ON c.id=g.category_id";
function parseGame(b) {
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const nums = [
    "minPlayers",
    "maxPlayers",
    "playingTimeMinutes",
    "publisherId",
    "categoryId",
  ];
  if (
    !name ||
    name.length > 150 ||
    nums.some((k) => !Number.isSafeInteger(b[k]) || b[k] > 2147483647) ||
    b.minPlayers < 1 ||
    b.maxPlayers < b.minPlayers ||
    b.playingTimeMinutes < 1 ||
    b.publisherId < 1 ||
    b.categoryId < 1
  )
    return null;
  return {
    name,
    minPlayers: b.minPlayers,
    maxPlayers: b.maxPlayers,
    playingTimeMinutes: b.playingTimeMinutes,
    publisherId: b.publisherId,
    categoryId: b.categoryId,
  };
}
router.get(
  "/",
  asyncRoute(async (req, res) => {
    const [rows] = await db.query(
      "SELECT " + fields + joins + " ORDER BY g.id",
    );
    res.json({ data: rows });
  }),
);
router.get(
  "/:id",
  asyncRoute(async (req, res) => {
    if (!validId(req.params.id))
      return res
        .status(400)
        .json({ error: { code: "INVALID_ID", message: "Invalid ID" } });
    const [rows] = await db.query(
      "SELECT " + fields + joins + " WHERE g.id=?",
      [req.params.id],
    );
    if (!rows.length)
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "Game not found" } });
    res.json({ data: rows[0] });
  }),
);
router.post(
  "/",
  asyncRoute(async (req, res) => {
    const v = parseGame(req.body || {});
    if (!v)
      return res
        .status(400)
        .json({
          error: {
            code: "VALIDATION_ERROR",
            message:
              "Valid name, positive players/time and publisherId/categoryId required",
          },
        });
    const [r] = await db.execute(
      "INSERT INTO boardgames(name,min_players,max_players,playing_time_minutes,publisher_id,category_id) VALUES (?,?,?,?,?,?)",
      Object.values(v),
    );
    res.status(201).json({ data: { id: r.insertId, ...v } });
  }),
);
router.put(
  "/:id",
  asyncRoute(async (req, res) => {
    if (!validId(req.params.id))
      return res
        .status(400)
        .json({ error: { code: "INVALID_ID", message: "Invalid ID" } });
    const v = parseGame(req.body || {});
    if (!v)
      return res
        .status(400)
        .json({
          error: { code: "VALIDATION_ERROR", message: "Invalid game fields" },
        });
    const [r] = await db.execute(
      "UPDATE boardgames SET name=?,min_players=?,max_players=?,playing_time_minutes=?,publisher_id=?,category_id=? WHERE id=?",
      [...Object.values(v), req.params.id],
    );
    if (!r.affectedRows)
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "Game not found" } });
    res.json({ data: { id: Number(req.params.id), ...v } });
  }),
);
router.delete(
  "/:id",
  asyncRoute(async (req, res) => {
    if (!validId(req.params.id))
      return res
        .status(400)
        .json({ error: { code: "INVALID_ID", message: "Invalid ID" } });
    const [r] = await db.execute("DELETE FROM boardgames WHERE id=?", [
      req.params.id,
    ]);
    if (!r.affectedRows)
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "Game not found" } });
    res.status(204).end();
  }),
);
module.exports = { router, parseGame };
