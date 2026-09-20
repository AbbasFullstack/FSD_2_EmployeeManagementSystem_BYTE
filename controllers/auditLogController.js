const mongoose = require("mongoose");
const AuditLog = require("../models/AuditLog");

exports.listAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find()
      .populate("performedBy", "name email role")
      .populate("employeeId", "name email")
      .sort({ timestamp: -1 });
    res.json({ success: true, count: logs.length, auditLogs: logs });
  } catch (error) { next(error); }
};

exports.getAuditLog = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid audit log ID." });
    }
    const log = await AuditLog.findById(req.params.id)
      .populate("performedBy", "name email role")
      .populate("employeeId", "name email");
    if (!log) return res.status(404).json({ success: false, message: "Audit log not found." });
    res.json({ success: true, auditLog: log });
  } catch (error) { next(error); }
};
