// models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    // == CAMPOS PRINCIPAIS ==
    name: { type: String, required: true, trim: true },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    shopName: { type: String },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    size: { type: [String], default: [] },
    image: { type: String }, // URL da Imagem Principal
    category: { 
        type: [String],
        enum: [
            "Todas as Categorias",
            "Camisas de Equipas",
            "Camisas de Seleções",
            "Camisas Retrô",
            "Destaques",
            "Top Vendidos",
            "Vapes & Cigarros Eletrônicos",
            "Calçado",
            "Bonés & Chapéus",
            "NBA",
            "Mochilas & Bolsas",
            "Fones de Ouvido",
            "Treino & Academia",
            "Gadgets",
            "Crianças",
            "Streetwear",
            "Acessórios",
            "Casual",
            "Edição Limitada",
            "Novidades",
            "Calções & Shorts"
        ],
        default: ["Todas as Categorias"],
        required: true,
    },
    // == DETALHES, PREÇO E STATUS ==
    originalPrice: { type: Number, min: 0, default: null },
    rating: { type: Number, min: 0, max: 5, default: 5 },
    inStock: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    technicalDetails: { type: String, trim: true },
    deliveryTime: { type: String, trim: true },
    returnTime: { type: String, trim: true },
    gallery: { type: [String], default: [] }, // URLs da Galeria
    isNew: { type: Boolean, default: false },
    onSale: { type: Boolean, default: false },
    isLimited: { type: Boolean, default: false },
    
    // 🚨 NOVO CAMPO: Contagem de Vendas/Popularidade
    salesCount: { 
        type: Number, 
        default: 0, 
        min: 0 
    },

}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);