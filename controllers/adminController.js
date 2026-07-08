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
