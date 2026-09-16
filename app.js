const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const path = require("path"); // para servir a pasta uploads
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");

// 🔹 Inicialização
dotenv.config();
const app = express();

// 🔹 Conexão com MongoDB
connectDB();

// 🔹 Middleware principal
app.use(express.json());

// 🔹 Segurança (Headers HTTP seguros)
// NOTA: Helmet temporariamente desativado porque bloqueia imagens/CORS no ambiente de desenvolvimento local.
// app.use(helmet({
//   crossOriginResourcePolicy: { policy: "cross-origin" }
// }));

// 🔹 Prevenção de NoSQL Injection (Ex: {"$gt": ""})
// app.use(mongoSanitize());

// 🔹 Prevenção de XSS (Cross-Site Scripting)
// app.use(xss());

// 🔹 Limite de Requisições (Rate Limiting Global)
// Exemplo: max 500 requests por IP a cada 15 min.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: "Muitos pedidos a partir deste IP, tente novamente em 15 minutos."
});
app.use("/api", globalLimiter);

// 🔹 Limite estrito para Login/Registo (Prevenir brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // 20 tentativas de login/registo
  message: "Muitas tentativas de login a partir deste IP, tente novamente mais tarde."
});

// 🔹 Logger de requisições
app.use((req, res, next) => {
  console.log(`EXPRESS: ➡️ Método ${req.method} na URL: ${req.originalUrl}`);
  next();
});

// 🔹 CORS configurado
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173", "https://lumobissau.netlify.app", "https://lumobissau.com", "https://www.lumobissau.com"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// 🔹 Importação das rotas
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const clientRoutes = require("./routes/clientRoutes");
const marketing = require("./routes/marketing");
const uploadRoutes = require("./routes/uploadRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const cartRoutes = require('./routes/cartRoutes');
const adminRoutes = require('./routes/adminRoutes');
const vendorRoutes = require('./routes/vendorRoutes');

// 🔹 Aplicação das rotas
app.use("/api/products", productRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/marketing", marketing);
app.use("/api/upload", uploadRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/settings", settingsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vendors', vendorRoutes);

// 🔹 Tornar a pasta uploads pública
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 🔹 Tratamento de rotas inexistentes
app.use((req, res) => {
  res.status(404).json({ message: "Rota não encontrada." });
});

// 🔹 Inicialização do servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
