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
            salesCount,
            // 🎨 Atributos Dinâmicos
            attributes,
        } = req.body;

        if (!name || !price || !category) {
            return res
                .status(400)
                .json({ message: "Nome, preço e categoria são obrigatórios." });
        }

        // 🏪 Logica de Vendedor
        let vendorId = req.body.vendor || null;

        // Se quem está criando é um VENDOR, força o ID dele
        if (req.user && req.user.role === 'vendor') {
            vendorId = req.userId;
            console.log(`🏪 [createProduct] Vendedor criando produto. ID forçado: ${vendorId}`);
        } else {
            console.log(`👑 [createProduct] Admin criando produto. Vendor definido no body: ${vendorId}`);
        }

        const newProduct = new Product({
            name,
            description,
            price: Math.round(Number(price)),
            size,
            image,
            category,
            originalPrice: originalPrice ? Math.round(Number(originalPrice)) : undefined,
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
            salesCount,
            attributes,
            vendor: vendorId,
        });

        const savedProduct = await newProduct.save();
        console.log(`✅ [createProduct] Produto salvo! ID: ${savedProduct._id} | Vendor: ${savedProduct.vendor}`);
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

        // 🚨 PREVENÇÃO DE ERRO: Filtra campos imutáveis
        const { _id, createdAt, updatedAt, __v, ...updateData } = req.body;

        const userId = req.userId;
        const userRole = req.user.role;

        // SE ADMIN: Bloquear se Vendedor for PREMIUM
        const existingProduct = await Product.findById(id).populate('vendor');
        if (!existingProduct) return res.status(404).json({ message: "Produto não encontrado." });
        if (userRole === 'admin' && existingProduct.vendor && existingProduct.vendor.vendorInfo?.subscription?.isActive) {
            return res.status(403).json({ message: "Acesso negado: Apenas o Vendedor Premium pode editar este produto." });
        }

        // 🔒 Vendor só pode editar seus produtos
        const query = { _id: id };
        if (userRole === 'vendor') {
            query.vendor = userId;
        }

        // 💰 Arredondar preços — FCFA não tem cêntimos
        if (updateData.price !== undefined) updateData.price = Math.round(Number(updateData.price));
        if (updateData.originalPrice !== undefined && updateData.originalPrice !== null) {
            updateData.originalPrice = Math.round(Number(updateData.originalPrice));
        }

        const updatedProduct = await Product.findOneAndUpdate(
            query,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedProduct) return res.status(404).json({ message: "Produto não encontrado." });

        res.status(200).json(updatedProduct);
    } catch (error) {
        const fs = require('fs');
        const logData = `\n[${new Date().toISOString()}] Error updating product ${req.params.id}:\nRequest Body: ${JSON.stringify(req.body, null, 2)}\nError: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}\n--------------------------\n`;
        fs.appendFileSync('backend_errors.log', logData);

        console.error("❌ Erro ao atualizar produto:", error);
        // Retorna 400 se for erro de validação (Schema) ou CastError
        if (error.name === 'ValidationError' || error.name === 'CastError') {
            return res.status(400).json({ message: "Erro de validação: " + error.message, error: error.message });
        }
        res.status(500).json({ message: "Erro ao atualizar produto", error: error.message });
    }
};

// 🟢 Listar todos os produtos
exports.getAllProducts = async (req, res) => {
    try {
        const { search } = req.query;
        let query = { isBlocked: { $ne: true } }; // Não mostra produtos bloqueados

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { category: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        const products = await Product.find(query).populate('vendor', 'name email vendorInfo role');
        console.log(`📦 [getAllProducts] Retornando ${products.length} produtos.`);
        res.json(products);
    } catch (error) {
        console.error("❌ Erro ao buscar produtos:", error);
        res.status(500).json({ message: "Erro ao buscar produtos", error: error.message });
    }
};

// 🟢 Listar todas as categorias únicas (Catálogos)
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Product.distinct("category");
        res.json(categories);
    } catch (error) {
        console.error("❌ Erro ao buscar categorias:", error);
        res.status(500).json({ message: "Erro ao buscar categorias", error: error.message });
    }
};

// 🟢 Listar produto por ID
exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "ID inválido do produto." });
        }
        const product = await Product.findById(id).populate("vendor", "name vendorInfo");
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

        const userId = req.userId;
        const userRole = req.user.role;

        // SE ADMIN: Bloquear se Vendedor for PREMIUM
        const existingProduct = await Product.findById(id).populate('vendor');
        if (!existingProduct) return res.status(404).json({ message: "Produto não encontrado." });
        if (userRole === 'admin' && existingProduct.vendor && existingProduct.vendor.vendorInfo?.subscription?.isActive) {
            return res.status(403).json({ message: "Acesso negado: Apenas o Vendedor Premium pode apagar este produto." });
        }

        // 🔒 Vendor só pode deletar seus produtos
        const query = { _id: id };
        if (userRole === 'vendor') {
            query.vendor = userId;
            console.log(`🗑️ [deleteProduct] Vendor tentando deletar. Query:`, query);
        } else {
            console.log(`👑 [deleteProduct] Admin deletando. ID: ${id}`);
        }

        const deleted = await Product.findOneAndDelete(query);

        if (!deleted) {
            console.warn(`⚠️ [deleteProduct] Produto não encontrado ou sem permissão via query:`, query);
            // Tenta buscar sem o filtro de vendor para saber se o produto existe mas pertence a outro
            const exists = await Product.findById(id);
            if (exists) {
                console.warn(`🛑 [deleteProduct] Produto existe mas pertence a: ${exists.vendor}, e requester é: ${userId}`);
                return res.status(403).json({ message: "Você não tem permissão para apagar este produto." });
            }
            return res.status(404).json({ message: "Produto não encontrado." });
        }

        console.log(`✅ [deleteProduct] Produto deletado com sucesso.`);
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

// 🟢 Listar produtos relacionados (mesma categoria)
exports.getRelatedProducts = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "ID inválido do produto." });
        }

        // Buscar o produto atual para pegar sua categoria
        const currentProduct = await Product.findById(id);
        if (!currentProduct) {
            return res.status(404).json({ message: "Produto não encontrado." });
        }

        // Buscar produtos relacionados (mesma categoria, excluindo o produto atual)
        const relatedProducts = await Product.find({
            _id: { $ne: id }, // Exclui o produto atual
            category: { $in: currentProduct.category }, // Mesma categoria
            inStock: true // Apenas produtos em stock
        })
            .limit(6) // Limita a 6 produtos relacionados
            .select('name price image category onSale originalPrice isNew inStock')
            .lean();

        res.json(relatedProducts);
    } catch (error) {
        console.error("❌ Erro ao buscar produtos relacionados:", error);
        res.status(500).json({ message: "Erro ao buscar produtos relacionados", error: error.message });
    }


}


// 🏪 NOVO: Listar produtos do vendedor logado
exports.getVendorProducts = async (req, res) => {
    try {
        const userId = req.userId;
        console.log(`🔍 [getVendorProducts] Buscando produtos para Vendor ID: ${userId}`);

        const products = await Product.find({ vendor: userId }).sort({ createdAt: -1 });
        console.log(`✅ [getVendorProducts] Encontrados ${products.length} produtos.`);

        res.json(products);
    } catch (error) {
        console.error("❌ Erro ao buscar produtos do vendedor:", error);
        res.status(500).json({ message: "Erro ao buscar produtos do vendedor", error: error.message });
    }
};

// 🏪 NOVO: Listar produtos por Slug da Loja (Público)
exports.getProductsByVendorSlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const User = require("../models/User");

        // 1. Encontrar o vendedor pelo slug
        const vendor = await User.findOne({ "vendorInfo.slug": slug }).select("name vendorInfo");

        if (!vendor) {
            return res.status(404).json({ message: "Loja não encontrada." });
        }

        // 2. Buscar produtos desse vendedor
        const products = await Product.find({ vendor: vendor._id, inStock: true }); // Mostra apenas em estoque?

        res.json({
            vendor: {
                name: vendor.vendorInfo?.storeName || vendor.name,
                description: vendor.vendorInfo?.description,
                banner: vendor.vendorInfo?.banner,
                logo: vendor.vendorInfo?.logo,
            },
            products
        });
    } catch (error) {
        console.error("❌ Erro ao buscar loja:", error);
        res.status(500).json({ message: "Erro ao buscar loja", error: error.message });
    }
}
