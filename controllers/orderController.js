const Order = require("../models/Order");
const Product = require("../models/Product");
const mongoose = require("mongoose");

// Criar pedido
exports.createOrder = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "UsuÃ¡rio nÃ£o autenticado." });

    const { items, shippingAddress, paymentMethod, itemsPrice, shippingPrice = 0, taxPrice = 0, totalPrice, deliveryPreferences = {} } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: "Carrinho vazio." });

    const groupedShops = {};

    for (const it of items) {
      if (!it.productId || !mongoose.Types.ObjectId.isValid(it.productId))
        return res.status(400).json({ message: "productId invÃ¡lido." });

      const product = await Product.findById(it.productId).lean();
      if (!product) return res.status(400).json({ message: `Produto indisponÃ­vel ou removido: ${it.productId}` });

      const shopId = product.shopId ? product.shopId.toString() : "default";
      if (!groupedShops[shopId]) {
        groupedShops[shopId] = {
            shopId: product.shopId,
            shopName: product.shopName || "Loja Principal",
            items: [],
            deliveryMethod: deliveryPreferences[shopId] || "delivery",
            trackingCode: `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
            status: "pending"
        };
      }

      groupedShops[shopId].items.push({
        productId: product._id,
        name: product.name,
        image: product.image,
        price: it.price ?? product.price,
        quantity: it.quantity ?? 1,
        size: it.size ?? null
      });
    }

    const shopOrdersArray = Object.values(groupedShops);

    const order = new Order({
      userId,
      shopOrders: shopOrdersArray,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice
    });

    const saved = await order.save();
    try {
      const User = require('../models/User');
      const user = await User.findById(userId);
      if (user && user.email) {
        const emailService = require('../utils/emailService');
        emailService.sendOrderConfirmation(user, saved);
        emailService.sendNewOrderAdminNotification(saved);
      }
    } catch(emailErr) {
      console.error('Erro envio de email:', emailErr);
    }
    return res.status(201).json(saved);
  } catch (err) {
    console.error("createOrder error:", err);
    return res.status(500).json({ error: "Erro ao criar pedido." });
  }
};

// Listar pedidos do cliente logado
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "UsuÃ¡rio nÃ£o autenticado." });

    const orders = await Order.find({ userId }).sort({ createdAt: -1 }).populate({ path: "shopOrders.items.productId", select: "name image", strictPopulate: false });
    return res.json(orders);
  } catch (err) {
    console.error("getUserOrders error:", err);
    return res.status(500).json({ error: "Erro ao buscar pedidos do usuÃ¡rio." });
  }
};

// Listar todos pedidos (admin)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).populate("userId", "name email").populate({ path: "shopOrders.items.productId", select: "name image", strictPopulate: false });
    return res.json(orders);
  } catch (err) {
    console.error("getAllOrders error:", err);
    return res.status(500).json({ error: "Erro ao buscar pedidos." });
  }
};

// Atualizar status do sub-pedido (admin ou vendor)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params; // Order ID
    const { shopId, status, trackingCode } = req.body; 
    const allowed = ["pending", "confirmed", "paid", "shipped", "ready_for_pickup", "delivered", "cancelled"];
    
    if (!allowed.includes(status)) return res.status(400).json({ message: "Status invÃ¡lido." });

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Pedido nÃ£o encontrado." });

    // Se for admin a atualizar o estado global, ou vendor a atualizar a sua sub-loja
    const shopOrder = shopId ? order.shopOrders.find(s => s.shopId && s.shopId.toString() === shopId) : order.shopOrders[0];
    
    if (!shopOrder) return res.status(404).json({ message: "Loja nÃ£o encontrada neste pedido." });

    shopOrder.status = status;
    if (trackingCode) shopOrder.trackingCode = trackingCode;
    
    if (status === "shipped") shopOrder.shippedAt = new Date();
    if (status === "paid" && !order.paidAt) order.paidAt = new Date();

    const updated = await order.save();
    return res.json(updated);
  } catch (err) {
    console.error("updateOrderStatus error:", err);
    return res.status(500).json({ error: "Erro ao atualizar status do pedido." });
  }
};

// Buscar pedido especÃ­fico (user/admin)
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
        .populate("userId", "name email")
        .populate("shopOrders.shopId", "vendorInfo.storeName")
        .populate({ path: "shopOrders.items.productId", select: "name image", strictPopulate: false });
    if (!order) return res.status(404).json({ message: "Pedido nÃ£o encontrado." });

    if (req.userId && order.userId._id.toString() !== req.userId.toString()) {
      if (!req.adminId) return res.status(403).json({ message: "Acesso negado ao pedido." });
    }

    return res.json(order);
  } catch (err) {
    console.error("getOrderById error:", err);
    return res.status(500).json({ error: "Erro ao buscar pedido." });
  }
};

// Rastrear Pedido (Público)
exports.trackOrder = async (req, res) => {
  try {
    const { orderId, email } = req.body;
    if (!orderId || !email) return res.status(400).json({ message: 'Forneça o ID do pedido e o email.' });

    const order = await Order.findById(orderId).populate('userId', 'email').populate({ path: 'shopOrders.items.productId', select: 'name image', strictPopulate: false });
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado.' });

    if (order.userId.email !== email) {
      return res.status(403).json({ message: 'Email não corresponde ao pedido.' });
    }

    return res.json(order);
  } catch (err) {
    console.error('trackOrder error:', err);
    return res.status(500).json({ error: 'Erro ao rastrear pedido.' });
  }
};




