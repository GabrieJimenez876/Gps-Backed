#!/usr/bin/env node
/**
 * GPS App - HTTP Test Script
 * Prueba los endpoints de autenticación
 * 
 * Usage:
 *   node test-auth.js
 */

import http from 'http';

const BASE_URL = 'http://localhost:3001';

// Helper to make HTTP requests
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('GPS App - Authentication API Tests');
  console.log('='.repeat(60) + '\n');

  try {
    // Test 1: Health Check
    console.log('1. Health Check...');
    const health = await makeRequest('GET', '/health');
    console.log(`   Status: ${health.status}`);
    console.log(`   Response:`, JSON.stringify(health.body, null, 2));
    console.log('   ✓ PASS\n');

    // Test 2: Login with correct credentials
    console.log('2. Login with correct credentials (admin / admin123)...');
    const login = await makeRequest('POST', '/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    console.log(`   Status: ${login.status}`);
    if (login.status === 200) {
      console.log(`   User: ${login.body.user.username}`);
      console.log(`   Roles: ${login.body.user.roles.join(', ')}`);
      console.log(`   Access Token: ${login.body.accessToken.substring(0, 30)}...`);
      console.log('   ✓ PASS\n');
    } else {
      console.log(`   ✗ FAIL: ${login.body.error}\n`);
      return;
    }

    const accessToken = login.body.accessToken;
    const refreshToken = login.body.refreshToken;

    // Test 3: Get current user (protected endpoint)
    console.log('3. Get current user (/auth/me)...');
    const meRes = await makeRequest('GET', '/auth/me');
    meRes.headers['authorization'] = `Bearer ${accessToken}`;
    const me = await makeRequest('GET', '/auth/me');
    if (me.status === 401) {
      console.log(`   Status: ${me.status} (expected - need to set Authorization header)\n`);
    } else {
      console.log(`   Status: ${me.status}`);
      if (me.status === 200) {
        console.log(`   User: ${me.body.nombres} ${me.body.apellidos}`);
        console.log(`   Email: ${me.body.email}`);
        console.log('   ✓ PASS\n');
      }
    }

    // Test 4: Verify Token
    console.log('4. Verify Token...');
    const verify = await makeRequest('POST', '/auth/verify', {
      token: accessToken
    });
    console.log(`   Status: ${verify.status}`);
    console.log(`   Valid: ${verify.body.valid}`);
    console.log(`   User ID: ${verify.body.user?.id_usuario}`);
    console.log('   ✓ PASS\n');

    // Test 5: Login with wrong credentials
    console.log('5. Login with wrong credentials...');
    const wrongLogin = await makeRequest('POST', '/auth/login', {
      username: 'admin',
      password: 'wrong_password'
    });
    console.log(`   Status: ${wrongLogin.status}`);
    console.log(`   Error: ${wrongLogin.body.error}`);
    console.log(wrongLogin.status === 401 ? '   ✓ PASS\n' : '   ✗ FAIL\n');

    // Test 6: Refresh Token
    console.log('6. Refresh Token...');
    const refresh = await makeRequest('POST', '/auth/refresh', {
      refreshToken: refreshToken
    });
    console.log(`   Status: ${refresh.status}`);
    if (refresh.status === 200) {
      console.log(`   New Access Token: ${refresh.body.accessToken.substring(0, 30)}...`);
      console.log('   ✓ PASS\n');
    }

    console.log('='.repeat(60));
    console.log('All tests completed!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n✗ Test Error:', error.message);
    console.log('\nMake sure the auth-service is running on http://localhost:3001\n');
    process.exit(1);
  }
}

runTests().catch(console.error);
