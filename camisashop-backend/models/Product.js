// models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    // == CAMPOS PRINCIPAIS ==
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    size: { type: [String], default: [] },
    image: { type: String }, // URL da Imagem Principal
    category: {
        type: [String], // agora é um array de strings
        // removed enum to allow dynamic categories like "Portugal"
        default: ["Todas as Categorias"], // default é array
        required: true,
    },

    // 🎨 Atributos Dinâmicos (IMPORTANTE PARA VAPE vs ROUPA)
    // Ex: [{ name: "Sabor", options: ["Menta", "Uva"] }, { name: "Voltagem", options: ["110v", "220v"] }]
    attributes: [{
        name: { type: String, required: true }, // Ex: "Tamanho", "Cor", "Sabor"
        options: { type: [String], default: [] } // Ex: ["S", "M"], ["Azul", "Vermelho"]
    }],
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

    salesCount: {
        type: Number,
        default: 0,
        min: 0
    },

    stockQuantity: {
        type: Number,
        default: 0,
        min: 0
    },

    lowStockThreshold: {
        type: Number,
        default: 10, // Alerta quando stock cair abaixo de 10
        min: 0
    },

    // 🏪 Reference to the Vendor (User)
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        // required: true, // TODO: Decide if strictly required or nullable for main admin
        default: null
    },

    // 👮‍♂️ Controle do Admin
    adminNotes: { type: String, trim: true }, // Ex: "Melhore a qualidade da foto"
    isBlocked: { type: Boolean, default: false } // Admin pode bloquear produto Premium

}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);