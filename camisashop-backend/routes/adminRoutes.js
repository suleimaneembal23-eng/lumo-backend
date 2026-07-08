const express = require('express');
const router = express.Router();
const { getDashboardStats, createVendor, getVendors, addProductObservation, clearProductObservation } = require('../controllers/adminController');
const verifyToken = require('../middleware/verifyToken');

// All admin routes require admin authentication
router.use(verifyToken(['admin']));

// Dashboard statistics
router.get('/dashboard-stats', getDashboardStats);

// 🏪 Vendor Management by Admin
router.post('/vendors', createVendor);
router.get('/vendors', getVendors);

// 📝 Observações de Admin para Produtos
router.post('/products/:id/observe', addProductObservation);
router.delete('/products/:id/observe', clearProductObservation);

module.exports = router;
