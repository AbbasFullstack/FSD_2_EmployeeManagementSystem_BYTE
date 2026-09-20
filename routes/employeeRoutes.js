const express = require("express");
const { body } = require("express-validator");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const validate = require("../middleware/validate");
const controller = require("../controllers/employeeController");

const router = express.Router();

const employeeValidation = [
  body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Name must be 2-100 characters."),
  body("email").trim().isEmail().withMessage("A valid email is required.").normalizeEmail(),
  body("phone").trim().isLength({ min: 7, max: 30 }).withMessage("Phone must be 7-30 characters."),
  body("department").trim().isLength({ min: 2, max: 100 }).withMessage("Department is required."),
  body("position").trim().isLength({ min: 2, max: 100 }).withMessage("Position is required."),
  body("salary").isFloat({ min: 0 }).withMessage("Salary must be a non-negative number.").toFloat(),
  body("joinDate").isISO8601().withMessage("joinDate must be a valid ISO date."),
  body("status").optional().isIn(["active", "inactive"]).withMessage("Status must be active or inactive.")
];

const employeeUpdateValidation = [
  body("name").optional().trim().isLength({ min: 2, max: 100 }).withMessage("Name must be 2-100 characters."),
  body("email").optional().trim().isEmail().withMessage("A valid email is required.").normalizeEmail(),
  body("phone").optional().trim().isLength({ min: 7, max: 30 }).withMessage("Phone must be 7-30 characters."),
  body("department").optional().trim().isLength({ min: 2, max: 100 }).withMessage("Department is required."),
  body("position").optional().trim().isLength({ min: 2, max: 100 }).withMessage("Position is required."),
  body("salary").optional().isFloat({ min: 0 }).withMessage("Salary must be a non-negative number.").toFloat(),
  body("joinDate").optional().isISO8601().withMessage("joinDate must be a valid ISO date."),
  body("status").optional().isIn(["active", "inactive"]).withMessage("Status must be active or inactive.")
];

router.use(auth);
router.get("/", controller.listEmployees);
router.get("/:id", controller.getEmployee);
router.post("/", admin, employeeValidation, validate, controller.createEmployee);
router.put("/:id", admin, employeeUpdateValidation, validate, controller.updateEmployee);
router.delete("/:id", admin, controller.deleteEmployee);

module.exports = router;
