const Product = require("../models/Product");

// 🟢 Criar um novo produto
exports.createProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            size,
            image,
            category,
            originalPrice,
            rating,
            inStock,
            featured,
            technicalDetails,
            deliveryTime,
            returnTime,
            gallery,
            isNew,
            onSale,
            isLimited,
            // 🚨 NOVO: Incluir salesCount no body, embora geralmente seja 0 na criação
            salesCount, 
        } = req.body;

        if (!name || !price || !category) {
            return res
                .status(400)
                .json({ message: "Nome, preço e categoria são obrigatórios." });
        }

        const newProduct = new Product({
            name,
            description,
            price,
            size,
            image,
            category,
            originalPrice,
            rating,
            inStock,
            featured,
            technicalDetails,
            deliveryTime,
            returnTime,
            gallery,
            isNew,
            onSale,
            isLimited,
            salesCount, // Adicionando o novo campo
        });

        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        console.error("❌ Erro ao criar produto:", error);
        res
            .status(500)
            .json({ message: "Erro ao criar produto", error: error.message });
    }
};

// 🟡 Atualizar produto existente
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "ID inválido do produto." });
        }

        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ message: "Produto não encontrado." });

        Object.keys(req.body).forEach((key) => {
            product[key] = req.body[key];
        });

        const updatedProduct = await product.save();
        res.status(200).json(updatedProduct);
    } catch (error) {
        console.error("❌ Erro ao atualizar produto:", error);
        res.status(500).json({ message: "Erro ao atualizar produto", error: error.message });
    }
};

// 🟢 Listar categorias únicas
exports.getCategories = async (req, res) => {
    try {
        const categories = await Product.distinct("category");
        res.json(categories);
    } catch (error) {
        console.error("❌ Erro ao buscar categorias:", error);
        res.status(500).json({ message: "Erro ao buscar categorias", error: error.message });
    }
};

// 🟢 Listar todos os produtos (com vendor populado para o painel admin)
exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find()
            .populate('shopId', 'name email vendorInfo');
        res.json(products);
    } catch (error) {
        console.error("❌ Erro ao buscar produtos:", error);
        res.status(500).json({ message: "Erro ao buscar produtos", error: error.message });
    }
};

// 🟢 Listar produto por ID
exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "ID inválido do produto." });
        }
        const product = await Product.findById(id).populate('shopId', 'name email vendorInfo');
        if (!product) return res.status(404).json({ message: "Produto não encontrado." });
        res.json(product);
    } catch (error) {
        console.error("❌ Erro ao buscar produto:", error);
        res.status(500).json({ message: "Erro ao buscar produto", error: error.message });
    }
};

// 🟢 Listar produtos por categoria
exports.getProductsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        // Procura produtos onde o array 'category' inclui a categoria passada
        const products = await Product.find({ category: { $in: [category] } }); 
        res.json(products);
    } catch (error) {
        console.error("❌ Erro ao filtrar produtos:", error);
        res.status(500).json({ message: "Erro ao filtrar produtos", error: error.message });
    }
};

// 🔴 Deletar produto
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "ID inválido do produto." });
        }

        const deleted = await Product.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: "Produto não encontrado." });

        res.json({ message: "Produto deletado com sucesso." });
    } catch (error) {
        console.error("❌ Erro ao deletar produto:", error);
        res.status(500).json({ message: "Erro ao deletar produto", error: error.message });
    }
};

// 🟢 Listar produtos mais populares (Mais Vendidos)
exports.getPopularProducts = async (req, res) => {
    try {
        const popularProducts = await Product.find({ inStock: true }) // Apenas produtos em stock
            .sort({ salesCount: -1 }) // Ordena do maior para o menor 'salesCount'
            .limit(4) // Limita aos 4 mais vendidos
            .select('name price image category salesCount onSale originalPrice isNew inStock')
            .lean(); // Usa lean() para performance, retornando objetos JS simples

        res.json(popularProducts);
    } catch (error) {
        console.error("❌ Erro ao buscar produtos populares:", error);
        res.status(500).json({ message: "Erro ao buscar produtos populares", error: error.message });
    }
};

// 🟢 Listar produtos do vendor logado
exports.getVendorProducts = async (req, res) => {
    try {
        const vendorId = req.userId;
        if (!vendorId) return res.status(401).json({ message: "Não autenticado." });
        const products = await Product.find({ shopId: vendorId });
        res.json(products);
    } catch (error) {
        console.error("❌ Erro ao buscar produtos do vendor:", error);
        res.status(500).json({ message: "Erro ao buscar produtos do vendor", error: error.message });
    }
};

// 🟢 Página pública de uma loja por slug ou ID do vendor
exports.getPublicStore = async (req, res) => {
    try {
        const { slug } = req.params;
        const User = require('../models/User');

        // Procura por slug (ex: loja-alpha) OU por ID
        let vendor = await User.findOne({ 'vendorInfo.slug': slug, role: 'vendor' }).select('-password');
        if (!vendor) {
            // fallback: procurar pelo storeName normalizado
            const all = await User.find({ role: 'vendor' }).select('-password');
            vendor = all.find(u => u.vendorInfo && u.vendorInfo.storeName &&
                u.vendorInfo.storeName.toLowerCase().replace(/\s+/g, '-') === slug.toLowerCase());
        }

        if (!vendor) return res.status(404).json({ message: "Loja não encontrada." });

        const products = await Product.find({ shopId: vendor._id, inStock: true });

        return res.json({
            vendor: {
                _id: vendor._id,
                name: vendor.vendorInfo?.storeName || vendor.name,
                description: vendor.vendorInfo?.storeDescription || '',
                logo: vendor.vendorInfo?.logo || null,
                banner: vendor.vendorInfo?.banner || null,
                plan: vendor.vendorInfo?.subscription?.plan || 'Free'
            },
            products
        });
    } catch (error) {
        console.error("❌ Erro ao carregar loja pública:", error);
        res.status(500).json({ message: "Erro ao carregar loja", error: error.message });
    }
};

exports.getRelatedProducts = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the ID is valid
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de produto inválido." });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Produto não encontrado." });
    }

    // Achar produtos da mesma categoria principal, excluindo o produto atual
    let query = { _id: { $ne: id } };
    
    if (product.category && product.category.length > 0) {
        // Usa apenas a primeira categoria (principal) para não misturar produtos
        query.category = product.category[0];
    }

    // Limitar a 4 produtos
    const relatedProducts = await Product.find(query).limit(4);

    res.json(relatedProducts);
  } catch (err) {
    console.error("getRelatedProducts error:", err);
    res.status(500).json({ error: "Erro ao procurar produtos relacionados." });
  }
};