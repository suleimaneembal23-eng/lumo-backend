const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const bcrypt = require("bcryptjs"); // 🔐 Needed for manual vendor creation
const emailService = require("../services/emailService");

exports.getDashboardStats = async (req, res) => {
  console.log("📊 Admin Dashboard stats requested...");
  try {
    const totalRevenue = await Order.aggregate([
      { $match: { status: { $in: ["paid", "shipped", "delivered"] } } }, // Only count paid orders
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ]);

    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments(); // 🔹 sem role

    // Últimos 30 dias
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const ordersLast30Days = await Order.aggregate([
      { $match: { createdAt: { $gte: last30Days } } },
      {
        $group: {
          _id: { $dayOfMonth: "$createdAt" },
          count: { $sum: 1 },
          total: { $sum: "$totalPrice" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // 📊 MONTHLY SALES HISTORY (Last 12 months)
    const monthlyRevenue = await Order.aggregate([
      { $match: { status: { $in: ["paid", "shipped", "delivered"] } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          revenue: { $sum: "$totalPrice" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 }
    ]);

    const revenueData = ordersLast30Days.map(o => ({
      date: o._id,
      value: o.total
    }));

    const ordersData = ordersLast30Days.map(o => ({
      date: o._id,
      value: o.count
    }));

    res.json({
      totalRevenue: totalRevenue[0]?.total || 0,
      totalOrders,
      totalProducts,
      totalUsers, // 🔹 trocado para totalUsers
      revenueLast30Days: revenueData,
      ordersLast30Days: ordersData,
      monthlyRevenue: monthlyRevenue.reverse() // Oldest to newest
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Erro ao carregar estatísticas do dashboard",
      error: err.message
    });
  }
};


// 🏪 Criar Vendedor (Manualmente pelo Admin)
exports.createVendor = async (req, res) => {
  console.log("👉 [ADMIN] Create Vendor Request:", req.body);
  try {
    const { name, email, password, storeName, slug } = req.body;

    // Validations
    if (!name || !email || !password || !storeName || !slug) {
      return res.status(400).json({ message: "Todos os campos são obrigatórios." });
    }

    // Check availability
    const existingUser = await User.findOne({ $or: [{ email }, { "vendorInfo.slug": slug }] });
    if (existingUser) {
      return res.status(400).json({ message: "Email ou URL da loja já em uso." });
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Vendor
    const newVendor = new User({
      name,
      email,
      password: hashedPassword,
      role: "vendor",
      vendorInfo: {
        storeName,
        slug,
        description: `Bem-vindo à loja oficial ${storeName}.`
      }
    });

    await newVendor.save();

    res.status(201).json({ message: "Vendedor criado com sucesso!", vendor: newVendor });

  } catch (error) {
    console.error("Erro ao criar vendedor:", error);
    res.status(500).json({ message: "Erro interno ao criar vendedor." });
  }
};

// 🏪 Listar Todos os Vendedores
exports.getVendors = async (req, res) => {
  try {
    const vendors = await User.find({ role: "vendor" }).select("-password");
    res.json(vendors);
  } catch (error) {
    console.error("Erro ao listar vendedores:", error);
    res.status(500).json({ message: "Erro ao listar vendedores." });
  }
};

// 📝 Adicionar Observação a um Produto e Notificar Vendor
exports.addProductObservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { observation } = req.body;

    const product = await Product.findById(id).populate('vendor');
    if (!product) return res.status(404).json({ message: "Produto não encontrado" });

    // Salvar no MongoDB
    product.adminNotes = observation;
    await product.save();

    // Alertar Vendedor pelo Email
    if (product.vendor && product.vendor.email) {
      await emailService.sendAdminObservationEmail(product.vendor.email, product.name, observation);
    }

    res.json({ message: "Observação enviada com sucesso!" });
  } catch (error) {
    console.error("Erro ao adicionar observação:", error);
    res.status(500).json({ message: "Erro interno ao submeter alerta de Admin." });
  }
};

// 🧹 Limpar Observação de um Produto (Admin confirmou correção)
exports.clearProductObservation = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Produto não encontrado" });

    // Remover nota
    product.adminNotes = "";
    await product.save();

    res.json({ message: "Infração limpa. O aviso foi removido com sucesso!" });
  } catch (error) {
    console.error("Erro ao limpar observação:", error);
    res.status(500).json({ message: "Erro interno ao limpar alerta de Admin." });
  }
};
