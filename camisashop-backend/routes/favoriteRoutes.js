// routes/favoriteRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Product = require("../models/Product");
const verifyToken = require("../middleware/verifyToken");

// Todas as rotas exigem que o usuário seja "client"
router.use(verifyToken(["client"]));

// ================================
// Adicionar produto favorito
// ================================
router.post("/:productId", async (req, res) => {
  try {
    const user = await User.findById(req.user.id); // req.user vem do verifyToken
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });

    const productId = req.params.productId;
    if (!user.favoriteProducts.includes(productId)) {
      user.favoriteProducts.push(productId);
      await user.save();
    }

    res.json({ favoriteProducts: user.favoriteProducts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao adicionar favorito", error: err.message });
  }
});

// ================================
// Remover produto favorito
// ================================
router.delete("/:productId", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });

    user.favoriteProducts = user.favoriteProducts.filter(
      (id) => id.toString() !== req.params.productId
    );
    await user.save();

    res.json({ favoriteProducts: user.favoriteProducts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao remover favorito", error: err.message });
  }
});

// ================================
// Listar favoritos do usuário
// ================================
router.get("/", async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("favoriteProducts");
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });

    res.json(user.favoriteProducts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao buscar favoritos", error: err.message });
  }
});

module.exports = router;
