const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const { getSettings, updateSettings } = require("../controllers/settingsController");

// ✅ Obter configurações (público)
router.get("/", getSettings);

// ✅ Criar ou atualizar configurações (somente admin)
router.put("/", verifyToken(["admin"]), updateSettings);

module.exports = router;
    