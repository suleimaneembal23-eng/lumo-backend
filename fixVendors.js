const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    // Limpar nomes e definir slugs
    await User.findOneAndUpdate(
        { email: 'sharing@gmail.com' },
        { $set: {
            'vendorInfo.storeName': 'Loja Alpha',
            'vendorInfo.slug': 'loja-alpha',
            'vendorInfo.storeDescription': 'A nossa loja VIP com produtos selecionados de alta qualidade.',
            'vendorInfo.subscription.plan': 'VIP',
            'vendorInfo.subscription.expiryDate': new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000)
        }}
    );
    // Atualizar shopName nos produtos também
    await mongoose.connection.db.collection('products').updateMany(
        { shopName: 'Loja VIP 10 Anos' },
        { $set: { shopName: 'Loja Alpha' }}
    );
    console.log('✅ sharing@gmail.com -> Loja Alpha (VIP), slug: loja-alpha');

    await User.findOneAndUpdate(
        { email: 'colaborador@gmail.com' },
        { $set: {
            'vendorInfo.storeName': 'Loja Beta',
            'vendorInfo.slug': 'loja-beta',
            'vendorInfo.storeDescription': 'Loja parceira com produtos variados.',
            'vendorInfo.subscription.plan': 'Free',
            'vendorInfo.subscription.expiryDate': new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        }}
    );
    await mongoose.connection.db.collection('products').updateMany(
        { shopName: 'Loja Parceira Gratis' },
        { $set: { shopName: 'Loja Beta' }}
    );
    console.log('✅ colaborador@gmail.com -> Loja Beta (Free), slug: loja-beta');

    // Verificar resultado final
    const vendors = await User.find({ role: 'vendor' }).select('email name vendorInfo');
    vendors.forEach(v => {
        console.log(`  > ${v.email} | ${v.vendorInfo?.storeName} | slug: ${v.vendorInfo?.slug} | plan: ${v.vendorInfo?.subscription?.plan}`);
    });

    process.exit(0);
}).catch(err => {
    console.error('Erro:', err);
    process.exit(1);
});
