const mongoose = require("mongoose");
const Employee = require("../models/Employee");
const AuditLog = require("../models/AuditLog");

function employeeSnapshot(employee) {
  const data = employee.toObject();
  delete data._id;
  delete data.__v;
  return data;
}

exports.listEmployees = async (req, res, next) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json({ success: true, count: employees.length, employees });
  } catch (error) { next(error); }
};

exports.getEmployee = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid employee ID." });
    }
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ success: false, message: "Employee not found." });
    res.json({ success: true, employee });
  } catch (error) { next(error); }
};

exports.createEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.create(req.body);
    res.status(201).json({ success: true, message: "Employee created successfully.", employee });
  } catch (error) { next(error); }
};

exports.updateEmployee = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid employee ID." });
    }
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ success: false, message: "Employee not found." });

    await AuditLog.create({
      action: "edit",
      timestamp: new Date(),
      previousData: employeeSnapshot(employee),
      performedBy: req.user._id,
      employeeId: employee._id
    });

    Object.assign(employee, req.body);
    await employee.save();
    res.json({ success: true, message: "Employee updated successfully.", employee });
  } catch (error) { next(error); }
};

exports.deleteEmployee = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid employee ID." });
    }
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ success: false, message: "Employee not found." });

    await AuditLog.create({
      action: "delete",
      timestamp: new Date(),
      previousData: employeeSnapshot(employee),
      performedBy: req.user._id,
      employeeId: employee._id
    });

    await employee.deleteOne();
    res.json({ success: true, message: "Employee deleted successfully." });
  } catch (error) { next(error); }
};
