const express = require('express');
const router = express.Router();
const {
    createProduct,
    getAllProducts,
    updateProduct,
    deleteProduct,
    getProductById,
    getProductsByCategory,
    // 🚨 ASSUMINDO que esta nova função será criada no Controller
    getPopularProducts,
    getRelatedProducts,
    getVendorProducts, // 🏪
    getProductsByVendorSlug, // 🏪
    getAllCategories, // 📦 Catálogos
} = require('../controllers/productController');

const verifyToken = require('../middleware/verifyToken');

// -----------------------------------------------------------------
// 🔒 Rotas Protegidas (somente admin logado) - IMPORTANTE: Definir antes de :id
// -----------------------------------------------------------------

// 🏪 Rota para listar produtos do vendedor (Dashboard)
router.get("/vendor", verifyToken(["vendor"]), getVendorProducts);

// -----------------------------------------------------------------
// 📦 Rotas Públicas de Busca (GET)
// -----------------------------------------------------------------

// Rota para obter os 4 produtos mais vendidos/populares (para o Grid de Destaque)
router.get("/popular", getPopularProducts);

// 🏪 Rota para a Loja do Vendedor (Shop-in-Shop)
router.get("/store/:slug", getProductsByVendorSlug);

// Rota para obter produtos por categoria
// DEVE vir antes do /:id para o Express não confundir a categoria com um ID
router.get("/category/:category", getProductsByCategory);

// Rota para obter todas as categorias únicas (Catálogos)
router.get("/categories", getAllCategories);

// Rota para obter produtos relacionados (mesma categoria)
router.get("/:id/related", getRelatedProducts);

// Rota para obter um produto por ID
router.get("/:id", getProductById);

// Rota para obter todos os produtos
router.get("/", getAllProducts);




// -----------------------------------------------------------------
// 🔒 Rotas Protegidas (somente admin logado)
// -----------------------------------------------------------------

// Rota para criar um novo produto (Admin ou Vendor)
router.post("/", verifyToken(["admin", "vendor"]), createProduct);

// Rota para atualizar um produto existente (Admin ou Vendor)
router.put("/:id", verifyToken(["admin", "vendor"]), updateProduct);

// Rota para apagar um produto (Admin ou Vendor)
router.delete("/:id", verifyToken(["admin", "vendor"]), deleteProduct);


module.exports = router;