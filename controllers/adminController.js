const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");
const bcrypt = require("bcryptjs");

// Obter todos os vendedores
exports.getVendors = async (req, res) => {
    try {
        const vendors = await User.find({ role: "vendor" }).select("-password");
        res.json(vendors);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar vendedores", error: error.message });
    }
};

// Criar um vendedor
exports.createVendor = async (req, res) => {
    try {
        const { name, email, storeName, slug, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: "Email já registrado" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const vendor = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "vendor",
            vendorInfo: {
                storeName,
                slug,
                subscription: { plan: "Free" }
            }
        });

        res.status(201).json({ message: "Vendedor criado com sucesso", vendor });
    } catch (error) {
        res.status(500).json({ message: "Erro ao criar vendedor", error: error.message });
    }
};

// Obter estatísticas do dashboard do administrador
exports.getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: "client" });
        const totalVendors = await User.countDocuments({ role: "vendor" });
        const totalProducts = await Product.countDocuments();
        
        // Calcular vendas e totais
        const orders = await Order.find();
        const totalOrders = orders.length;
        const totalSales = orders.reduce((acc, order) => acc + (order.totalPrice || 0), 0);

        res.json({
            totalUsers,
            totalVendors,
            totalProducts,
            totalOrders,
            totalSales
        });
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar estatísticas", error: error.message });
    }
};

// Obter todos os administradores
exports.getAdmins = async (req, res) => {
    try {
        const admins = await User.find({ role: "admin" }).select("-password").sort({ lastLogin: -1 });
        res.json(admins);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar admins", error: error.message });
    }
};

// Apagar um administrador
exports.deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { masterSecret } = req.body;
        const reqAdminId = req.user.id;

        const currentAdmin = await User.findById(reqAdminId);
        if (!currentAdmin) return res.status(404).json({ message: "Administrador atual não encontrado." });

        if (currentAdmin.adminLockUntil && currentAdmin.adminLockUntil > new Date()) {
            return res.status(429).json({ message: "Ação bloqueada. Demasiadas tentativas." });
        }

        const SERVER_MASTER_SECRET = process.env.MASTER_ADMIN_SECRET || "Lumo2026MasterKey!";
        
        if (masterSecret !== SERVER_MASTER_SECRET) {
            currentAdmin.failedAdminAttempts = (currentAdmin.failedAdminAttempts || 0) + 1;
            if (currentAdmin.failedAdminAttempts >= 5) {
                currentAdmin.adminLockUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
            }
            await currentAdmin.save();
            return res.status(403).json({ message: "Chave Mestra inválida." });
        }

        currentAdmin.failedAdminAttempts = 0;
        currentAdmin.adminLockUntil = null;
        await currentAdmin.save();

        if (id === reqAdminId) {
            return res.status(400).json({ message: "Não podes apagar a tua própria conta enquanto estás ligado." });
        }

        const adminToDelete = await User.findById(id);
        if (!adminToDelete || adminToDelete.role !== 'admin') {
            return res.status(404).json({ message: "Administrador não encontrado." });
        }

        await User.findByIdAndDelete(id);
        res.json({ message: "Administrador removido com sucesso." });
    } catch (error) {
        res.status(500).json({ message: "Erro ao remover administrador", error: error.message });
    }
};
