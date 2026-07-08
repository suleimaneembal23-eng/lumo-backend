// models/Order.js
const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String },
  image: { type: String }, // ✅ Added image field
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  size: { type: String } // se aplicável
});

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  shopOrders: [{
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    shopName: { type: String },
    items: [orderItemSchema],
    deliveryMethod: { type: String, default: "delivery" },
    trackingCode: { type: String },
    status: { type: String, enum: ["pending", "confirmed", "paid", "shipped", "ready_for_pickup", "delivered", "cancelled"], default: "pending" },
    shippedAt: { type: Date }
  }],

  shippingAddress: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  paymentMethod: { type: String, default: "stripe" }, // ou "paypal", "manual", "orange_money"
  paymentResult: {
    id: String, // id do provedor
    status: String,
    update_time: String,
    email_address: String
  },
  itemsPrice: { type: Number, required: true }, // soma itens totais
  shippingPrice: { type: Number, default: 0 },
  taxPrice: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true }, // itemsPrice + shipping + tax
  paidAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
