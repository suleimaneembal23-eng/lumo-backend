require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const passwordHash = await bcrypt.hash('senha123', 10);
    
    const admins = [
      { name: 'Zizzy Admin', email: 'zizzy@gmail.com', password: passwordHash, role: 'admin' },
      { name: 'Michel Tairo Admin', email: 'micheltairo@gmail.com', password: passwordHash, role: 'admin' }
    ];

    for (let admin of admins) {
      const exists = await User.findOne({ email: admin.email });
      if (!exists) {
        await User.create(admin);
        console.log('Criado: ' + admin.email);
      } else {
        console.log('Já existe: ' + admin.email);
      }
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
