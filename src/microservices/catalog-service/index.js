require("dotenv").config();
const express = require("express");
const { errorHandler, notFound } = require("../../errors");
const app = express();
app.use(express.json());
app.get("/health", (req, res) =>
  res.json({ status: "ok", service: "catalog" }),
);
app.use("/", require("../../routes/catalog"));
app.use(notFound);
app.use(errorHandler);
if (require.main === module)
  app.listen(Number(process.env.CATALOG_PORT || 4002), "127.0.0.1", () =>
    console.log("catalog service: 4002"),
  );
module.exports = app;
