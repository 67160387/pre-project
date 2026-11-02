const express = require("express");
const db = require("../db");
const { asyncRoute, validId } = require("../errors");
const { getGameBackground } = require("../services/external-api");
const router = express.Router();
router.get(
  "/games/:id/background",
  asyncRoute(async (req, res) => {
    if (!validId(req.params.id))
      return res
        .status(400)
        .json({ error: { code: "INVALID_ID", message: "Invalid ID" } });
    const [rows] = await db.query("SELECT id,name FROM boardgames WHERE id=?", [
      req.params.id,
    ]);
    if (!rows.length)
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "Game not found" } });
    res.json({
      data: { game: rows[0], external: await getGameBackground(rows[0].name) },
    });
  }),
);
module.exports = router;
