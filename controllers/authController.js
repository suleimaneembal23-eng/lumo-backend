const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "Comiocudequemleu";

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: "7d" });
};

// Registro de cliente
const registerClient = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "Email já registrado" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "client",
    });

    res.status(201).json({
      _id: user._id,
      userId: user._id, // ← ADICIONADO para compatibilidade
      name: user.name,
      email: user.email,
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

// Registro de admin (Protegido por Chave Mestra)
const registerAdmin = async (req, res) => {
  try {
    const { name, email, password, masterSecret } = req.body;
    const reqAdminId = req.user.id; // Pegar o ID do admin que está a fazer o pedido

    const currentAdmin = await User.findById(reqAdminId);
    if (!currentAdmin) {
        return res.status(404).json({ message: "Administrador atual não encontrado." });
    }

    // Verificar se está bloqueado
    if (currentAdmin.adminLockUntil && currentAdmin.adminLockUntil > new Date()) {
        const hoursLeft = Math.ceil((currentAdmin.adminLockUntil - new Date()) / (1000 * 60 * 60));
        return res.status(429).json({ message: `Ação bloqueada. Demasiadas tentativas. Tente novamente daqui a ${hoursLeft} horas.` });
    }

    const SERVER_MASTER_SECRET = process.env.MASTER_ADMIN_SECRET || "Lumo2026MasterKey!";
    
    // Se falhar a Chave Mestra
    if (masterSecret !== SERVER_MASTER_SECRET) {
      currentAdmin.failedAdminAttempts = (currentAdmin.failedAdminAttempts || 0) + 1;
      let errorMsg = "Chave Mestra inválida.";
      
      if (currentAdmin.failedAdminAttempts >= 5) {
          currentAdmin.adminLockUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // Bloqueia por 24h
          errorMsg = "Excedeu as 5 tentativas. Criação de administradores bloqueada por 24 horas.";
      } else {
          errorMsg = `Chave Mestra inválida. Restam ${5 - currentAdmin.failedAdminAttempts} tentativas.`;
      }
      await currentAdmin.save();
      return res.status(403).json({ message: errorMsg });
    }

    // Se acertou a Chave Mestra, limpa o contador
    currentAdmin.failedAdminAttempts = 0;
    currentAdmin.adminLockUntil = null;
    await currentAdmin.save();

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "Email já registrado" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
    });

    res.status(201).json({
      _id: admin._id,
      userId: admin._id, // ← ADICIONADO para compatibilidade
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

// Login unificado com bloqueio de cliente
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "Credenciais inválidas" });

    // Bloqueio de clientes
    if (user.role === "client" && user.isBlocked) {
      return res.status(403).json({ 
        message: "Conta bloqueada! Em caso de dúvida, solicite o suporte. Obrigado!" 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Credenciais inválidas" });

    // Calcular se a subscrição está ativa
    const plan = user.vendorInfo?.subscription?.plan;
    const expiryDate = user.vendorInfo?.subscription?.expiryDate;
    const isActive = plan === 'VIP' && expiryDate && new Date(expiryDate) > new Date();

    const vendorInfo = user.role === 'vendor' ? {
      storeName: user.vendorInfo?.storeName || '',
      slug: user.vendorInfo?.slug || '',
      description: user.vendorInfo?.description || '',
      logo: user.vendorInfo?.logo || null,
      banner: user.vendorInfo?.banner || null,
      subscription: {
        plan: plan || 'Free',
        expiryDate: expiryDate || null,
        isActive: !!isActive
      }
    } : null;

    res.json({
      _id: user._id,
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      vendorInfo,
      token: generateToken(user._id, user.role),
    });
  } catch (err) {
    res.status(500).json({
      message: "Erro ao fazer login",
      error: err.message,
    });
  }
};

// Alterar Senha (Usuário Autenticado)
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id; // Pegue o ID a partir do token verificado

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilizador não encontrado" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "A senha atual está incorreta" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Senha atualizada com sucesso!" });
  } catch (err) {
    res.status(500).json({
      message: "Erro ao atualizar senha",
      error: err.message,
    });
  }
};

module.exports = { registerClient, registerAdmin, login, changePassword };