const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const Promotion = require("../models/Promotion");
const Product = require("../models/Product");
const Order = require("../models/Order");
const emailService = require("../services/emailService");
const User = require("../models/User");
const Subscriber = require("../models/Subscriber");
const Cart = require("../models/Cart");

// ... (Existing imports)

// -------------------------------------------------------------
// ABANDONED CART RECOVERY (Admin Trigger)
// -------------------------------------------------------------

// -------------------------------------------------------------
// INSCRIÇÃO NA NEWSLETTER (Public)
// -------------------------------------------------------------
router.post("/subscribe", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email é obrigatório." });
        }

        const existingSubscriber = await Subscriber.findOne({ email });

        if (existingSubscriber) {
            if (!existingSubscriber.isActive) {
                existingSubscriber.isActive = true;
                await existingSubscriber.save();
                return res.json({ message: "Sua inscrição foi reativada com sucesso!" });
            }
            return res.status(400).json({ message: "Este email já está inscrito." });
        }

        const newSubscriber = new Subscriber({ email });
        await newSubscriber.save();

        res.status(201).json({ message: "Inscrição realizada com sucesso! Obrigado." });

    } catch (error) {
        console.error("Erro na inscrição da newsletter:", error);
        res.status(500).json({ message: "Erro ao processar inscrição." });
    }
});
router.post("/abandoned-carts/trigger", verifyToken(["admin"]), async (req, res) => {
    try {
        console.log("🕵️ Iniciando verificação de carrinhos abandonados...");

        // Regra: Carrinhos atualizados há mais de 30 minutos (demo)
        const timeThreshold = new Date(Date.now() - 30 * 60 * 1000);

        const abandonedCarts = await Cart.find({
            updatedAt: { $lt: timeThreshold },
            abandonedEmailSent: { $ne: true },
            "items.0": { $exists: true }
        }).populate("userId", "email name");

        console.log(`🔎 Encontrados ${abandonedCarts.length} carrinhos abandonados.`);

        let processedCount = 0;

        for (const cart of abandonedCarts) {
            if (cart.userId && cart.userId.email) {
                const checkoutUrl = `${process.env.STORE_URL || 'http://localhost:3000'}/cart`;
                await emailService.sendAbandonedCartEmail(cart.userId.email, cart.items, checkoutUrl);

                cart.abandonedEmailSent = true;
                await cart.save();
                processedCount++;
            }
        }

        res.json({ message: `Processamento concluído. ${processedCount} emails enviados.` });

    } catch (error) {
        console.error("Erro no trigger de carrinho abandonado:", error);
        res.status(500).json({ message: "Erro ao processar.", error: error.message });
    }
});

// -------------------------------------------------------------
// DISPARO DE EMAILS DE MARKETING (Mass Email)
// -------------------------------------------------------------
router.post("/send-email", verifyToken(["admin"]), async (req, res) => {
    try {
        const { subject, content, actionText, actionUrl, segment } = req.body;

        if (!subject || !content) {
            return res.status(400).json({ message: "Assunto e conteúdo são obrigatórios." });
        }

        // Filtro de usuários (pode ser expandido no futuro)
        let query = {};
        if (segment === "all_users") {
            query = {}; // Todos
        } else if (segment === "buyers") {
            // Exemplo: Buscar users que já compraram (implementação futura complexa, simplificando para todos por agora ou vazio)
            // query = { hasOrders: true }; 
        }

        const users = await User.find(query, "email name");
        const validUsers = users.filter(u => u.email && u.email.includes("@")); // Filtro básico

        console.log(`🚀 Iniciando disparo de marketing para ${validUsers.length} usuários...`);

        // Envia em "background" para não travar a resposta HTTP
        validUsers.forEach((user, index) => {
            setTimeout(async () => {
                await emailService.sendMarketingEmail(
                    user.email,
                    subject,
                    content.replace("{{name}}", user.name || "Cliente"), // Suporte básico a variáveis
                    actionUrl,
                    actionText
                );
            }, index * 500); // Delay de 500ms entre envios para evitar flood
        });

        res.json({ message: `Disparo iniciado para ${validUsers.length} usuários.` });

    } catch (err) {
        console.error("Erro no disparo de marketing:", err);
        res.status(500).json({ message: "Erro ao processar envio." });
    }
});

module.exports = router;

// LISTAR TODAS AS PROMOÇÕES
router.get("/promotions", async (req, res) => {
    try {
        const promotions = await Promotion.find().sort({ createdAt: -1 });
        res.json(promotions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// -------------------------------------------------------------
// AS ROTAS ESPECÍFICAS (/vendor) DEVEM FICAR ACIMA DA ROTA GENÉRICA (/:id)
// -------------------------------------------------------------

// LISTAR TODAS AS PROMOÇÕES DO VENDEDOR
router.get("/promotions/vendor", verifyToken(["vendor"]), async (req, res) => {
    try {
        const promotions = await Promotion.find({ vendorId: req.user.id }).sort({ createdAt: -1 });
        res.json(promotions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// CRIAR NOVA PROMOÇÃO (Protegido: Vendor)
router.post("/promotions/vendor", verifyToken(["vendor"]), async (req, res) => {
    const { title, code, discount, description, validUntil, products, categories, active, isDailyDeal, isNewUserCoupon, minOrderValue } = req.body;
    try {
        const isGlobal = categories && categories.includes("Todas as Categorias");

        if (active !== false && isGlobal) {
            await Promotion.updateMany(
                { isDailyDeal: true, active: true, vendorId: req.user.id },
                { $set: { active: false } }
            );
        }

        const newPromo = new Promotion({
            title,
            code: code.toUpperCase(),
            discount,
            description,
            validUntil,
            products,
            categories,
            active: active !== undefined ? active : true,
            isDailyDeal: Boolean(isDailyDeal),
            isNewUserCoupon: Boolean(isNewUserCoupon),
            minOrderValue: minOrderValue || 0,
            vendorId: req.user.id
        });

        const savedPromo = await newPromo.save();
        res.status(201).json(savedPromo);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// ATUALIZAR PROMOÇÃO (Protegido: Vendor)
router.put("/promotions/vendor/:id", verifyToken(["vendor"]), async (req, res) => {
    try {
        const { isDailyDeal, categories, active } = req.body;
        const isGlobal = categories && categories.includes("Todas as Categorias");

        if (active !== false && isGlobal) {
            await Promotion.updateMany(
                { isDailyDeal: true, active: true, _id: { $ne: req.params.id }, vendorId: req.user.id },
                { $set: { active: false } }
            );
        }

        const updatedPromo = await Promotion.findOneAndUpdate(
            { _id: req.params.id, vendorId: req.user.id },
            {
                ...req.body,
                code: req.body.code ? req.body.code.toUpperCase() : undefined,
                isDailyDeal: req.body.isDailyDeal !== undefined ? Boolean(req.body.isDailyDeal) : undefined,
                isNewUserCoupon: req.body.isNewUserCoupon !== undefined ? Boolean(req.body.isNewUserCoupon) : undefined,
                active: req.body.active !== undefined ? req.body.active : undefined
            },
            { new: true, runValidators: true }
        );
        res.json(updatedPromo);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// REMOVER PROMOÇÃO (Protegido: Vendor)
router.delete("/promotions/vendor/:id", verifyToken(["vendor"]), async (req, res) => {
    try {
        await Promotion.findOneAndDelete({ _id: req.params.id, vendorId: req.user.id });
        res.json({ message: "Promoção removida" });
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
        // LÓGICA DE EXCLUSIVIDADE: Oferta do Dia vs Promoção Global
        // "Se ativar uma, desativa a outra para não quebrar o layout/lógica"
        const isGlobal = categories && categories.includes("Todas as Categorias");

        if (active !== false) { // Se estiver ativando
            if (isGlobal) {
                // Se for Promoção Global, desativa Oferta do Dia
                await Promotion.updateMany(
                    { isDailyDeal: true, active: true },
                    { $set: { active: false } }
                );
            }
            // "oferta do dia nao pode desativar promo global" -> Removida a lógica inversa
        }

        const newPromo = new Promotion({
            title,
            code: code.toUpperCase(),
            discount,
            description,
            validUntil,
            products,
            categories,
            active: active !== undefined ? active : true,
            isDailyDeal: Boolean(isDailyDeal),
            isNewUserCoupon: Boolean(isNewUserCoupon),
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
        const { isDailyDeal, categories, active } = req.body;

        // LÓGICA DE EXCLUSIVIDADE (Mesma do POST)
        const isGlobal = categories && categories.includes("Todas as Categorias");

        // Só aplica se active for explicitamente true ou undefined (assumed true se não enviado? Não, update partial... cuidado)
        // No PUT, active pode vir undefined se não alteramos.
        // Mas se alteramos isDailyDeal para true, assume-se que queremos ativar a exclusividade se ela estiver ativa.

        // Precisamos saber se a promo JÁ está ativa se active for undefined?
        // Simplificação: Se enviou isDailyDeal=true, desativa globais. Se enviou global, desativa daily.

        if (active !== false) {
            if (isGlobal) {
                await Promotion.updateMany(
                    { isDailyDeal: true, active: true, _id: { $ne: req.params.id } },
                    { $set: { active: false } }
                );
            }
            // "oferta do dia nao pode desativar promo global" -> Removida a lógica inversa
        }

        const updatedPromo = await Promotion.findByIdAndUpdate(
            req.params.id,
            {
                ...req.body,
                code: req.body.code ? req.body.code.toUpperCase() : undefined,
                isDailyDeal: req.body.isDailyDeal !== undefined ? Boolean(req.body.isDailyDeal) : undefined,
                isNewUserCoupon: req.body.isNewUserCoupon !== undefined ? Boolean(req.body.isNewUserCoupon) : undefined,
                active: req.body.active !== undefined ? req.body.active : undefined
            },
            { new: true, runValidators: true }
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

        // 🏪 FILTRO VENDOR: Se for promo de um Vendor, aplica SÓ aos seus produtos!
        if (promo.vendorId) {
            query.vendor = promo.vendorId;
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

            const vendorMatch = !promo.vendorId || promo.vendorId.toString() === product.vendor?.toString();

            if (!appliesToProduct || !vendorMatch) {
                return res.status(400).json({ message: "Cupom não se aplica a este produto (restrição de loja/categoria)." });
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