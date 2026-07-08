const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema({
  // 🆕 NOVO CAMPO: Título da promoção para exibição fácil
  title: { type: String, required: true }, 

  code: { type: String, required: true, unique: true },
  discount: { type: Number, required: true }, // % de desconto
  description: String,
  validUntil: Date,

  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],

  categories: [
    { 
      type: String,
      enum: [
        "Todas as Categorias",
        "Camisas de Equipas",
        "Camisas de Seleções",
        "Camisas Retrô",
        "Destaques",
        "Top Vendidos"
      ]
    }
  ],

  active: { type: Boolean, default: true },
  
  // Desconto Automático / Destaque na Home
  isDailyDeal: { type: Boolean, default: false },
  
  // 🚀 NOVOS CAMPOS PARA SEGMENTAÇÃO E REGRAS DE CARRINHO:

  // 1. Regra de Novo Cliente
  isNewUserCoupon: { type: Boolean, default: false },

  // 2. Regra de Valor Mínimo para Ativação (para cupons e BOGO)
  minOrderValue: { type: Number, default: 0 }, 
  
  // 3. Regra de Recompensa Futura (Para o cenário "Desconto na Próxima Compra")
  // Quando ativado, este cupom só pode ser usado se for gerado por um pedido anterior.
  isFutureReward: { type: Boolean, default: false },

  // 4. BOGO (Buy One Get One) - Promoções de Múltiplos Itens (Avançado)
  isBOGO: { type: Boolean, default: false },
  bogoThreshold: { type: Number, default: 0 }, // Ex: Comprar 2
  bogoDiscountPercent: { type: Number, default: 100 }, // Desconto no item grátis
  
  // 5. Limitação de Uso (Opcional, mas profissional)
  maxUsesPerUser: { type: Number, default: 1000 }, // Quantas vezes um usuário pode usar o cupom

}, { timestamps: true });

module.exports = mongoose.model("Promotion", promotionSchema);