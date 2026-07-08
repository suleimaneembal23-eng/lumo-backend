const mongoose = require('mongoose');
const User = require('./models/User');

const run = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/camisashop');
        const user = await User.findOne({ email: 'sharing@gmail.com' });

        if (!user) {
            console.log("❌ Usuário não encontrado!");
            process.exit(1);
        }

        user.role = 'vendor';

        if (!user.vendorInfo) user.vendorInfo = {};
        if (!user.vendorInfo.subscription) user.vendorInfo.subscription = {};

        user.vendorInfo.subscription.isActive = true;
        user.vendorInfo.subscription.planType = 'semiannual';

        // 10 anos de acesso premium
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 10);
        user.vendorInfo.subscription.expiresAt = futureDate;

        await user.save();
        console.log("✅ Usuário atualizado com sucesso para Vendedor Premium!");
    } catch (e) {
        console.error("❌ Erro:", e);
    } finally {
        process.exit(0);
    }
};

run();
