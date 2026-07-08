const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const verifyToken = require("../middleware/verifyToken");

router.post("/create-payment-intent", verifyToken(["client"]), paymentController.createPaymentIntent);
router.post("/vendor-subscription-intent", verifyToken(["vendor"]), paymentController.createVendorSubscriptionIntent);

module.exports = router;
