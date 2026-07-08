const http = require('http');

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data: JSON.parse(data || '{}') }));
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function test() {
  try {
    // 1. Get products
    const pRes = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/products', method: 'GET' });
    const products = pRes.data;
    console.log("Products count:", products.length);
    
    if (products.length > 0) {
      const pId = products[0]._id;
      console.log("Testing RelatedProducts for:", products[0].name, pId);
      const rRes = await makeRequest({ hostname: 'localhost', port: 5000, path: `/api/products/${pId}/related`, method: 'GET' });
      console.log("Related Status:", rRes.statusCode);
      console.log("Related Data:", Array.isArray(rRes.data) ? `Array length ${rRes.data.length}` : rRes.data);
    }
    
    // 2. Test login with a non-existent user to see the exact error
    console.log("Testing Login...");
    const postData = JSON.stringify({ login: 'test@test.com', password: 'password' });
    const lRes = await makeRequest({
      hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
    }, postData);
    console.log("Login Status:", lRes.statusCode);
    console.log("Login Data:", lRes.data);
    
  } catch (e) {
    console.error("Test script failed:", e.message);
  }
}

test();
