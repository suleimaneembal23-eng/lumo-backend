const express = require('express');
const router = express.Router();
const { getVendors, createVendor, getDashboardStats } = require('../controllers/adminController');
const verifyToken = require('../middleware/verifyToken');

// Rotas protegidas para admins
router.get("/vendors", verifyToken(["admin"]), getVendors);
router.post("/vendors", verifyToken(["admin"]), createVendor);
router.get("/dashboard-stats", verifyToken(["admin"]), getDashboardStats);

module.exports = router;
