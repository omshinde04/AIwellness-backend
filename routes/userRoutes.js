const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getCurrentUser,
  changePassword,     // ✅ Added
  updateUser          // ✅ Added
} = require("../controllers/userController");

const authMiddleware = require("../middleware/auth");

// 🌐 Public Routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// 🔐 Protected Routes
router.get("/me", authMiddleware, getCurrentUser);
router.put("/change-password", authMiddleware, changePassword); // ✅ Password change route
router.put("/update", authMiddleware, updateUser);              // ✅ Profile update route

module.exports = router;
