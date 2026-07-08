const getStripe = () => require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.createPaymentIntent = async (req, res) => {
    const { amount, currency } = req.body;

    if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ message: "Chave do Stripe não configurada." });
    }

    try {
        const stripe = getStripe();
        
        // Stripe requires integer amounts. For 'xof' (CFA Franc), it's a zero-decimal currency, so NO * 100.
        const isZeroDecimal = (currency || "xof").toLowerCase() === 'xof';
        const finalAmount = isZeroDecimal ? Math.round(amount) : Math.round(amount * 100);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: finalAmount,
            currency: currency || "xof",
            automatic_payment_methods: {
                enabled: true,
            },
        });

        res.status(200).json({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.error("❌ Erro ao criar PaymentIntent:", error);
        res.status(500).json({ message: "Erro ao processar pagamento", error: error.message });
    }
};

// 💳 Criar PaymentIntent ESPECÍFICO para Assinatura de Vendor
exports.createVendorSubscriptionIntent = async (req, res) => {
    const { planType } = req.body; // 'monthly' ou 'semiannual'

    if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ message: "Chave do Stripe não configurada." });
    }

    // Definir preços rigorosamente no backend para evitar fraudes
    let amount = 0;
    if (planType === 'monthly') amount = 40;
    else if (planType === 'semiannual') amount = 150;
    else return res.status(400).json({ message: "Plano inválido." });

    try {
        const stripe = getStripe();
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // em cêntimos (4000 = €40.00)
            currency: "eur",
            automatic_payment_methods: { enabled: true },
            metadata: {
                paymentType: 'vendor_subscription',
                planType: planType,
                vendorId: req.userId // Assumindo que usa o middleware verifyToken
            }
        });

        res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            amount: amount
        });
    } catch (error) {
        console.error("❌ Erro ao criar Vendor Subscription Intent:", error);
        res.status(500).json({ message: "Erro ao processar assinatura", error: error.message });
    }
};
