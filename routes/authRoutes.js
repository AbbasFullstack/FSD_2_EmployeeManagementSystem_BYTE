const express = require("express");
const { body } = require("express-validator");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const validate = require("../middleware/validate");
const controller = require("../controllers/authController");

const router = express.Router();

const registerValidation = [
  body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Name must be 2-100 characters."),
  body("email").trim().isEmail().withMessage("A valid email is required.").normalizeEmail(),
  body("password").isString().isLength({ min: 8 }).withMessage("Password must be at least 8 characters."),
  body("role").optional().isIn(["user", "admin"]).withMessage("Role must be user or admin.")
];

const loginValidation = [
  body("email").trim().isEmail().withMessage("A valid email is required.").normalizeEmail(),
  body("password").isString().notEmpty().withMessage("Password is required.")
];

router.post("/register", registerValidation, validate, controller.register);
router.post("/login", loginValidation, validate, controller.login);
router.get("/me", auth, controller.me);
router.post("/register-admin", auth, admin, registerValidation, validate, controller.register);

module.exports = router;
