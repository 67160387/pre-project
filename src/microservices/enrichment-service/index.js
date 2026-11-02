require("dotenv").config();
const express = require("express");
const { errorHandler, notFound } = require("../../errors");
const app = express();
app.use(express.json());
app.get("/health", (req, res) =>
  res.json({ status: "ok", service: "enrichment" }),
);
app.use("/", require("../../routes/enrichment"));
app.use(notFound);
app.use(errorHandler);
if (require.main === module)
  app.listen(Number(process.env.ENRICHMENT_PORT || 4003), "127.0.0.1", () =>
    console.log("enrichment service: 4003"),
  );
module.exports = app;
