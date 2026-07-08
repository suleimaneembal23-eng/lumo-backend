const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, unique: true, sparse: true }, // Novo campo para login
  password: { type: String, required: true },
  // -------------------------------------------------------------
  // 🚀 NOVOS CAMPOS PARA A GESTÃO DE PERFIL E PREFERÊNCIAS
  // -------------------------------------------------------------

  // Role agora suporta 'vendor'
  role: { type: String, enum: ["admin", "client", "vendor"], required: true },

  // Informações da Loja (Apenas para Vendors)
  vendorInfo: {
    storeName: { type: String, trim: true },
    slug: { type: String, unique: true, sparse: true, trim: true }, // URL da loja (ex: /loja/farmacia-central)
    logo: { type: String },
    description: { type: String },
    banner: { type: String }, // Imagem de capa da loja

    // Configurações de Envio da Loja
    shippingSettings: {
      usePlatformShipping: { type: Boolean, default: true }, // Se true, usa as taxas globais
      flatRate: { type: Number, default: 0 }, // Taxa única se não usar global
      freeShippingThreshold: { type: Number, default: 0 }, // Frete grátis local
      deliveryTime: { type: String, default: '5 a 10 dias úteis' }, // Prazo de chegada
      returnPolicy: { type: String, default: '14 dias para devolução' } // Política de devoluções
    },

    // Morada Física para Levantamento na Loja
    pickupAddress: {
      line1: { type: String, trim: true },
      city: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true, default: 'Guiné-Bissau' }
    },

    // 💎 Plano de Assinatura (Lógica Híbrida)
    subscription: {
      isActive: { type: Boolean, default: false }, // Se true = Premium (Sem taxas, Com Dashboard Full)
      planType: { type: String, enum: ['monthly', 'semiannual', 'free'], default: 'free' },
      expiresAt: { type: Date, default: null } // Data de expiração
    }
  },

  // Campo opcional para telefone, usado na aba 'Informações'
  phone: { type: String, default: null },

  // Subdocumento para Endereço, usado na aba 'Informações'
  address: {
    line1: { type: String, default: null },
    city: { type: String, default: null },
    country: { type: String, default: null }
  },

  // Subdocumento para Preferências de Notificação
  // Usado na aba 'Notificações'
  preferences: {
    newsletter: { type: Boolean, default: true },
    stockAlerts: { type: Boolean, default: false },
    orderUpdates: { type: Boolean, default: true } // Manter como true
  },

  // Array para armazenar Métodos de Pagamento Salvos (Tokens/IDs de Gateway)
  // Usado na aba 'Pagamento'
  paymentMethods: [{
    gatewayId: { type: String, required: true }, // ID de referência no gateway de pagamento (Stripe, etc.)
    type: { type: String, enum: ['card', 'paypal', 'mobile_money'], default: 'card' },
    last4: { type: String, default: '****' }, // Últimos 4 dígitos para cartões
    brand: { type: String }, // Visa, Mastercard, etc.
    // O Mongoose adicionará automaticamente o _id para este subdocumento, 
    // que é o methodId que usaremos no DELETE
  }]

}, { timestamps: true });

// Comparar senha
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);