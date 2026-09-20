const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, enum: ["edit", "delete"], required: true, immutable: true },
    timestamp: { type: Date, default: Date.now, immutable: true },
    previousData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      immutable: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      immutable: true
    }
  },
  {
    timestamps: false,
    versionKey: false
  }
);

auditLogSchema.pre(["findOneAndUpdate", "updateOne", "updateMany", "findOneAndDelete", "deleteOne", "deleteMany"], function blockAuditMutation(next) {
  next(new Error("AuditLog records are append-only and cannot be updated or deleted."));
});

auditLogSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
