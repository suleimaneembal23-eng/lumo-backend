const express = require('express');
const router = express.Router();
const {
    createProduct,
    getAllProducts,
    updateProduct,
    deleteProduct,
    getProductById,
    getProductsByCategory,
    getPopularProducts,
    getCategories,
    getVendorProducts,
    getPublicStore,
    getRelatedProducts,
} = require('../controllers/productController');

const verifyToken = require('../middleware/verifyToken');

// -----------------------------------------------------------------
// 📦 Rotas Públicas de Busca (GET)
// -----------------------------------------------------------------

// Rota para obter os 4 produtos mais vendidos/populares
router.get("/popular", getPopularProducts); 

// Rota para obter página pública de uma loja por slug
router.get("/store/:slug", getPublicStore);

// Rota para obter produtos por categoria
router.get("/category/:category", getProductsByCategory); 

// Rota para obter todas as categorias
router.get("/categories", getCategories);

// -----------------------------------------------------------------
// 🔐 Rotas Protegidas — Vendor
// -----------------------------------------------------------------

// Vendor logado → listar os SEUS produtos
router.get("/vendor", verifyToken(["vendor", "admin"]), getVendorProducts);

// Vendor logado → criar produto na sua loja
router.post("/vendor", verifyToken(["vendor", "admin"]), async (req, res) => {
    const Product = require('../models/Product');
    const User = require('../models/User');
    try {
        const vendor = await User.findById(req.userId);
        if (!vendor) return res.status(404).json({ message: "Vendor não encontrado." });

        const product = new Product({
            ...req.body,
            shopId: vendor._id,
            shopName: vendor.vendorInfo?.storeName || vendor.name,
        });
        const saved = await product.save();
        res.status(201).json(saved);
    } catch (err) {
        console.error("Erro ao criar produto (vendor):", err);
        res.status(500).json({ message: "Erro ao criar produto", error: err.message });
    }
});

// -----------------------------------------------------------------
// 🔒 Rotas Protegidas — Admin
// -----------------------------------------------------------------

// Rota para obter um produto por ID (público + admin)
router.get("/:id", getProductById);

// Rota para obter todos os produtos
router.get("/", getAllProducts);

// Rota para criar um novo produto (admin)
router.post("/", verifyToken(["admin"]), createProduct);

// Rota para atualizar um produto existente
router.put("/:id", verifyToken(["admin", "vendor"]), updateProduct);

// Rota para apagar um produto
router.delete("/:id", verifyToken(["admin", "vendor"]), deleteProduct);


module.exports = router;