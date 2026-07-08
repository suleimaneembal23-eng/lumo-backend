const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const u = await User.findOneAndUpdate(
        { email: 'sharing@gmail.com' },
        { $set: {
            'vendorInfo.subscription.plan': 'VIP',
            'vendorInfo.subscription.expiryDate': new Date(Date.now() + 10*365*24*60*60*1000),
            'vendorInfo.storeName': 'Loja Alpha',
            'vendorInfo.slug': 'loja-alpha'
        }},
        { new: true }
    );
    console.log('Plan:', u.vendorInfo.subscription.plan);
    console.log('Expiry:', u.vendorInfo.subscription.expiryDate);
    console.log('Store:', u.vendorInfo.storeName);
    process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
