// routes/feedbackRoutes.js
const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const Feedback = require("../models/Feedback");

// ================================
// Criar feedback (avaliar produto)
// ================================
router.post("/", verifyToken(["client"]), async (req, res) => {
  try {
    const { product, rating, comment } = req.body;

    if (!product || !rating) {
      return res.status(400).json({ message: "Produto e avaliação são obrigatórios" });
    }

    const feedback = await Feedback.create({
      client: req.user.id,
      product,
      rating,
      comment,
    });

    res.status(201).json(feedback);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// ================================
// Listar feedbacks de um produto
// ================================
router.get("/product/:productId", async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ product: req.params.productId })
      .populate("client", "name email")
      .sort({ createdAt: -1 });

    res.json(feedbacks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// ================================
// Atualizar feedback (apenas dono)
// ================================
router.put("/:id", verifyToken(["client"]), async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) return res.status(404).json({ message: "Feedback não encontrado" });

    if (feedback.client.toString() !== req.user.id) {
      return res.status(403).json({ message: "Você não pode editar este feedback" });
    }

    // ⏰ Check if 15 minutes have passed
    const fifteenMinutes = 15 * 60 * 1000; // 15 min in milliseconds
    const timeSinceCreation = Date.now() - new Date(feedback.createdAt).getTime();

    if (timeSinceCreation > fifteenMinutes) {
      return res.status(403).json({ message: "Você só pode editar comentários até 15 minutos após a criação" });
    }

    const { rating, comment } = req.body;
    if (rating !== undefined) feedback.rating = rating;
    if (comment !== undefined) feedback.comment = comment;

    await feedback.save();
    res.json(feedback);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// ================================
// Deletar feedback (apenas dono)
// ================================
router.delete("/:id", verifyToken(["client"]), async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) return res.status(404).json({ message: "Feedback não encontrado" });

    if (feedback.client.toString() !== req.user.id) {
      return res.status(403).json({ message: "Você não pode deletar este feedback" });
    }

    // ⏰ Check if 15 minutes have passed
    const fifteenMinutes = 15 * 60 * 1000;
    const timeSinceCreation = Date.now() - new Date(feedback.createdAt).getTime();

    if (timeSinceCreation > fifteenMinutes) {
      return res.status(403).json({ message: "Você só pode deletar comentários até 15 minutos após a criação" });
    }

    // ✅ Correção: substituir remove() por findByIdAndDelete
    await Feedback.findByIdAndDelete(req.params.id);

    res.json({ message: "Feedback removido com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
