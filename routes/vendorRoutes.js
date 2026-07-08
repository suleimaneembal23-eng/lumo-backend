const express = require('express');
const router = express.Router();
const { updateVendorProfile, getVendorProfile } = require('../controllers/vendorController');
const verifyToken = require('../middleware/verifyToken');

// GET  /api/vendors/profile
router.get('/profile', verifyToken(['vendor']), getVendorProfile);

// PUT  /api/vendors/profile
router.put('/profile', verifyToken(['vendor', 'admin']), updateVendorProfile);

module.exports = router;

