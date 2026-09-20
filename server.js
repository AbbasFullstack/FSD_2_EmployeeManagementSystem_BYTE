require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const auditLogRoutes = require("./routes/auditLogRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

let mongoConnectionPromise = null;

async function connectDatabase() {
  if (!process.env.MONGODB_URI) {
    const error = new Error("MONGODB_URI must be configured.");
    error.statusCode = 500;
    throw error;
  }

  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (!mongoConnectionPromise) {
    mongoConnectionPromise = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    }).catch((error) => {
      mongoConnectionPromise = null;
      throw error;
    });
  }

  await mongoConnectionPromise;
  return mongoose.connection;
}

async function databaseMiddleware(req, res, next) {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    next(error);
  }
}

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));

function sendLoginPage(req, res) {
  res.sendFile(path.join(__dirname, "public", "index.html"));
}

app.get("/", sendLoginPage);

// Root rewrite target for Vercel's serverless Express function.
app.get("/api/index", sendLoginPage);

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Employee Management System API is running." });
});

app.use("/api", databaseMiddleware);
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

  await connectDatabase();
  app.listen(port, () => console.log("Employee Management System API listening on port " + port));
}

if (require.main === module) {
  start().catch((error) => {
    console.error("Startup failed:", error);
    process.exit(1);
  });
}

module.exports = app;
app.start = start;
app.connectDatabase = connectDatabase;
