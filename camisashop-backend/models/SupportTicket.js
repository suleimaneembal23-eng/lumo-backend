const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ["user", "admin"], required: true },
  text: { type: String, required: true },
  attachments: [
    {
      url: String,
      type: { type: String }, // "image", "video", "pdf", "other"
    },
  ],
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const supportTicketSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    subject: { type: String, required: true },

    category: {
      type: String,
      enum: ["envio", "devolução", "pagamento", "conta", "produto", "suporte técnico", "outro"],
      default: "outro",
    },

    priority: {
      type: String,
      enum: ["baixa", "média", "alta", "urgente"],
      default: "média",
    },

    status: {
      type: String,
      enum: ["aberto", "respondido", "em análise", "resolvido", "fechado"],
      default: "aberto",
    },

    messages: [messageSchema],

    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },

    attachments: [
      {
        url: String,
        type: String,
      },
    ],

    adminNotes: [
      {
        adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        note: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // quem do suporte está atendendo
      default: null,
    },

    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Atualiza lastMessageAt automaticamente quando uma mensagem é adicionada
supportTicketSchema.pre("save", function (next) {
  if (this.isModified("messages")) {
    this.lastMessageAt = new Date();
  }
  next();
});

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
