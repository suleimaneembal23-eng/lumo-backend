const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { registerClient, registerAdmin, login, forgotPassword, resetPassword } = require("../controllers/authController");
const adminController = require("../controllers/adminController");
const verifyToken = require("../middleware/verifyToken");

// Anti-Brute Force nas tentativas de login (Desativado para testes)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Limita a 5 tentativas de login
  message: { message: "Muitas tentativas de login! Por favor, aguarde 15 minutos." }
});

// Rotas de Autenticação
router.post("/register", registerClient);
router.post("/register-admin", registerAdmin);
// TODO: Implementar lógica de bloqueio na base de dados por conta E APENAS em caso de password errada.
router.post("/login", /* loginLimiter, */ login);

// Rotas de Recuperação de Senha
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);



// Dashboard admin
router.get("/dashboard", verifyToken(["admin"]), adminController.getDashboardStats);

module.exports = router;
