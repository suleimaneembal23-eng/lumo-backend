const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000/api';
const TEST_USER = {
    name: "Test Profile User",
    email: `testprofile_${Date.now()}@example.com`,
    password: "password123"
};

async function runTest() {
    console.log("--- STARTING BACKEND VERIFICATION ---");

    // 1. Register
    console.log("\n1. Registering new user...");
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
    console.log("Registration response data:", data);
    if (!data.email) {
        console.error("Email missing in response");
        return;
    }
    console.log("User registered:", data.email);
    const token = data.token;
    const userId = data.userId;

    // 2. Update Profile (Address)
    console.log("\n2. Updating Profile (Address)...");
    const updateData = {
        name: "Updated Name",
        addressLine1: "123 Test St",
        city: "Test City",
        country: "Test Country"
    };
    res = await fetch(`${BASE_URL}/clients/${userId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
    });
    data = await res.json();
    if (!res.ok) {
        console.error("Update failed:", data);
    } else {
        console.log("Update response:", data.address);
        if (data.address && data.address.line1 === "123 Test St") {
            console.log("SUCCESS: Address updated correctly.");
        } else {
            console.error("FAILURE: Address mismatch.");
        }
    }

    // 3. Change Password
    console.log("\n3. Changing Password...");
    const passwordData = {
        currentPassword: "password123",
        newPassword: "newpassword456"
    };
    res = await fetch(`${BASE_URL}/clients/${userId}/change-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(passwordData)
    });
    data = await res.json();
    if (!res.ok) {
        console.error("Password change failed:", data);
    } else {
        console.log("Password change response:", data);
    }

    // 4. Login with New Password
    console.log("\n4. Verifying Login with New Password...");
    res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: TEST_USER.email,
            password: "newpassword456"
        })
    });
    data = await res.json();
    if (res.ok) {
        console.log("SUCCESS: Login with new password worked.");
    } else {
        console.error("FAILURE: Login with new password failed:", data);
    }

    console.log("\n--- TEST COMPLETE ---");
}

runTest();
