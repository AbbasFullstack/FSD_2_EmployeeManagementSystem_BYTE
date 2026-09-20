const jwt = require("jsonwebtoken");
const User = require("../models/User");

function signToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function userResponse(user) {
  return {
    id: user._id, name: user.name, email: user.email, role: user.role,
    createdAt: user.createdAt, updatedAt: user.updatedAt
  };
}

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const requestedRole = role === "admin" && req.user?.role === "admin" ? "admin" : "user";
    const user = await User.create({ name, email, password, role: requestedRole });
    res.status(201).json({
      success: true, message: "User registered successfully.",
      user: userResponse(user), token: signToken(user)
    });
  } catch (error) { next(error); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }
    res.json({
      success: true, message: "Login successful.",
      user: userResponse(user), token: signToken(user)
    });
  } catch (error) { next(error); }
};

exports.me = async (req, res) => res.json({ success: true, user: userResponse(req.user) });
