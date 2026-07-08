// models/Order.js
const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String },
  image: { type: String }, // ✅ Added image field
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  size: { type: String }, // se aplicável
  customization: {
    number: String,
    hasBadge: Boolean,
    badgeName: String
  },
  // 💸 Split de Pagamento (Salvo no momento da compra)
  commission: { type: Number, default: 0 }, // O que o SITE ganha
  vendorNet: { type: Number, default: 0 },   // O que o VENDOR ganha
  // 📦 Status de envio individual do Vendor
  status: { type: String, enum: ["pending", "processing", "shipped", "delivered", "cancelled"], default: "pending" }
});

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // 🏪 Cache of Vendors involved in this order for easier filtering
  vendorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  items: [orderItemSchema],
  shippingAddress: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  shippingMethod: { type: String, default: "standard" }, // ✅ Added shippingMethod
  paymentMethod: {
    type: String,
    enum: ["credit_card", "transfer", "mbway", "orange_money", "stripe", "simulation"],
    default: "orange_money"
  },
  paymentResult: {
    id: String,
    status: String,
    update_time: String,
    email_address: String
  },
  itemsPrice: { type: Number, required: true },
  shippingPrice: { type: Number, default: 0 },
  taxPrice: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ["pending", "confirmed", "paid", "shipped", "cancelled"], default: "pending" },
  paidAt: { type: Date },
  shippedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
