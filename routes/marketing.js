const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const Promotion = require("../models/Promotion");
const Product = require("../models/Product");
const Order = require("../models/Order");
const mongoose = require("mongoose");

// -------------------------------------------------------------
// PROMOTIONS CRUD
// -------------------------------------------------------------

// LISTAR TODAS AS PROMOÇÕES
router.get("/promotions", async (req, res) => {
    try {
        const promotions = await Promotion.find().sort({ createdAt: -1 });
        res.json(promotions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// CRIAR NOVA PROMOÇÃO (Protegido: Admin)
router.post("/promotions", verifyToken(["admin"]), async (req, res) => {
    // Verificação de role já feita pelo middleware

    const {
        title, code, discount, description, validUntil, products, categories,
        active, isDailyDeal, isNewUserCoupon, minOrderValue
    } = req.body;

    try {
        const newPromo = new Promotion({
            title,
            code: code.toUpperCase(),
            discount,
            description,
            validUntil,
            products,
            categories,
            active: active !== undefined ? active : true,
            isDailyDeal: isDailyDeal || false,
            isNewUserCoupon: isNewUserCoupon || false,
            minOrderValue: minOrderValue || 0
        });

        const savedPromo = await newPromo.save();
        res.status(201).json(savedPromo);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// ATUALIZAR PROMOÇÃO (Protegido: Admin)
router.put("/promotions/:id", verifyToken(["admin"]), async (req, res) => {
    // Verificação de role já feita pelo middleware

    try {
        const updatedPromo = await Promotion.findByIdAndUpdate(
            req.params.id,
            { ...req.body, code: req.body.code ? req.body.code.toUpperCase() : undefined },
            { new: true }
        );
        res.json(updatedPromo);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// REMOVER PROMOÇÃO (Protegido: Admin)
router.delete("/promotions/:id", verifyToken(["admin"]), async (req, res) => {
    // Verificação de role já feita pelo middleware

    try {
        await Promotion.findByIdAndDelete(req.params.id);
        res.json({ message: "Promoção removida" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// OBTER PRODUTOS DE UMA PROMOÇÃO (Para ProductDetail.jsx)
router.get("/promotions/:code/products", async (req, res) => {
    try {
        const promo = await Promotion.findOne({ code: req.params.code.toUpperCase(), active: true });
        if (!promo) return res.status(404).json({ message: "Cupom inválido ou expirado" });

        // Se tiver validade e expirou
        if (promo.validUntil && new Date(promo.validUntil) < new Date()) {
            return res.status(400).json({ message: "Cupom expirado" });
        }

        // Encontrar produtos que se aplicam
        let query = {};

        // Se for "Todas as Categorias"
        if (promo.categories.includes("Todas as Categorias")) {
            // query permanece vazia (todos os produtos)
        } else {
            // Filtra por produtos específicos OU categorias específicas
            query = {
                $or: [
                    { _id: { $in: promo.products } },
                    { category: { $in: promo.categories } }
                ]
            };
        }

        const products = await Product.find(query);

        // Retorna os produtos com o preço descontado calculado
        const productsWithDiscount = products.map(p => {
            const discountAmount = (p.price * promo.discount) / 100;
            return {
                ...p._doc,
                discountedPrice: parseFloat((p.price - discountAmount).toFixed(2)),
                discountPercent: promo.discount
            };
        });

        res.json(productsWithDiscount);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// -------------------------------------------------------------
// VALIDAÇÃO DE CUPOM (Para Checkout)
// -------------------------------------------------------------
router.post("/promotions/validate-coupon", async (req, res) => {
    try {
        const { code, productId, userId, cartValue } = req.body;

        if (!code) return res.status(400).json({ message: "Código do cupom não fornecido" });
        // if (!userId) return res.status(401).json({ message: "É necessário estar logado para validar um cupom." }); // Opcional dependendo da regra de negócio

        const promo = await Promotion.findOne({ code: code.toUpperCase(), active: true });

        if (!promo) return res.status(404).json({ message: "Cupom inválido" });

        // 1. VERIFICAÇÃO: OFERTA AUTOMÁTICA (Daily Deal)
        if (promo.isDailyDeal) {
            return res.status(400).json({ message: "Esta é uma oferta automática e não requer cupom. O desconto já foi aplicado." });
        }

        // 2. VERIFICAÇÃO: Validade da data
        if (promo.validUntil && new Date(promo.validUntil) < new Date()) {
            return res.status(400).json({ message: "Cupom expirado" });
        }

        // 3. VERIFICAÇÃO: CUPOM DE NOVO CLIENTE
        if (promo.isNewUserCoupon && userId) {
            const hasPreviousOrders = await Order.exists({
                userId: new mongoose.Types.ObjectId(userId),
                status: { $in: ["paid", "shipped", "delivered"] }
            });

            if (hasPreviousOrders) {
                return res.status(400).json({ message: "Cupom válido apenas para clientes de primeira viagem." });
            }
        }

        // 4. VERIFICAÇÃO: VALOR MÍNIMO DE COMPRA
        if (promo.minOrderValue && cartValue && cartValue < promo.minOrderValue) {
            return res.status(400).json({
                message: `Requer um valor mínimo de compra de ${promo.minOrderValue} para ser aplicado.`
            });
        }

        // 5. VERIFICAÇÃO: Aplica-se ao produto (se productId for fornecido)
        if (productId) {
            const product = await Product.findById(productId);
            if (!product) return res.status(404).json({ message: "Produto não encontrado" });

            const productCategories = Array.isArray(product.category) ? product.category : (product.category ? [product.category] : []);

            const appliesToProduct =
                promo.products.some(p => p.equals(product._id)) ||
                (productCategories.some(cat => promo.categories.includes(cat))) ||
                promo.categories.includes("Todas as Categorias");

            if (!appliesToProduct) {
                return res.status(400).json({ message: "Cupom não se aplica a este produto" });
            }
        }

        res.json({
            code: promo.code,
            discount: promo.discount,
            description: promo.description,
            isNewUserCoupon: promo.isNewUserCoupon,
            minOrderValue: promo.minOrderValue
        });

    } catch (err) {
        console.error("ERRO AO VALIDAR CUPOM:", err);
        res.status(500).json({ message: "Erro interno ao validar cupom." });
    }
});

module.exports = router;