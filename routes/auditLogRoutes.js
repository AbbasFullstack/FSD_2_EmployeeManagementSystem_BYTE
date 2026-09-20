const express = require("express");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const controller = require("../controllers/auditLogController");

const router = express.Router();
router.use(auth, admin);
router.get("/", controller.listAuditLogs);
router.get("/:id", controller.getAuditLog);

module.exports = router;
