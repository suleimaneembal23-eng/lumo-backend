const express = require("express");
const router = express.Router();
const {
  createTicket,
  getUserTickets,
  getAllTickets,
  getTicketById,
  replyTicket,
  closeTicket,
  assignTicket,
  addAdminNote
} = require("../controllers/supportController");

const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");

// 📌 Usuário cria ticket
router.post("/", auth, createTicket);

// 📌 Usuário vê seus tickets
router.get("/my", auth, getUserTickets);

// 📌 Admin pega todos os tickets
router.get("/admin/all", auth, adminAuth, getAllTickets);

// 📌 Ver ticket específico
router.get("/:id", auth, getTicketById);

// 📌 Responder ticket
router.post("/:id/reply", auth, replyTicket);

// 📌 Fechar ticket
router.post("/:id/close", auth, closeTicket);

// 📌 Admin atribui ticket
router.post("/:id/assign", auth, adminAuth, assignTicket);

// 📌 Admin adiciona nota interna
router.post("/:id/note", auth, adminAuth, addAdminNote);

module.exports = router;
