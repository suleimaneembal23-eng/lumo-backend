const User = require("../models/User"); // Seu modelo User/Client
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose"); // Necessário para ObjectId

// Função utilitária para verificar se o ID pertence ao usuário logado
const checkOwnership = (req, res) => {
    // Permite que o admin acesse qualquer ID
    if (req.user.role === 'admin') return true;

    // Permite que o cliente acesse apenas o próprio ID
    // Assumimos que o verifyToken adiciona req.user.id
    if (req.user.id === req.params.id) return true;

    // Se não for admin e não for o próprio ID
    res.status(403).json({ message: "Acesso negado. Você só pode interagir com o seu próprio perfil." });
    return false;
}

// -----------------------------------------------------------------------
// FUNÇÕES DE ADMIN (Mantidas)
// -----------------------------------------------------------------------

exports.listClients = async (req, res) => {
    try {
        const clients = await User.find({ role: "client" }).select("-password");
        res.json(clients);
    } catch (err) {
        res.status(500).json({ message: "Erro ao buscar clientes" });
    }
};

exports.blockClient = async (req, res) => {
    try {
        const client = await User.findById(req.params.id);
        if (!client) return res.status(404).json({ message: "Cliente não encontrado" });

        client.isBlocked = !client.isBlocked;
        await client.save();
        res.json({ message: client.isBlocked ? "Cliente bloqueado" : "Cliente desbloqueado" });
    } catch (err) {
        res.status(500).json({ message: "Erro ao bloquear/desbloquear cliente" });
    }
};

exports.deleteClient = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "Cliente deletado" });
    } catch (err) {
        res.status(500).json({ message: "Erro ao deletar cliente" });
    }
};

exports.getClientProfile = async (req, res) => {
    if (!checkOwnership(req, res)) return;

    try {
        // Busca o cliente, excluindo a senha
        const client = await User.findById(req.params.id).select("-password");

        if (!client) return res.status(404).json({ message: "Cliente não encontrado" });

        res.json(client);
    } catch (err) {
        res.status(500).json({ message: "Erro ao buscar cliente", error: err.message });
    }
};


// -----------------------------------------------------------------------
// FUNÇÕES DE CLIENTE (Atualizadas)
// -----------------------------------------------------------------------

// Rota: PUT /api/clients/:id
exports.updateClientProfile = async (req, res) => {
    console.log("updateClientProfile CALLED");
    console.log("Params ID:", req.params.id);
    console.log("User from Token:", req.user);
    console.log("Body:", req.body);

    if (!checkOwnership(req, res)) return;

    const { name, email, phone, addressLine1, city, country, favoriteProducts } = req.body;

    try {
        const client = await User.findById(req.params.id);
        if (!client) return res.status(404).json({ message: "Cliente não encontrado" });

        // A lógica de atualização foi mantida, incluindo o tratamento de erro 11000
        client.name = name || client.name;
        client.email = email || client.email;
        client.phone = phone !== undefined ? phone : client.phone;
        client.favoriteProducts = favoriteProducts || client.favoriteProducts;

        client.address = client.address || {};
        client.address.line1 = addressLine1 !== undefined ? addressLine1 : client.address.line1;
        client.address.city = city !== undefined ? city : client.address.city;
        client.address.country = country !== undefined ? country : client.address.country;

        console.log("Saving client with address:", client.address);

        await client.save();

        const { password: pw, ...clientData } = client.toObject();
        res.json(clientData);

    } catch (err) {
        console.error("Error updating profile:", err);
        if (err.code === 11000) {
            return res.status(400).json({ message: "Este email já está em uso por outro usuário." });
        }
        res.status(500).json({ message: "Erro ao atualizar perfil.", error: err.message });
    }
};

// Rota: POST /api/clients/:id/change-password
exports.changePassword = async (req, res) => {
    console.log("changePassword CALLED");
    console.log("Body:", req.body);

    if (!checkOwnership(req, res)) return;

    const { currentPassword, newPassword } = req.body;

    try {
        const client = await User.findById(req.params.id);

        if (!client) return res.status(404).json({ message: "Cliente não encontrado." });
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Senha atual e nova senha são obrigatórias." });
        }

        // 1. Verificar a senha atual
        // Você está usando 'client.password' (Schema), mas o método de comparação é 'matchPassword'
        const isMatch = await client.matchPassword(currentPassword); // USAR MÉTODO DO SCHEMA
        if (!isMatch) {
            console.log("Password mismatch");
            return res.status(401).json({ message: "A senha atual está incorreta." });
        }

        // 2. Hash da nova senha
        const salt = await bcrypt.genSalt(10);
        client.password = await bcrypt.hash(newPassword, salt); // Atualiza o campo 'password'

        // 3. Salvar
        await client.save();

        res.status(200).json({ message: "Senha atualizada com sucesso!" });

    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ message: "Erro ao alterar a senha.", error: error.message });
    }
};

// Rota: PUT /api/clients/:id/notifications
exports.updateNotificationPreferences = async (req, res) => {
    if (!checkOwnership(req, res)) return;

    const { newsletter, stockAlerts } = req.body;

    try {
        const client = await User.findById(req.params.id);

        if (!client) return res.status(404).json({ message: "Cliente não encontrado." });

        client.preferences = client.preferences || {};
        client.preferences.newsletter = newsletter !== undefined ? newsletter : client.preferences.newsletter;
        client.preferences.stockAlerts = stockAlerts !== undefined ? stockAlerts : client.preferences.stockAlerts;
        client.preferences.orderUpdates = true;

        await client.save();

        res.status(200).json({
            message: "Preferências de notificação atualizadas com sucesso.",
            preferences: client.preferences
        });

    } catch (error) {
        res.status(500).json({ message: "Erro ao atualizar preferências.", error: error.message });
    }
};

// -----------------------------------------------------------------------
// 💳 FUNÇÕES DE PAGAMENTO (NOVAS IMPLEMENTAÇÕES)
// -----------------------------------------------------------------------

// Rota: GET /api/clients/:id/payment-methods
exports.getPaymentMethods = async (req, res) => {
    if (!checkOwnership(req, res)) return;

    try {
        const client = await User.findById(req.params.id).select("paymentMethods");

        if (!client) return res.status(404).json({ message: "Cliente não encontrado." });

        // Retorna apenas o array de métodos de pagamento
        res.json(client.paymentMethods || []);

    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar métodos de pagamento.", error: error.message });
    }
};

// Rota: POST /api/clients/:id/payment-methods
exports.addPaymentMethod = async (req, res) => {
    if (!checkOwnership(req, res)) return;

    // Campos esperados do frontend/gateway (simulação)
    const { gatewayId, type, last4, brand } = req.body;

    if (!gatewayId || !type) {
        return res.status(400).json({ message: "ID do Gateway e Tipo são obrigatórios." });
    }

    try {
        const client = await User.findById(req.params.id);
        if (!client) return res.status(404).json({ message: "Cliente não encontrado." });

        // Cria o novo subdocumento
        const newMethod = { gatewayId, type, last4, brand };

        // Adiciona o novo método ao array
        client.paymentMethods.push(newMethod);
        await client.save();

        // Retorna o método que foi adicionado (incluindo o _id gerado pelo Mongoose)
        const addedMethod = client.paymentMethods[client.paymentMethods.length - 1];

        res.status(201).json({
            message: "Método de pagamento adicionado com sucesso.",
            method: addedMethod
        });

    } catch (error) {
        res.status(500).json({ message: "Erro ao adicionar método de pagamento.", error: error.message });
    }
};

// Rota: DELETE /api/clients/:id/payment-methods/:methodId
exports.removePaymentMethod = async (req, res) => {
    if (!checkOwnership(req, res)) return;

    const { methodId } = req.params;

    try {
        const client = await User.findById(req.params.id);
        if (!client) return res.status(404).json({ message: "Cliente não encontrado." });

        // Usa Mongoose .id() ou .pull() para remover subdocumentos
        const initialLength = client.paymentMethods.length;

        // Remove o subdocumento pelo seu _id
        client.paymentMethods.pull({ _id: methodId });

        if (client.paymentMethods.length === initialLength) {
            return res.status(404).json({ message: "Método de pagamento não encontrado." });
        }

        await client.save();

        res.status(200).json({ message: "Método de pagamento removido com sucesso." });

    } catch (error) {
        res.status(500).json({ message: "Erro ao remover método de pagamento.", error: error.message });
    }
};