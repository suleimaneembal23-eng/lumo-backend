const Settings = require("../models/Settings");

// GET - obter configurações
const getSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne({});
    if (!settings) return res.status(404).json({ message: "Nenhuma definição encontrada." });
    res.json(settings);
  } catch (err) {
    console.error("Erro no getSettings:", err);
    res.status(500).json({ message: "Erro ao carregar definições.", error: err.message });
  }
};

// PUT - criar ou atualizar configurações
const updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({});

    const defaults = {
      siteName: "Lumo",
      siteDescription: "",
      address: "",
      contactEmail: "",
      contactPhone: "",
      logoUrl: "",
      bannerUrl: "",
      primaryColor: "#3b82f6",
      secondaryColor: "#dbeafe",
      backgroundColor: "#ffffff",
      maxShippingDays: 1,
      returnPolicyDays: 1,
      shippingInfo: "",
      returnInfo: "",
      aboutUs: "",
      contactInfo: "",
      currency: "XOF",
      taxRate: 0,
      supportHours: "",
      footerNote: "",
      welcomeCouponCode: "",
      welcomeCouponDiscount: 0,
      shippingRates: [],
      customizationPrice: 3,
      badgePrice: 5,
      paymentConfig: {
        orangeMoneyNumber: "",
        bankTransferInfo: "",
        creditCardEnabled: true,
      },
      freeShippingThreshold: 0,
      shippingMethods: [
        { name: "Standard", price: 5, deliveryTime: "5-7 dias" },
        { name: "Express", price: 15, deliveryTime: "1-2 dias" }
      ],
    };

    if (!settings) {
      settings = new Settings({ ...defaults, ...req.body });
    } else {
      Object.keys(defaults).forEach((key) => {
        if (req.body[key] !== undefined) {
          settings[key] = req.body[key];
        } else if (settings[key] === undefined) {
          settings[key] = defaults[key];
        }
      });
    }

    await settings.save();
    res.json(settings);
  } catch (err) {
    console.error("Erro no updateSettings:", err);
    res.status(500).json({ message: "Erro ao atualizar definições.", error: err.message });
  }
};

module.exports = { getSettings, updateSettings };
