const mongoose = require('mongoose');
require('dotenv').config();

// Preços em FCFA realistas para a Guiné-Bissau
// Múltiplos de 25 como a moeda FCFA funciona
const fcfaPrices = {
    "Camisa Real Madrid Home 2024":         { price: 59000, originalPrice: null },
    "Vape Elfbar 7000 Puffs":               { price: 8500,  originalPrice: null },
    "Tênis Nike Air Max 270":               { price: 97500, originalPrice: null },
    "Camisa Brasil Seleção 2024":           { price: 52500, originalPrice: null },
    "Boné New Era Yankees":                 { price: 26000, originalPrice: null },
    "Jersey Lakers LeBron James":           { price: 65500, originalPrice: null },
    "Mochila Adidas Classic":               { price: 36000, originalPrice: null },
    "Fone JBL Tune 510BT":                 { price: 29500, originalPrice: null },
    "Camisa Manchester United Retrô 1999":  { price: 62500, originalPrice: 79000 },
    "Calção Nike Dry-FIT":                  { price: 22500, originalPrice: null },
    "Smartwatch Xiaomi Band 7":             { price: 39500, originalPrice: null },
    "Camisa Infantil Barcelona 2024":       { price: 32500, originalPrice: null },
    "Camiseta Oversized Streetwear":        { price: 19500, originalPrice: null },
    "Garrafa Térmica Stanley 1L":           { price: 42500, originalPrice: null },
    "Pod System Vaporesso XROS 3":          { price: 22500, originalPrice: null },
};

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const db = mongoose.connection.db;

    for (const [name, data] of Object.entries(fcfaPrices)) {
        const result = await db.collection('products').updateOne(
            { name },
            { $set: { price: data.price, originalPrice: data.originalPrice } }
        );
        console.log(`✅ ${name}: ${data.price.toLocaleString('de-DE')} FCFA${data.originalPrice ? ` (era ${data.originalPrice.toLocaleString('de-DE')} FCFA)` : ''}`);
    }

    console.log('\n🎉 Preços atualizados com sucesso!');
    process.exit(0);
}).catch(err => {
    console.error('Erro:', err);
    process.exit(1);
});
