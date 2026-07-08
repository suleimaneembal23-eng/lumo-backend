const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

// Conectar ao MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/camisashop')
    .then(() => console.log('✅ MongoDB conectado'))
    .catch(err => console.error('❌ Erro MongoDB:', err));

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

async function seedProducts() {
    try {
        console.log('🌱 Iniciando seed de produtos...');

        // Limpar produtos existentes (opcional)
        // await Product.deleteMany({});
        // console.log('🗑️  Produtos anteriores removidos');

        // Inserir novos produtos
        const inserted = await Product.insertMany(sampleProducts);
        console.log(`✅ ${inserted.length} produtos criados com sucesso!`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao criar produtos:', error);
        process.exit(1);
    }
}

seedProducts();
