const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto"); // Para gerar tokens
const emailService = require("../services/emailService");

const JWT_SECRET = process.env.JWT_SECRET || "Comiocudequemleu";
const STORE_URL = process.env.STORE_URL || "http://localhost:3000";

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: "7d" });
};

// Registro de cliente
const registerClient = async (req, res) => {
  try {
    const { name, email, password, username } = req.body;

    // Verificar se email já existe
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "Email já registrado" });

    // Verificar se username já existe (se fornecido)
    if (username) {
      const usernameExists = await User.findOne({ username });
      if (usernameExists) return res.status(400).json({ message: "Nome de usuário já em uso" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      username: username || undefined, // Salva apenas se existir
      password: hashedPassword,
      role: "client",
    });

    res.status(201).json({
      _id: user._id,
      userId: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (err) {
    res.status(500).json({
      message: "Erro ao registrar cliente",
      error: err.message,
    });
  }
};

// Registro de admin (Mantido igual, mas preparado para username se quiser)
const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "Email já registrado" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
    });

    res.status(201).json({
      _id: admin._id,
      userId: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      token: generateToken(admin._id, admin.role),
    });
  } catch (err) {
    res.status(500).json({
      message: "Erro ao registrar admin",
      error: err.message,
    });
  }
};

// Login unificado (Email OU Username)
const login = async (req, res) => {
  try {
    const { login, password } = req.body; // Agora recebe 'login' em vez de 'email'

    // Busca por Email OU Username
    const user = await User.findOne({
      $or: [{ email: login }, { username: login }]
    });

    if (!user) return res.status(401).json({ message: "Credenciais inválidas" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Credenciais inválidas" });

    // Bloqueio de clientes (Avaliado APENAS após credenciais corretas para prevenir username enumeration)
    if (user.role === "client" && user.isBlocked) {
      return res.status(403).json({
        message: "Conta bloqueada! Em caso de dúvida, solicite o suporte. Obrigado!"
      });
    }

    res.json({
      _id: user._id,
      userId: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      vendorInfo: user.vendorInfo, // Include vendor info for dashboard
      token: generateToken(user._id, user.role),
    });
  } catch (err) {
    res.status(500).json({
      message: "Erro ao fazer login",
      error: err.message,
    });
  }
};

// Esqueci a Senha (Gerar Token)
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "Usuário não encontrado." });

    // Gerar token aleatório
    const token = crypto.randomBytes(20).toString("hex");

    // Salvar token e validade (1 hora)
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hora
    await user.save();

    // Enviar email
    const resetUrl = `${STORE_URL}/reset-password/${token}`;
    await emailService.sendPasswordResetEmail(user.email, resetUrl);

    res.json({ message: "Email de recuperação enviado!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao processar solicitação." });
  }
};

// Resetar Senha (Validar Token e Trocar)
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() } // Verifica se não expirou
    });

    if (!user) return res.status(400).json({ message: "Token inválido ou expirado." });

    // Hash da nova senha
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Senha alterada com sucesso! Faça login." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao redefinir senha." });
  }
};

module.exports = { registerClient, registerAdmin, login, forgotPassword, resetPassword };