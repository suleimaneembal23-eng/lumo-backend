// models/DailyDeal.js
const mongoose = require('mongoose');

const dailyDealSchema = new mongoose.Schema({
    // Referência ao Produto que está em oferta
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Assumindo que seu modelo de produto se chama 'Product'
        required: true,
    },
    // Percentagem de desconto aplicada
    discountPercent: {
        type: Number,
        required: true,
        min: 1,
        max: 100
    },
    // Data/hora de expiração da oferta
    validUntil: {
        type: Date,
        required: true,
    },
    // Para garantir que apenas uma Oferta do Dia esteja ativa,
    // ou simplesmente para ativar/desativar manualmente
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Índice para garantir que não haja duas ofertas ativas ao mesmo tempo (Opcional, mas útil)
dailyDealSchema.index({ validUntil: 1 }, { expireAfterSeconds: 0 }); 

module.exports = mongoose.model('DailyDeal', dailyDealSchema);