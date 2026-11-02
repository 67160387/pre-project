const path = require("path");
const fs = require("fs");
const YAML = require("yaml");
const swagger = require("swagger-ui-express");
module.exports = function docs(app) {
  const file = path.join(__dirname, "../openapi.yaml");
  app.get("/openapi.yaml", (req, res) => res.type("text/yaml").sendFile(file));
  app.use(
    "/api-docs",
    swagger.serve,
    swagger.setup(YAML.parse(fs.readFileSync(file, "utf8"))),
  );
};
