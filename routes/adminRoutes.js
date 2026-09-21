const express = require('express');
const router = express.Router();
const { getVendors, createVendor, getDashboardStats, getAdmins, deleteAdmin } = require('../controllers/adminController');
const verifyToken = require('../middleware/verifyToken');

// Rotas protegidas para admins
router.get("/vendors", verifyToken(["admin"]), getVendors);
router.post("/vendors", verifyToken(["admin"]), createVendor);
router.get("/dashboard-stats", verifyToken(["admin"]), getDashboardStats);
router.get("/admins", verifyToken(["admin"]), getAdmins);
router.delete("/admins/:id", verifyToken(["admin"]), deleteAdmin);

module.exports = router;
