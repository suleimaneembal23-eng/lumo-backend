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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
