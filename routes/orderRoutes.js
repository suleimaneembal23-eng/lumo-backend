const express = require("express");
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  getOrderById,
  trackOrder
} = require("../controllers/orderController");

const verifyToken = require("../middleware/verifyToken");

// Cliente logado → criar pedido
router.post("/", verifyToken(["client"]), createOrder);

// Público → rastrear pedido
router.post("/track", trackOrder);

// Cliente logado → listar os seus pedidos
router.get("/user", verifyToken(["client"]), getUserOrders);

// Cliente ou admin → buscar pedido por id
router.get("/:id", verifyToken(["client","admin"]), getOrderById);

// Admin → listar todos pedidos
router.get("/", verifyToken(["admin"]), getAllOrders);

// Vendor → listar pedidos que incluem os seus produtos
router.get("/vendor", verifyToken(["vendor"]), async (req, res) => {
  const Order = require('../models/Order');
  try {
    const vendorId = req.userId;
    const orders = await Order.find({ 'shopOrders.shopId': vendorId })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');
    return res.json(orders);
  } catch (err) {
    console.error('getVendorOrders error:', err);
    return res.status(500).json({ error: 'Erro ao buscar pedidos do vendor.' });
  }
});

// Admin → atualizar status
router.put("/:id/status", verifyToken(["admin"]), updateOrderStatus);

// Admin → apagar pedido
router.delete("/:id", verifyToken(["admin"]), async (req, res) => {
  const Order = require('../models/Order');
  try {
    const orderId = req.params.id;
    const deletedOrder = await Order.findByIdAndDelete(orderId);
    if (!deletedOrder) {
      return res.status(404).json({ message: "Pedido não encontrado." });
    }
    res.json({ message: "Pedido apagado com sucesso!" });
  } catch (err) {
    console.error("Erro ao apagar pedido:", err);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

module.exports = router;
