const express = require("express");
const db = require("../db");
const { asyncRoute, validId } = require("../errors");
const router = express.Router();
for (const [route, table] of [
  ["publishers", "publishers"],
  ["categories", "categories"],
]) {
  router.get(
    "/" + route,
    asyncRoute(async (req, res) => {
      const [rows] = await db.query("SELECT * FROM " + table + " ORDER BY id");
      res.json({ data: rows });
    }),
  );
  router.get(
    "/" + route + "/:id",
    asyncRoute(async (req, res) => {
      if (!validId(req.params.id))
        return res
          .status(400)
          .json({ error: { code: "INVALID_ID", message: "Invalid ID" } });
      const [rows] = await db.query("SELECT * FROM " + table + " WHERE id=?", [
        req.params.id,
      ]);
      if (!rows.length)
        return res
          .status(404)
          .json({ error: { code: "NOT_FOUND", message: "Not found" } });
      res.json({ data: rows[0] });
    }),
  );
}
module.exports = router;
