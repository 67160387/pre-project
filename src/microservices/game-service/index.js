require("dotenv").config();
const express = require("express");
const { errorHandler, notFound } = require("../../errors");
const app = express();
app.use(express.json());
app.get("/health", (req, res) => res.json({ status: "ok", service: "game" }));
app.use("/games", require("../../routes/games").router);
app.use(notFound);
app.use(errorHandler);
if (require.main === module)
  app.listen(Number(process.env.GAME_PORT || 4001), "127.0.0.1", () =>
    console.log("game service: 4001"),
  );
module.exports = app;
