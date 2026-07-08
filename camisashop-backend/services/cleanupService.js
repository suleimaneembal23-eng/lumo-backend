const Order = require("../models/Order");

/**
 * Serviço de Limpeza Automática
 * Remove pedidos antigos para manter o banco de dados limpo.
 */
const cleanupOldOrders = async () => {
    console.log("🧹 [CleanupService] Iniciando limpeza automática de pedidos...");
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // 1. Remover pedidos CANCELADOS há mais de 30 dias
        const cancelledResult = await Order.deleteMany({
            status: "cancelled",
            updatedAt: { $lt: thirtyDaysAgo }
        });

        if (cancelledResult.deletedCount > 0) {
            console.log(`🗑️ [CleanupService] ${cancelledResult.deletedCount} pedidos CANCELADOS antigos removidos.`);
        }

        // 2. Remover pedidos PENDENTES há mais de 30 dias (lixo)
        const pendingResult = await Order.deleteMany({
            status: "pending",
            createdAt: { $lt: thirtyDaysAgo }
        });

        if (pendingResult.deletedCount > 0) {
            console.log(`🗑️ [CleanupService] ${pendingResult.deletedCount} pedidos PENDENTES antigos removidos.`);
        }

        if (cancelledResult.deletedCount === 0 && pendingResult.deletedCount === 0) {
            console.log("✨ [CleanupService] Nenhum pedido antigo para remover hoje.");
        }

    } catch (err) {
        console.error("❌ [CleanupService] Erro na limpeza automática:", err);
    }
};

/**
 * Inicia o job de limpeza.
 * Executa imediatamente ao iniciar e depois a cada 24 horas.
 */
const startCleanupJob = () => {
    // Executa 5 segundos após a inicialização para não travar o boot
    setTimeout(cleanupOldOrders, 5000);

    // Agendar para rodar a cada 24 horas (86400000 ms)
    setInterval(cleanupOldOrders, 24 * 60 * 60 * 1000);
    console.log("⏰ [CleanupService] Job de limpeza agendado (24h).");
};

module.exports = { startCleanupJob };
