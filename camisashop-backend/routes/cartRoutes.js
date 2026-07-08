const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const verifyToken = require('../middleware/verifyToken');

// ✅ Middleware para todas as rotas do carrinho (apenas clientes autenticados)
// Se quiseres restringir apenas a clientes: verifyToken(["client"])
// Se qualquer utilizador autenticado pode usar: verifyToken([])
const authMiddleware = verifyToken([]);

// Obter carrinho do utilizador
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('📦 [GET /cart] Buscando carrinho do utilizador:', req.user.id);

    let cart = await Cart.findOne({ userId: req.user.id })
      .populate({
        path: 'items.productId',
        select: 'name image price vendor', // Select vendor field
        populate: {
          path: 'vendor',
          select: 'email phone vendorInfo.shippingSettings vendorInfo.storeName vendorInfo.pickupAddress' // Select shipping + physical address + contacts
        }
      });

    if (!cart) {
      console.log('📦 [GET /cart] Carrinho não existe, criando novo...');
      cart = await Cart.create({ userId: req.user.id, items: [] });
    }

    console.log('✅ [GET /cart] Carrinho obtido com sucesso:', cart.items.length, 'itens');
    res.json(cart);
  } catch (error) {
    console.error('❌ [GET /cart] Erro ao obter carrinho:', error);
    res.status(500).json({ message: 'Erro ao obter carrinho', error: error.message });
  }
});

// Adicionar item ao carrinho
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { productId, name, image, price, selectedSize, quantity, customization } = req.body;

    console.log('➕ [POST /cart/add] Adicionando item:', { productId, name, selectedSize, quantity });

    // Validação básica
    if (!productId || !name || !image || !price || !selectedSize || !quantity) {
      return res.status(400).json({ message: 'Dados incompletos' });
    }

    let cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      console.log('📦 [POST /cart/add] Criando novo carrinho...');
      cart = new Cart({ userId: req.user.id, items: [] });
    }

    // Verificar se o produto já existe no carrinho (mesmo tamanho e mesma personalização)
    const existingItemIndex = cart.items.findIndex(
      item => {
        const sameProduct = item.productId.toString() === productId;
        const sameSize = item.selectedSize === selectedSize;

        // Comparação profunda simples para personalização
        const itemCust = item.customization ? {
          name: item.customization.name,
          number: item.customization.number,
          hasBadge: item.customization.hasBadge
        } : {};

        const reqCust = customization ? {
          name: customization.name,
          number: customization.number,
          hasBadge: customization.hasBadge
        } : {};

        const sameCustomization = JSON.stringify(itemCust) === JSON.stringify(reqCust);

        return sameProduct && sameSize && sameCustomization;
      }
    );

    if (existingItemIndex > -1) {
      // Atualiza quantidade
      cart.items[existingItemIndex].quantity += quantity;
      console.log('🔄 [POST /cart/add] Quantidade atualizada para item existente');
    } else {
      // Adiciona novo item
      cart.items.push({ productId, name, image, price, selectedSize, quantity, customization });
      console.log('✅ [POST /cart/add] Novo item adicionado ao carrinho');
    }

    cart.updatedAt = Date.now();
    await cart.save();

    console.log('✅ [POST /cart/add] Carrinho guardado com sucesso. Total de itens:', cart.items.length);
    res.json(cart);
  } catch (error) {
    console.error('❌ [POST /cart/add] Erro ao adicionar ao carrinho:', error);
    res.status(500).json({ message: 'Erro ao adicionar ao carrinho', error: error.message });
  }
});

// Atualizar quantidade de um item
router.put('/update/:itemId', authMiddleware, async (req, res) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;

    console.log('🔄 [PUT /cart/update] Atualizando item:', itemId, 'para quantidade:', quantity);

    if (!quantity || quantity < 1 || quantity > 10) {
      return res.status(400).json({ message: 'Quantidade inválida' });
    }

    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: 'Carrinho não encontrado' });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item não encontrado' });
    }

    item.quantity = quantity;
    cart.updatedAt = Date.now();
    await cart.save();

    console.log('✅ [PUT /cart/update] Quantidade atualizada com sucesso');
    res.json(cart);
  } catch (error) {
    console.error('❌ [PUT /cart/update] Erro ao atualizar item:', error);
    res.status(500).json({ message: 'Erro ao atualizar item', error: error.message });
  }
});

// Remover item do carrinho
router.delete('/remove/:itemId', authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.params;

    console.log('🗑️ [DELETE /cart/remove] Removendo item:', itemId);

    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: 'Carrinho não encontrado' });
    }

    const itemsBefore = cart.items.length;
    cart.items = cart.items.filter(item => item._id.toString() !== itemId);

    if (cart.items.length === itemsBefore) {
      console.warn('⚠️ [DELETE /cart/remove] Item não encontrado no backend (já removido?), retornando carrinho atualizado.');
      // Não retorna 404, retorna o carrinho atual para o frontend sincronizar
    } else {
      cart.updatedAt = Date.now();
      await cart.save();
      console.log('✅ [DELETE /cart/remove] Item removido com sucesso');
    }

    res.json(cart);
  } catch (error) {
    console.error('❌ [DELETE /cart/remove] Erro ao remover item:', error);
    res.status(500).json({ message: 'Erro ao remover item', error: error.message });
  }
});

// Limpar carrinho
router.delete('/clear', authMiddleware, async (req, res) => {
  try {
    console.log('🧹 [DELETE /cart/clear] Limpando carrinho do utilizador:', req.user.id);

    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: 'Carrinho não encontrado' });
    }

    cart.items = [];
    cart.updatedAt = Date.now();
    await cart.save();

    console.log('✅ [DELETE /cart/clear] Carrinho limpo com sucesso');
    res.json(cart);
  } catch (error) {
    console.error('❌ [DELETE /cart/clear] Erro ao limpar carrinho:', error);
    res.status(500).json({ message: 'Erro ao limpar carrinho', error: error.message });
  }
});

module.exports = router;