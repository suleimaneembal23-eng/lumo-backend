const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    siteName: { type: String },
    siteDescription: { type: String },
    contactEmail: { type: String },
    contactPhone: { type: String },
    address: { type: String },

    logoUrl: { type: String },
    bannerUrl: { type: String },
    primaryColor: { type: String },
    secondaryColor: { type: String },
    backgroundColor: { type: String, default: "#ffffff" },

    maxShippingDays: { type: Number },
    returnPolicyDays: { type: Number },
    shippingInfo: { type: String },  // 🟢 Conteúdo editável "Envio e Entrega"
    returnInfo: { type: String },    // 🟢 Conteúdo editável "Devoluções"

    aboutUs: { type: String },       // 🟢 Conteúdo editável "Sobre Nós"
    contactInfo: { type: String },   // 🟢 Conteúdo editável "Contactos"

    currency: { type: String },
    taxRate: { type: Number },
    supportHours: { type: String },

    footerNote: { type: String },

    // 🎁 Configuração do Cupom de Boas-Vindas
    welcomeCouponCode: { type: String },
    welcomeCouponDiscount: { type: Number },
    // 🌍 Configuração de Taxas de Envio
    shippingStandardPrice: { type: Number, default: 5 },
    shippingExpressPrice: { type: Number, default: 10 },

    // 👕 Configuração de Personalização
    customizationPrice: { type: Number, default: 3 },
    badgePrice: { type: Number, default: 5 },

    shippingRates: [
      {
        country: { type: String, required: true },
        cost: { type: Number, required: true },
      },
    ],
    // 🚚 Configuração Avançada de Envio
    freeShippingThreshold: { type: Number, default: 0 }, // 0 = desativado
    shippingMethods: [
      {
        name: { type: String, required: true }, // ex: "Standard", "Express"
        price: { type: Number, required: true },
        deliveryTime: { type: String }, // ex: "3-5 dias"
      }
    ],
    // 💳 Configuração de Pagamentos
    paymentConfig: {
      orangeMoneyNumber: { type: String, default: "" },
      bankTransferInfo: { type: String, default: "" },
      creditCardEnabled: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
