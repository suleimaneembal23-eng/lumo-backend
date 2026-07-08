const SupportTicket = require("../models/SupportTicket");
const User = require("../models/User");

// Criar ticket
exports.createTicket = async (req, res) => {
  try {
    const { subject, category, priority, text, orderId, productId } = req.body;

    const newTicket = await SupportTicket.create({
      userId: req.user.id,
      subject,
      category,
      priority,
      messages: [
        {
          sender: "user",
          text: text || "Sem mensagem",
        },
      ],
      orderId,
      productId,
    });

    res.status(201).json(newTicket);

  } catch (error) {
    console.error("Erro ao criar ticket:", error);
    res.status(500).json({ error: "Erro ao criar ticket" });
  }
};

// Buscar tickets do usuário
exports.getUserTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ userId: req.user.id })
      .sort({ lastMessageAt: -1 });

    res.json(tickets);

  } catch (error) {
    res.status(500).json({ error: "Erro ao carregar tickets" });
  }
};

// Buscar todos os tickets (ADMIN)
exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find()
      .populate("userId", "name email")
      .populate("assignedTo", "name email")
      .sort({ lastMessageAt: -1 });

    res.json(tickets);

  } catch (error) {
    res.status(500).json({ error: "Erro ao listar tickets" });
  }
};

// Ver um ticket específico
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate("userId", "name email")
      .populate("assignedTo", "name email");

    if (!ticket) {
      return res.status(404).json({ error: "Ticket não encontrado" });
    }

    res.json(ticket);

  } catch (error) {
    res.status(500).json({ error: "Erro ao obter ticket" });
  }
};

// Responder ticket (admin ou user)
exports.replyTicket = async (req, res) => {
  try {
    const { text } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) return res.status(404).json({ error: "Ticket não encontrado" });

    ticket.messages.push({
      sender: req.user.role === "admin" ? "admin" : "user",
      text,
    });

    ticket.status = "respondido";
    ticket.lastMessageAt = new Date();

    await ticket.save();

    res.json(ticket);

  } catch (error) {
    res.status(500).json({ error: "Erro ao responder ticket" });
  }
};

// Admin atribui ticket
exports.assignTicket = async (req, res) => {
  try {
    const { adminId } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) return res.status(404).json({ error: "Ticket não encontrado" });

    ticket.assignedTo = adminId;
    await ticket.save();

    res.json({ message: "Ticket atribuído com sucesso", ticket });

  } catch (error) {
    res.status(500).json({ error: "Erro ao atribuir ticket" });
  }
};

// Admin adiciona notas internas
exports.addAdminNote = async (req, res) => {
  try {
    const { note } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);

    ticket.adminNotes.push({
      adminId: req.user.id,
      note,
    });

    await ticket.save();

    res.json(ticket);

  } catch (error) {
    res.status(500).json({ error: "Erro ao adicionar nota" });
  }
};

// Fechar ticket
exports.closeTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) return res.status(404).json({ error: "Ticket não encontrado" });

    ticket.status = "fechado";
    await ticket.save();

    res.json({ message: "Ticket fechado com sucesso" });

  } catch (error) {
    res.status(500).json({ error: "Erro ao fechar ticket" });
  }
};
