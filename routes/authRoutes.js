const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const adminController = require("../controllers/adminController");
const verifyToken = require("../middleware/verifyToken");

// Registro de cliente
router.post("/register", authController.registerClient);

// Registro de admin (Protegido por Chave Mestra e Token de Admin)
router.post("/register-admin", verifyToken(["admin"]), authController.registerAdmin);

// Alterar Senha
router.put("/change-password", verifyToken(["admin", "vendor", "client"]), authController.changePassword);

// Login unificado
router.post("/login", authController.login);

// Dashboard admin
router.get("/dashboard", verifyToken(["admin"]), adminController.getDashboardStats);

module.exports = router;
