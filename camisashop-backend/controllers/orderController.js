const Order = require("../models/Order");
const Product = require("../models/Product");
const mongoose = require("mongoose");
const emailService = require("../services/emailService"); // Importar serviço de email
const User = require("../models/User"); // Importar modelo User para buscar email se necessário

// Criar pedido
exports.createOrder = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Usuário não autenticado." });

    const { items, shippingAddress, paymentMethod, shippingMethod, itemsPrice, shippingPrice = 0, taxPrice = 0, totalPrice, paymentResult, status } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: "Carrinho vazio." });

    const validatedItems = [];
    const vendorIdSet = new Set(); // 🏪 Collect unique vendors involved

    for (const it of items) {
      if (!it.productId || !mongoose.Types.ObjectId.isValid(it.productId))
        return res.status(400).json({ message: "productId inválido." });

      // Buscar produto com dados do Vendor para checar assinatura
      const product = await Product.findById(it.productId).populate('vendor');
      if (!product) return res.status(400).json({ message: `Produto indisponível ou removido: ${it.productId}` });

      let commission = 0;
      let vendorNet = it.price ?? product.price;

      if (product.vendor) {
        vendorIdSet.add(product.vendor._id.toString());

        // 💎 Lógica de Comissão Híbrida
        const isPremium = product.vendor.subscription && product.vendor.subscription.isActive;
        const price = it.price ?? product.price;

        if (isPremium) {
          // Premium = Sem taxas
          commission = 0;
          vendorNet = price;
        } else {
          // Grátis = 10% + 0.99
          commission = (price * 0.10) + 0.99;
          vendorNet = price - commission;
        }
      }

      validatedItems.push({
        productId: product._id,
        name: product.name,
        image: product.image,
        price: it.price ?? product.price,
        quantity: it.quantity ?? 1,
        size: it.size ?? null,
        // 💾 Salvando o Split Financeiro
        commission: parseFloat(commission.toFixed(2)),
        vendorNet: parseFloat(vendorNet.toFixed(2)),
        vendorId: product.vendor ? product.vendor._id.toString() : 'admin' // 🏪 Identificador para a separação
      });
    }

    // 📦 AGRUPAR ITENS POR VENDEDOR
    const itemsByVendor = {};
    for (const item of validatedItems) {
      const vId = item.vendorId;
      if (!itemsByVendor[vId]) itemsByVendor[vId] = [];
      itemsByVendor[vId].push(item);
    }

    const createdOrders = [];
    const globalItemsPrice = itemsPrice || validatedItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);

    // 🏆 CRIAR UMA ENCOMENDA INDEPENDENTE POR VENDEDOR
    for (const [vId, vItems] of Object.entries(itemsByVendor)) {
      const vItemsPrice = vItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);
      const ratio = globalItemsPrice > 0 ? (vItemsPrice / globalItemsPrice) : 0;

      const vShipping = shippingPrice * ratio;
      const vTax = taxPrice * ratio;
      const vTotal = vItemsPrice + vShipping + vTax;

      const newOrder = new Order({
        userId,
        vendorIds: vId !== 'admin' ? [vId] : [],
        items: vItems, // Apenas os itens deste vendor!
        shippingAddress,
        paymentMethod,
        shippingMethod,
        itemsPrice: Math.round(vItemsPrice),
        shippingPrice: Math.round(vShipping),
        taxPrice: Math.round(vTax),
        totalPrice: Math.round(vTotal),
        paymentResult, // ✅ Salva ID do pagamento Stripe em todas as sub-encomendas
        status: status || (paymentMethod === "credit_card" ? "paid" : "pending"),
        paidAt: (status === "paid" || paymentMethod === "credit_card") ? new Date() : undefined
      });

      const saved = await newOrder.save();
      createdOrders.push(saved);
    }

    // 📦 Atualizar Stock e Verificar Alertas
    for (const it of items) {
      try {
        const product = await Product.findById(it.productId).populate('vendor');
        if (product) {
          const quantity = it.quantity || 1;

          // Incrementar vendas
          product.salesCount = (product.salesCount || 0) + quantity;

          // Decrementar stock
          product.stockQuantity = Math.max(0, (product.stockQuantity || 0) - quantity);

          // Verificar se stock está baixo e enviar alerta
          const threshold = product.lowStockThreshold || 5;
          if (product.stockQuantity >= 0 && product.stockQuantity <= threshold) {
            console.log(`⚠️ Stock baixo detectado para ${product.name}: ${product.stockQuantity} unidades`);

            if (product.vendor) {
              // Enviar email de alerta ao vendor (não espera para não bloquear)
              emailService.sendLowStockAlert(product, product.vendor).catch(err => {
                console.error(`Erro ao enviar alerta para ${product.name}:`, err);
              });
            }
          }

          await product.save();
        }
      } catch (stockErr) {
        console.error(`Erro ao atualizar stock de ${it.productId}:`, stockErr);
        // Não bloqueia o pedido por erro de stock
      }
    }

    // 📧 Tentar enviar emails (Multi-Order)
    try {
      const user = await User.findById(userId);
      if (user && user.email) {
         // Opcional: Enviar 1 email por sub-order ou enviar um global. Enviando 1 por vendor para transparência:
         for (const ord of createdOrders) {
           await emailService.sendOrderConfirmation(user.email, ord);
         }
      }
      
      for (const ord of createdOrders) {
        // Email Global Admin
        await emailService.sendNewOrderAlert(ord);
        
        // Email Individual ao Vendor
        if (ord.vendorIds && ord.vendorIds.length > 0) {
          const vendorUser = await User.findById(ord.vendorIds[0]);
          if (vendorUser && vendorUser.email) {
              await emailService.sendVendorOrderAlert(ord, vendorUser);
          }
        }
      }
    } catch (emailErr) {
      console.error("Falha silenciosa ao enviar emails:", emailErr);
    }

    return res.status(201).json(createdOrders);
  } catch (err) {
    console.error("createOrder error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// ... (getUserOrders e getAllOrders mantidos iguais) ...
// Listar pedidos do cliente logado
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Usuário não autenticado." });

    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (err) {
    console.error("getUserOrders error:", err);
    return res.status(500).json({ error: "Erro ao buscar pedidos do usuário." });
  }
};

// Listar todos pedidos (admin)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).populate("userId", "name email");
    return res.json(orders);
  } catch (err) {
    console.error("getAllOrders error:", err);
    return res.status(500).json({ error: "Erro ao buscar pedidos." });
  }
};

// Atualizar status do pedido (admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ["pending", "confirmed", "paid", "shipped", "cancelled"];
    if (!allowed.includes(status)) return res.status(400).json({ message: "Status inválido." });

    // Populate userId para pegar o email do cliente
    const order = await Order.findById(id).populate('userId');
    if (!order) return res.status(404).json({ message: "Pedido não encontrado." });

    order.status = status;
    if (status === "paid") order.paidAt = new Date();
    if (status === "shipped") order.shippedAt = new Date();

    const updated = await order.save();

    // 📧 Enviar notificação de status
    try {
      if (order.userId && order.userId.email) {
        await emailService.sendOrderStatusUpdate(order.userId.email, order, status);
      }
    } catch (emailErr) {
      console.error("Falha ao enviar email de status:", emailErr);
    }

    return res.json(updated);
  } catch (err) {
    console.error("updateOrderStatus error:", err);
    return res.status(500).json({ error: "Erro ao atualizar status do pedido." });
  }
};

// Buscar pedido específico (user/admin)
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate("userId", "name email").populate("items.productId", "name image");
    if (!order) return res.status(404).json({ message: "Pedido não encontrado." });

    if (req.userId && order.userId._id.toString() !== req.userId.toString()) {
      if (!req.adminId) return res.status(403).json({ message: "Acesso negado ao pedido." });
    }

    return res.json(order);
  } catch (err) {
    console.error("getOrderById error:", err);
    return res.status(500).json({ error: "Erro ao buscar pedido." });
  }
};
// Deletar pedido (admin)
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByIdAndDelete(id);

    if (!order) {
      return res.status(404).json({ message: "Pedido não encontrado." });
    }

    return res.json({ message: "Pedido removido com sucesso." });
  } catch (err) {
    console.error("deleteOrder error:", err);
    return res.status(500).json({ error: "Erro ao deletar pedido." });
  }
};

// 🟢 Rastrear Pedido (Público)
// 🟢 Rastrear Pedido (Público, suporta ID Completo ou ID Curto + Email)
exports.trackOrder = async (req, res) => {
  try {
    const { orderId, email } = req.body;
    if (!orderId) return res.status(400).json({ message: "ID do pedido/item é obrigatório." });

    const targetSuffix = orderId.trim().toLowerCase();
    let foundOrder = null;
    let foundItem = null;

    if (email) {
      const user = await User.findOne({ email });
      if (user) {
        const userOrders = await Order.find({ userId: user._id }).select("status createdAt totalPrice items shippingAddress").lean();
        
        // 1. Tentar fazer match com ID de Item (Prioridade: Rastreio Individual de Vendor)
        for (const o of userOrders) {
          const matchItem = o.items.find(it => it._id && it._id.toString().toLowerCase().endsWith(targetSuffix));
          if (matchItem) {
             foundOrder = o;
             foundItem = matchItem;
             break;
          }
        }

        // 2. Se não encontrou item, tenta fazer match com ID da Encomenda (Global)
        if (!foundOrder) {
          foundOrder = userOrders.find(o => o._id.toString().toLowerCase().endsWith(targetSuffix));
        }
      }
    } else {
      if (mongoose.Types.ObjectId.isValid(orderId)) {
        foundOrder = await Order.findOne({ "items._id": orderId }).select("status createdAt totalPrice items shippingAddress").lean();
        if (foundOrder) {
           foundItem = foundOrder.items.find(it => it._id.toString() === orderId);
        } else {
           foundOrder = await Order.findById(orderId).select("status createdAt totalPrice items shippingAddress").lean();
        }
      }
    }

    if (!foundOrder) {
      return res.status(404).json({
        message: "Pedido não encontrado. Verifique se o código e o email estão corretos."
      });
    }

    // Isolar apenas o item caso o rastreio seja específico de produto / vendor (Garante Privacidade)
    if (foundItem) {
      foundOrder.items = [foundItem];
      foundOrder.totalPrice = foundItem.price * foundItem.quantity; // Mostra apenas o total daquele item
    }

    return res.json(foundOrder);
  } catch (error) {
    console.error("trackOrder Error:", error);
    return res.status(500).json({ message: "Erro ao rastrear pedido." });
  }
};

// 🏪 NOVO: Listar pedidos do vendedor logado
exports.getVendorOrders = async (req, res) => {
  try {
    const userId = req.userId;
    // Busca pedidos onde o vendor faz parte da lista vendorIds
    // Populate items.productId para mostrar detalhes e pegar o vendor
    let orders = await Order.find({ vendorIds: userId })
      .sort({ createdAt: -1 })
      .populate("userId", "name email phone") // Dados do cliente
      .populate({
        path: "items.productId",
        select: "name image price vendor"
      });

    // 🔒 Filtra os itens do pedido para mostrar APENAS os itens deste vendor
    orders = orders.map(order => {
      const filteredOrder = order.toObject();
      filteredOrder.items = filteredOrder.items.filter(item => {
        // Verifica se o productId existe e se o vendor dele corresponde ao userId atual
        return item.productId && item.productId.vendor && item.productId.vendor.toString() === userId.toString();
      });
      return filteredOrder;
    });

    return res.json(orders);
  } catch (err) {
    console.error("getVendorOrders error:", err);
    return res.status(500).json({ error: "Erro ao buscar pedidos do vendedor." });
  }
};

// 🏪 NOVO: Atualizar status independente de um item do pedido (pelo Vendor)
exports.updateVendorOrderItemStatus = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { status } = req.body;
    const userId = req.userId; // ID do Vendor logado

    const allowed = ["pending", "processing", "shipped", "delivered", "cancelled"];
    if (!allowed.includes(status)) return res.status(400).json({ message: "Status de item inválido." });

    const order = await Order.findById(orderId).populate("items.productId");
    if (!order) return res.status(404).json({ message: "Pedido não encontrado." });

    const item = order.items.id(itemId);
    if (!item) return res.status(404).json({ message: "Item não encontrado no pedido." });

    // Verifica se o item percente de facto ao vendor autenticado
    if (item.productId && item.productId.vendor && item.productId.vendor.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Acesso negado: Este item não lhe pertence." });
    }

    item.status = status;
    const updated = await order.save();

    return res.json(updated);
  } catch (err) {
    console.error("updateVendorOrderItemStatus error:", err);
    return res.status(500).json({ error: "Erro ao atualizar status do item." });
  }
};
