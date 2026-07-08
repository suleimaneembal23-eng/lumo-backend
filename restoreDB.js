const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');
require('dotenv').config();

const sampleProducts = [
    {
        name: "Camisa Real Madrid Home 2024",
        description: "Camisa oficial do Real Madrid temporada 2024. Material respirável de alta qualidade.",
        category: ["Camisas de Equipas", "Destaques"],
        price: 89.99,
        image: "/uploads/real_madrid.jpg",
        inStock: true,
        featured: true,
        attributes: [
            { name: "Tamanho", options: ["S", "M", "L", "XL", "XXL"] },
            { name: "Versão", options: ["Jogador", "Torcedor"] }
        ]
    },
    {
        name: "Vape Elfbar 7000 Puffs",
        description: "Vape descartável com 7000 puffs. Bateria de longa duração.",
        category: ["Vapes & Cigarros Eletrônicos", "Top Vendidos"],
        price: 12.99,
        image: "/uploads/vape_elfbar.jpg",
        inStock: true,
        featured: true,
        attributes: [
            { name: "Sabor", options: ["Menta", "Uva", "Morango", "Melancia", "Ice"] },
            { name: "Nicotina", options: ["0mg", "20mg", "50mg"] }
        ]
    },
    {
        name: "Tênis Nike Air Max 270",
        description: "Tênis Nike Air Max 270 com amortecimento excepcional.",
        category: ["Calçado", "Destaques"],
        price: 149.99,
        image: "/uploads/nike_airmax.jpg",
        inStock: true,
        featured: false,
        attributes: [
            { name: "Tamanho", options: ["38", "39", "40", "41", "42", "43", "44"] },
            { name: "Cor", options: ["Preto", "Branco", "Azul", "Vermelho"] }
        ]
    },
    {
        name: "Camisa Brasil Seleção 2024",
        description: "Camisa oficial da Seleção Brasileira. Amarelo vibrante.",
        category: ["Camisas de Seleções", "Novidades"],
        price: 79.99,
        image: "/uploads/brasil_selecao.jpg",
        inStock: true,
        featured: true,
        attributes: [
            { name: "Tamanho", options: ["S", "M", "L", "XL"] }
        ]
    },
    {
        name: "Boné New Era Yankees",
        description: "Boné New Era 9FIFTY dos New York Yankees.",
        category: ["Bonés & Chapéus", "Acessórios"],
        price: 39.99,
        image: "/uploads/bone_yankees.jpg",
        inStock: true,
        featured: false,
        attributes: [
            { name: "Tamanho", options: ["Único Ajustável"] },
            { name: "Cor", options: ["Preto", "Azul Marinho", "Cinza"] }
        ]
    },
    {
        name: "Jersey Lakers LeBron James",
        description: "Camiseta oficial NBA dos Lakers #23 LeBron James.",
        category: ["NBA", "Top Vendidos"],
        price: 99.99,
        image: "/uploads/lakers_lebron.jpg",
        inStock: true,
        featured: true,
        attributes: [
            { name: "Tamanho", options: ["S", "M", "L", "XL"] },
            { name: "Versão", options: ["Swingman", "Autêntica"] }
        ]
    },
    {
        name: "Mochila Adidas Classic",
        description: "Mochila Adidas com compartimento para laptop.",
        category: ["Mochilas & Bolsas", "Acessórios"],
        price: 54.99,
        image: "/uploads/mochila_adidas.jpg",
        inStock: true,
        featured: false,
        attributes: [
            { name: "Cor", options: ["Preto", "Azul", "Cinza"] }
        ]
    },
    {
        name: "Fone JBL Tune 510BT",
        description: "Fone bluetooth JBL com até 40h de bateria.",
        category: ["Fones de Ouvido", "Gadgets"],
        price: 44.99,
        image: "/uploads/fone_jbl.jpg",
        inStock: true,
        featured: false,
        attributes: [
            { name: "Cor", options: ["Preto", "Branco", "Azul"] }
        ]
    },
    {
        name: "Camisa Manchester United Retrô 1999",
        description: "Réplica da lendária camisa do United da final da Champions 1999.",
        category: ["Camisas Retrô", "Edição Limitada"],
        price: 94.99,
        originalPrice: 120.00,
        image: "/uploads/united_retro.jpg",
        inStock: true,
        onSale: true,
        featured: true,
        attributes: [
            { name: "Tamanho", options: ["M", "L", "XL"] }
        ]
    },
    {
        name: "Calção Nike Dry-FIT",
        description: "Calção esportivo Nike com tecnologia Dry-FIT.",
        category: ["Treino & Academia", "Calções & Shorts"],
        price: 34.99,
        image: "/uploads/calção_nike.jpg",
        inStock: true,
        featured: false,
        attributes: [
            { name: "Tamanho", options: ["S", "M", "L", "XL"] },
            { name: "Cor", options: ["Preto", "Azul", "Vermelho"] }
        ]
    },
    {
        name: "Smartwatch Xiaomi Band 7",
        description: "Smartwatch Xiaomi com monitor cardíaco e GPS.",
        category: ["Gadgets", "Novidades"],
        price: 59.99,
        image: "/uploads/xiaomi_band.jpg",
        inStock: true,
        featured: false,
        attributes: [
            { name: "Cor da Pulseira", options: ["Preto", "Azul", "Rosa"] }
        ]
    },
    {
        name: "Camisa Infantil Barcelona 2024",
        description: "Camisa oficial do Barcelona tamanho infantil.",
        category: ["Crianças", "Camisas de Equipas"],
        price: 49.99,
        image: "/uploads/barcelona_kids.jpg",
        inStock: true,
        featured: false,
        attributes: [
            { name: "Tamanho", options: ["4 anos", "6 anos", "8 anos", "10 anos", "12 anos"] }
        ]
    },
    {
        name: "Camiseta Oversized Streetwear",
        description: "Camiseta oversized 100% algodão estilo street.",
        category: ["Streetwear", "Casual"],
        price: 29.99,
        image: "/uploads/oversized_street.jpg",
        inStock: true,
        featured: false,
        attributes: [
            { name: "Tamanho", options: ["M", "L", "XL"] },
            { name: "Cor", options: ["Preto", "Branco", "Bege"] },
            { name: "Estampa", options: ["Logo", "Grafite", "Minimalista"] }
        ]
    },
    {
        name: "Garrafa Térmica Stanley 1L",
        description: "Garrafa térmica Stanley mantém temperatura por 24h.",
        category: ["Acessórios"],
        price: 64.99,
        image: "/uploads/stanley_bottle.jpg",
        inStock: true,
        featured: false,
        attributes: [
            { name: "Cor", options: ["Verde", "Preto", "Rosa", "Azul"] },
            { name: "Capacidade", options: ["750ml", "1L", "1.5L"] }
        ]
    },
    {
        name: "Pod System Vaporesso XROS 3",
        description: "Pod system recarregável com bateria 1000mAh.",
        category: ["Vapes & Cigarros Eletrônicos"],
        price: 34.99,
        image: "/uploads/vaporesso_xros.jpg",
        inStock: true,
        featured: false,
        attributes: [
            { name: "Cor", options: ["Preto", "Prata", "Azul"] },
            { name: "Resistência", options: ["0.6Ω", "0.8Ω", "1.2Ω"] }
        ]
    }
];

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/camisashop')
    .then(async () => {
        console.log('✅ MongoDB conectado para restauro');

        // 1. Apagar os produtos existentes (o lixo)
        await Product.deleteMany({});
        console.log('🗑️ Produtos antigos apagados');

        // 2. Definir as contas dos colaboradores corretamente
        const vipUser = await User.findOneAndUpdate(
            { email: 'sharing@gmail.com' },
            { 
                $set: { 
                    role: 'vendor',
                    vendorInfo: {
                        storeName: "Loja VIP 10 Anos",
                        storeDescription: "Loja Parceira VIP",
                        plan: "vip",
                        expiresAt: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000), // + 10 years
                        balance: 0,
                        isActive: true
                    }
                } 
            },
            { new: true }
        );
        console.log('✅ VIP 10 Anos (sharing@gmail.com) atualizado');

        const freeUser = await User.findOneAndUpdate(
            { email: 'colaborador@gmail.com' },
            { 
                $set: { 
                    role: 'vendor',
                    vendorInfo: {
                        storeName: "Loja Parceira Gratis",
                        storeDescription: "Loja Parceira Free",
                        plan: "free",
                        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // + 14 dias
                        balance: 0,
                        isActive: true
                    }
                } 
            },
            { new: true }
        );
        console.log('✅ Colaborador Gratis (colaborador@gmail.com) atualizado');

        const adminUser = await User.findOne({ role: 'admin' });

        // 3. Atribuir os produtos às lojas e inseri-los
        const productsToInsert = sampleProducts.map((p, index) => {
            let shop = adminUser;
            let shopName = "Loja Principal";

            if (index % 3 === 1 && vipUser) {
                shop = vipUser;
                shopName = vipUser.vendorInfo.storeName;
            } else if (index % 3 === 2 && freeUser) {
                shop = freeUser;
                shopName = freeUser.vendorInfo.storeName;
            }

            return {
                ...p,
                image: "http://localhost:5000" + p.image, // Ensure full URLs
                shopId: shop ? shop._id : null,
                shopName: shopName
            };
        });

        const inserted = await Product.insertMany(productsToInsert);
        console.log(`✅ ${inserted.length} produtos originais inseridos!`);
        
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Erro no script de restauro:', err);
        process.exit(1);
    });
