const express = require("express");
const router = express.Router();
const { 
    updateClientProfile, 
    changePassword, 
    updateNotificationPreferences,
    getClientProfile,
    listClients,
    blockClient,
    deleteClient,
    // AS NOVAS FUNÇÕES AGORA SÃO IMPORTADAS
    getPaymentMethods, 
    addPaymentMethod, 
    removePaymentMethod
} = require("../controllers/clientController"); // Importamos todas as funções
const verifyToken = require("../middleware/verifyToken");

// ROTA BASE: /api/clients

// [ADMIN] Listar todos os clientes
router.get("/", verifyToken(["admin"]), listClients);

// [ADMIN] Bloquear/Desbloquear cliente
router.put("/:id/block", verifyToken(["admin"]), blockClient);

// [ADMIN & CLIENT] Buscar um cliente por ID (Usado para carregar o perfil)
router.get("/:id", verifyToken(["admin", "client"]), getClientProfile);

// [ADMIN & CLIENT] Editar informações básicas e endereço
router.put("/:id", verifyToken(["admin", "client"]), updateClientProfile);

// [CLIENT] Alterar senha
router.post("/:id/change-password", verifyToken(["client"]), changePassword);

// [CLIENT] Atualizar preferências de notificação
router.put("/:id/notifications", verifyToken(["client"]), updateNotificationPreferences);

// [ADMIN] Deletar cliente
router.delete("/:id", verifyToken(["admin"]), deleteClient);


// --- ROTAS DE PAGAMENTO ---
router.get("/:id/payment-methods", verifyToken(["client"]), getPaymentMethods);
router.post("/:id/payment-methods", verifyToken(["client"]), addPaymentMethod);
router.delete("/:id/payment-methods/:methodId", verifyToken(["client"]), removePaymentMethod);
// --------------------------


module.exports = router;