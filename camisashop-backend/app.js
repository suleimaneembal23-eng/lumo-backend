const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const path = require("path"); // para servir a pasta uploads

const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

// 🔹 Inicialização
dotenv.config();
const app = express();
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173", process.env.STORE_URL || "https://camisashop.com"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// 🔹 Conexão com MongoDB
connectDB();

// 🛡️ SEGURANÇA (Configuração Estável para DEV e PROD)
app.use(helmet({
  crossOriginResourcePolicy: false, // Permite carregar imagens locais
  contentSecurityPolicy: false,      // Desativado CSP
}));

// 2. Mongo Sanitize movido para baixo (deve correr APÓS o body-parser)

// 3. Rate Limit Global (Testando sem bloqueio)
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, 
  max: 1000, 
  message: { message: "Muitas requisições. Tente mais tarde." }
});
app.use("/api", limiter);

// 🔹 Middleware principal (Body Parser)
app.use(express.json());
app.use(compression()); // Comprime as respostas da API e as Imagens em Gzip

// 🛡️ Prevenção contra NoSQL Injection (Custom para Express 5)
const sanitizeObject = (obj) => {
  if (typeof obj === 'object' && obj !== null) {
    Object.keys(obj).forEach((key) => {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else {
        sanitizeObject(obj[key]);
      }
    });
  }
};

app.use((req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.params) sanitizeObject(req.params);
  // Não reatribuir req.query inteiro porque no Express 5 é read-only
  if (req.query) sanitizeObject(req.query);
  next();
});

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
const vendorRoutes = require("./routes/vendorRoutes"); // 🏪 VENDORS
const paymentRoutes = require("./routes/paymentRoutes");

// 🔹 Aplicação das rotas
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/marketing", marketing);
app.use("/api/upload", uploadRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/settings", settingsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vendors', vendorRoutes); // 🏪 ROUTE
app.use("/api/payment", paymentRoutes);

// 🔹 Tornar a pasta uploads pública
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 🔹 Tratamento de rotas inexistentes
const { startCleanupJob } = require("./services/cleanupService");

// Inicia job de limpeza
startCleanupJob();

app.use((req, res) => {
  res.status(404).json({ message: "Rota não encontrada." });
});

// 🔹 Inicialização do servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));

// Trigger nodemon restart
