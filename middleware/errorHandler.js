module.exports = function errorHandler(error, req, res, next) {
  console.error(error);
  if (res.headersSent) return next(error);
  if (error.name === "ValidationError") {
    return res.status(422).json({
      success: false, message: "Database validation failed.",
      errors: Object.values(error.errors).map((item) => ({ field: item.path, message: item.message }))
    });
  }
  if (error.code === 11000) {
    const fields = Object.keys(error.keyPattern || {});
    return res.status(409).json({
      success: false,
      message: "Duplicate value for: " + (fields.join(", ") || "unique field") + "."
    });
  }
  if (error.name === "CastError") return res.status(400).json({ success: false, message: "Invalid resource ID." });
  res.status(error.statusCode || 500).json({
    success: false, message: error.statusCode ? error.message : "Internal server error."
  });
};
