require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const auditLogRoutes = require("./routes/auditLogRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(express.static("public"));

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Employee Management System API is running." });
});

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/audit-logs", auditLogRoutes);

app.use("/api", (req, res) => {
  res.status(404).json({ success: false, message: "API route not found." });
});

app.use(errorHandler);

async function start() {
  const port = Number(process.env.PORT) || 5000;
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
    throw new Error("MONGODB_URI and JWT_SECRET must be configured.");
  }
  await mongoose.connect(process.env.MONGODB_URI);
  app.listen(port, () => console.log("Employee Management System API listening on port " + port));
}

if (require.main === module) {
  start().catch((error) => {
    console.error("Startup failed:", error);
    process.exit(1);
  });
}

module.exports = { app, start };
