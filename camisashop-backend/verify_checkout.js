const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000/api';
// Use the user created in the previous step or create a new one
const TEST_USER = {
    name: "Checkout Test User",
    email: `checkout_${Date.now()}@example.com`,
    password: "password123"
};

async function runTest() {
    console.log("--- STARTING CHECKOUT VERIFICATION ---");

    // 1. Register/Login
    console.log("\n1. Registering user...");
    let res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(TEST_USER)
    });
    let data = await res.json();
    if (!res.ok) {
        console.error("Registration failed:", data);
        return;
    }
    const token = data.token;
    const userId = data.userId;
    console.log("User registered:", data.email);

    // 2. Get a Product to buy
    console.log("\n2. Fetching products...");
    res = await fetch(`${BASE_URL}/products`);
    const products = await res.json();
    if (products.length === 0) {
        console.error("No products found to buy.");
        return;
    }
    const product = products[0];
    console.log("Selected product:", product.name, product._id);

    // 3. Create Order
    console.log("\n3. Creating Order...");
    const orderData = {
        items: [{
            productId: product._id,
            name: product.name,
            price: product.price,
            quantity: 1,
            size: "M"
        }],
        shippingAddress: {
            line1: "123 Checkout St",
            city: "Shop City",
            country: "BuyLand",
            postalCode: "12345"
        },
        paymentMethod: "simulado",
        itemsPrice: product.price,
        shippingPrice: 5,
        taxPrice: 0,
        totalPrice: product.price + 5
    };

    res = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
    });
    data = await res.json();

    if (res.ok) {
        console.log("SUCCESS: Order created!", data._id);
    } else {
        console.error("FAILURE: Order creation failed.", data);
    }

    console.log("\n--- TEST COMPLETE ---");
}

runTest();
