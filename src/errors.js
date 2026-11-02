function asyncRoute(handler) {
  return (req, res, next) =>
    Promise.resolve()
      .then(() => handler(req, res, next))
      .catch(next);
}
function errorHandler(err, req, res, next) {
  const errors = {
    ER_DUP_ENTRY: [409, "CONFLICT", "Duplicate record"],
    ER_NO_REFERENCED_ROW_2: [
      400,
      "INVALID_REFERENCE",
      "Publisher or category does not exist",
    ],
    ER_ROW_IS_REFERENCED_2: [409, "IN_USE", "Resource is in use"],
    ER_CHECK_CONSTRAINT_VIOLATED: [
      400,
      "INVALID_DATA",
      "Database constraint failed",
    ],
    ER_WARN_DATA_OUT_OF_RANGE: [
      400,
      "INVALID_DATA",
      "Number exceeds database range",
    ],
  };
  let result = errors[err.code];
  if (err.type === "entity.parse.failed")
    result = [400, "INVALID_JSON", "Request body must be valid JSON"];
  if (err.type === "entity.too.large")
    result = [413, "PAYLOAD_TOO_LARGE", "Request body exceeds 100 KB"];
  if (!result) {
    console.error(err.message);
    result = [500, "INTERNAL_ERROR", "Unexpected server error"];
  }
  res
    .status(result[0])
    .json({ error: { code: result[1], message: result[2] } });
}
function notFound(req, res) {
  res
    .status(404)
    .json({ error: { code: "NOT_FOUND", message: "Endpoint not found" } });
}
const validId = (v) =>
  /^\d+$/.test(String(v)) && Number(v) > 0 && Number(v) <= 2147483647;
module.exports = { asyncRoute, errorHandler, validId, notFound };
