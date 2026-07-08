const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Cart = require('./models/Cart');
const Product = require('./models/Product');
const User = require('./models/User');

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://admin:admin123@cluster0.mongodb.net/camisashop?retryWrites=true&w=majority");
        console.log("MongoDB Connected");
    } catch (err) {
        console.error("DB Connection Error:", err);
        process.exit(1);
    }
};

const checkCarts = async () => {
    await connectDB();

    console.log("\n--- CHECKING CARTS FOR BROKEN PRODUCTS ---\n");

    const carts = await Cart.find({});
    console.log(`Found ${carts.length} carts.`);

    for (const cart of carts) {
        const user = await User.findById(cart.userId);
        const userName = user ? user.name : "Unknown User";
        console.log(`\nChecking Cart for User: ${userName} (${cart.userId})`);

        if (cart.items.length === 0) {
            console.log("  - Empty Cart");
            continue;
        }

        for (const item of cart.items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                console.error(`  ❌ BROKEN LINK: Product ID ${item.productId} (Name in cart: ${item.name}) NOT FOUND in DB.`);
            } else {
                console.log(`  ✅ Valid: ${item.name} (ID: ${item.productId})`);
            }
        }
    }

    console.log("\n--- CHECK COMPLETE ---");
    process.exit();
};

checkCarts();
