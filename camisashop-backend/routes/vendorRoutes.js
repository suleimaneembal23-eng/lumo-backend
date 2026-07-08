const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { updateVendorProfile, activateVendorSubscription } = require('../controllers/clientController'); // Reusing the function I just made
// If I had separated controllers better, I'd have vendorController.js. 
// For now, importing from clientController (which acts as userController) is fine.

// All routes require vendor role
router.use(verifyToken(['vendor']));

// 🏪 Update Vendor Profile (Store Settings)
router.put('/profile', updateVendorProfile);

// 💳 Activate Vendor Subscription
router.post('/activate-subscription', activateVendorSubscription);

module.exports = router;
