const mongoose = require('mongoose');

// Schema para cada item do carrinho
const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  selectedSize: {
    type: String,
    required: true,
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    max: 10,
    default: 1
  },
  customization: {
    name: String,
    number: String,
    hasBadge: Boolean,
    badgeName: String
  }
}, { _id: true }); // _id: true permite que cada item tenha seu próprio ID

// Schema principal do carrinho
const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // Cada utilizador tem apenas 1 carrinho
  },
  items: [cartItemSchema],
  updatedAt: {
    type: Date,
    default: Date.now
  },
  abandonedEmailSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // Adiciona createdAt e updatedAt automaticamente
});

// Método para calcular o total do carrinho
cartSchema.methods.calculateTotal = function () {
  return this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
};

// Método para limpar itens com quantidade 0
cartSchema.methods.cleanZeroQuantities = function () {
  this.items = this.items.filter(item => item.quantity > 0);
};

// Middleware para atualizar o timestamp antes de salvar
cartSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Índice para melhorar performance nas consultas
cartSchema.index({ userId: 1 });

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;