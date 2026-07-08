const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const adminController = require("../controllers/adminController");
const verifyToken = require("../middleware/verifyToken");

// Registro de cliente
router.post("/register", authController.registerClient);

// Registro de admin
router.post("/register-admin", authController.registerAdmin);

// Login unificado
router.post("/login", authController.login);

// Dashboard admin
router.get("/dashboard", verifyToken(["admin"]), adminController.getDashboardStats);

module.exports = router;
