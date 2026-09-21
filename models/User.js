const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "client", "vendor"], required: true },
  favoriteProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  isBlocked: { type: Boolean, default: false }, // bloqueio do cliente

  // -------------------------------------------------------------
  // 🛡️ SEGURANÇA E BLOQUEIOS E ATIVIDADE
  // -------------------------------------------------------------
  lastLogin: { type: Date, default: null },
  failedAdminAttempts: { type: Number, default: 0 },
  adminLockUntil: { type: Date, default: null },

  // -------------------------------------------------------------
  // 🚀 NOVOS CAMPOS PARA A GESTÃO DE PERFIL E PREFERÊNCIAS
  // -------------------------------------------------------------

  vendorInfo: {
    storeName: { type: String },
    slug: { type: String },
    description: { type: String },
    logo: { type: String },
    banner: { type: String },
    // Métodos de entrega suportados pela loja
    allowsDelivery: { type: Boolean, default: true },  // Envia para casa
    allowsPickup:   { type: Boolean, default: false }, // Levantamento físico
    pickupAddress: {
      line1:      { type: String },
      city:       { type: String },
      postalCode: { type: String },
      country:    { type: String, default: 'Guiné-Bissau' }
    },
    shippingSettings: {
      flatRate:              { type: Number, default: 0 },
      freeShippingThreshold: { type: Number, default: 0 },
      deliveryTime:          { type: String, default: '5 a 10 dias úteis' },
      returnPolicy:          { type: String, default: '14 dias para devolução' }
    },
    subscription: {
      plan:       { type: String, enum: ["Free", "VIP"], default: "Free" },
      expiryDate: { type: Date }
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