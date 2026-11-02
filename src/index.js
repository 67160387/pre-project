require("dotenv").config();
const app = require("./app");
if (require.main === module)
  require("./auth")(app, require("path").resolve(__dirname, "../frontend")).listen(Number(process.env.PORT || 3000), "127.0.0.1", () =>
    console.log("Monolith: http://localhost:" + (process.env.PORT || 3000)),
  );
module.exports = app;
