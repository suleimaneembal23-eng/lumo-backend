const Promotion = require("../models/Promotion");
const Product = require("../models/Product");

// Obter todas promoções ativas
exports.getPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find({ active: true });
    res.json(promotions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao buscar promoções" });
  }
};

// Validar um cupom
exports.validateCoupon = async (req, res) => {
  const { code, productId } = req.body;

  if (!code) return res.status(400).json({ message: "Cupom não fornecido" });

  try {
    const promo = await Promotion.findOne({ code: code.toUpperCase(), active: true });

    if (!promo) return res.status(404).json({ message: "Cupom inválido" });

    // Verifica validade da data
    if (promo.validUntil && new Date(promo.validUntil) < new Date()) {
      return res.status(400).json({ message: "Cupom expirado" });
    }

    // Verifica se o cupom se aplica ao produto ou categoria
    if (productId) {
      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ message: "Produto não encontrado" });

      const appliesToProduct =
        promo.products.includes(product._id) ||
        (product.category && product.category.some(cat => promo.categories.includes(cat))) ||
        promo.categories.includes("Todas as Categorias");

      if (!appliesToProduct) {
        return res.status(400).json({ message: "Cupom não se aplica a este produto" });
      }
    }

    res.json({ code: promo.code, discount: promo.discount, description: promo.description });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao validar cupom" });
  }
};
