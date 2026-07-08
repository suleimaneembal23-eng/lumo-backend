const express = require("express");
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  getOrderById,
  deleteOrder,

  trackOrder,
  getVendorOrders, // 🏪
  updateVendorOrderItemStatus
} = require("../controllers/orderController");

const verifyToken = require("../middleware/verifyToken");

// 🟢 Rastreamento Público (Sem token)
router.post("/track", trackOrder);

// Cliente logado → criar pedido
router.post("/", verifyToken(["client"]), createOrder);

// Cliente logado → listar os seus pedidos
router.get("/user", verifyToken(["client"]), getUserOrders);

// 🏪 Vendor logado → listar pedidos com seus produtos
router.get("/vendor", verifyToken(["vendor"]), getVendorOrders);

// 🏪 Vendor logado → atualizar status de envio de um item individual do seu pedido
router.put("/vendor/:orderId/item/:itemId/status", verifyToken(["vendor"]), updateVendorOrderItemStatus);

// Cliente ou admin → buscar pedido por id
router.get("/:id", verifyToken(["client", "admin"]), getOrderById);

// Admin → listar todos pedidos
router.get("/", verifyToken(["admin"]), getAllOrders);

// Admin → atualizar status
router.put("/:id/status", verifyToken(["admin"]), updateOrderStatus);

// Admin → Deletar pedido
router.delete("/:id", verifyToken(["admin"]), deleteOrder);

module.exports = router;
