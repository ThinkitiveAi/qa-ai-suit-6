import { test, expect } from '@playwright/test';
const { request: playwrightRequest } = require('playwright');

const BASE_URL = 'https://api.qa.practiceeasily.com/api/';
const LOGIN_BODY = {
  email: "bhavna.adhav+13@thinkitive.com",
  password: "Pass@123"
};

test.describe('Debug Clinician API Tests', () => {

  // Test 1: Basic connectivity test
  test('1. Basic API Connectivity Test', async () => {
    try {
      console.log('🌐 Testing basic API connectivity...');
      console.log(`🔗 Base URL: ${BASE_URL}`);
      
      const context = await playwrightRequest.newContext({ baseURL: BASE_URL });
      
      // Try a simple request to see if API is accessible
      const response = await context.post('master/login', {
        data: LOGIN_BODY,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });
      
      console.log(`📡 Response Status: ${response.status()}`);
      console.log(`📡 Response Headers:`, response.headers());
      console.log(`📡 Response URL: ${response.url()}`);
      
      if (response.status() === 200) {
        const data = await response.json();
        console.log('✅ API is accessible');
        console.log('📋 Response Data:', JSON.stringify(data, null, 2));
      } else {
        const errorText = await response.text();
        console.log('❌ API returned error');
        console.log('📋 Error Response:', errorText);
      }
      
      await context.dispose();
    } catch (error) {
      console.error('❌ Basic connectivity test failed:', error);
      throw error;
    }
  });

  // Test 2: Login test with detailed debugging
  test('2. Login Test with Detailed Debugging', async () => {
    try {
      console.log('🔐 Testing login with detailed debugging...');
      
      const context = await playwrightRequest.newContext({ 
        baseURL: BASE_URL,
        ignoreHTTPSErrors: true // Add this to ignore SSL issues
      });
      
      console.log('📤 Sending login request...');
      console.log('📋 Login Body:', JSON.stringify(LOGIN_BODY, null, 2));
      
      const loginResponse = await context.post('master/login', {
        data: LOGIN_BODY,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });
      
      console.log(`📡 Login Status: ${loginResponse.status()}`);
      console.log(`📡 Login Headers:`, loginResponse.headers());
      
      if (loginResponse.status() === 200) {
        const loginData = await loginResponse.json();
        console.log('✅ Login successful');
        console.log('📋 Login Response:', JSON.stringify(loginData, null, 2));
        
        // Try different token extraction methods
        const tokenPaths = [
          'data.access_token',
          'accessToken', 
          'access_token',
          'token',
          'data.token',
          'data.accessToken'
        ];
        
        let token = null;
        for (const path of tokenPaths) {
          const pathParts = path.split('.');
          let current = loginData;
          
          for (const part of pathParts) {
            if (current && current[part]) {
              current = current[part];
            } else {
              current = null;
              break;
            }
          }
          
          if (current && typeof current === 'string') {
            token = current;
            console.log(`✅ Found token at path: ${path}`);
            console.log(`🔑 Token: ${token.substring(0, 50)}...`);
            break;
          }
        }
        
        if (!token) {
          console.log('❌ No token found in response');
          console.log('🔍 Available keys:', Object.keys(loginData));
          if (loginData.data) {
            console.log('🔍 Available data keys:', Object.keys(loginData.data));
          }
        }
        
        expect(token).toBeDefined();
        
      } else {
        const errorText = await loginResponse.text();
        console.log('❌ Login failed');
        console.log('📋 Error Response:', errorText);
        throw new Error(`Login failed with status ${loginResponse.status()}: ${errorText}`);
      }
      
      await context.dispose();
    } catch (error) {
      console.error('❌ Login test failed:', error);
      throw error;
    }
  });

  // Test 3: Full authentication test
  test('3. Full Authentication Test', async () => {
    try {
      console.log('🔐 Testing full authentication flow...');
      
      // Step 1: Login
      const loginContext = await playwrightRequest.newContext({ 
        baseURL: BASE_URL,
        ignoreHTTPSErrors: true
      });
      
      const loginResponse = await loginContext.post('master/login', {
        data: LOGIN_BODY,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });
      
      expect(loginResponse.status()).toBe(200);
      const loginData = await loginResponse.json();
      
      const accessToken = 
        loginData.data?.access_token ||
        loginData.accessToken ||
        loginData.access_token ||
        loginData.token;
      
      expect(accessToken).toBeDefined();
      console.log(`✅ Login successful. Token: ${accessToken.substring(0, 50)}...`);
      
      // Step 2: Create authenticated context
      console.log('🔧 Creating authenticated context...');
      const apiContext = await playwrightRequest.newContext({
        baseURL: BASE_URL,
        extraHTTPHeaders: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        ignoreHTTPSErrors: true
      });
      
      // Step 3: Test authenticated request
      console.log('🧪 Testing authenticated request...');
      
      // Try different endpoints to see which one works
      const testEndpoints = [
        'master/clinician?page=0&size=10',
        'master/clinician',
        'clinician?page=0&size=10',
        'clinician'
      ];
      
      for (const endpoint of testEndpoints) {
        try {
          console.log(`🔍 Testing endpoint: ${endpoint}`);
          const testResponse = await apiContext.get(endpoint);
          console.log(`📡 Status: ${testResponse.status()}`);
          
          if (testResponse.status() === 200) {
            const testData = await testResponse.json();
            console.log(`✅ Endpoint ${endpoint} works!`);
            console.log('📋 Response:', JSON.stringify(testData, null, 2));
            break;
          } else {
            const errorText = await testResponse.text();
            console.log(`❌ Endpoint ${endpoint} failed: ${errorText}`);
          }
        } catch (error) {
          console.log(`❌ Endpoint ${endpoint} error:`, error);
        }
      }
      
      await loginContext.dispose();
      await apiContext.dispose();
      
    } catch (error) {
      console.error('❌ Authentication test failed:', error);
      throw error;
    }
  });

  // Test 4: Simple add clinician test
  test('4. Simple Add Clinician Test', async () => {
    try {
      console.log('👨‍⚕️ Testing simple add clinician...');
      
      // Login
      const loginContext = await playwrightRequest.newContext({ 
        baseURL: BASE_URL,
        ignoreHTTPSErrors: true
      });
      
      const loginResponse = await loginContext.post('master/login', {
        data: LOGIN_BODY,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });
      
      expect(loginResponse.status()).toBe(200);
      const loginData = await loginResponse.json();
      const accessToken = 
        loginData.data?.access_token ||
        loginData.accessToken ||
        loginData.access_token ||
        loginData.token;
      
      expect(accessToken).toBeDefined();
      console.log(`✅ Login successful`);
      
      // Create authenticated context
      const apiContext = await playwrightRequest.newContext({
        baseURL: BASE_URL,
        extraHTTPHeaders: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        ignoreHTTPSErrors: true
      });
      
      // Generate unique data
      const timestamp = Date.now();
      const uniqueData = {
        email: `test${timestamp}@mailinator.com`,
        phone: `+1234567${timestamp.toString().slice(-4)}`,
        npi: `12345678${timestamp.toString().slice(-2)}`
      };
      
      // Minimal clinician data
      const clinicianData = {
        firstName: "Test",
        lastName: "User",
        emailId: uniqueData.email,
        contactNumber: uniqueData.phone,
        npiNumber: uniqueData.npi,
        locationUuids: ["ed27ea30-fdfd-428c-8be5-47fb83cdf050"],
        languagesSpoken: ["English"],
        supervisorClinicianId: "f73a9b5b-4036-4ec5-b0ff-5fc400f32c31",
        roles: ["PSYCHOTHERAPIST"],
        email: uniqueData.email
      };
      
      console.log('📤 Sending add clinician request...');
      console.log('📋 Clinician Data:', JSON.stringify(clinicianData, null, 2));
      
      const addResponse = await apiContext.post('master/clinician', {
        data: clinicianData
      });
      
      console.log(`📡 Add Status: ${addResponse.status()}`);
      console.log(`📡 Add Headers:`, addResponse.headers());
      
      if (addResponse.status() === 200 || addResponse.status() === 201) {
        const addData = await addResponse.json();
        console.log('✅ Add clinician successful');
        console.log('📋 Add Response:', JSON.stringify(addData, null, 2));
        
        // Try to extract ID
        const clinicianId = 
          addData.data?.uuid ||
          addData.data?.id ||
          addData.uuid ||
          addData.id;
        
        if (clinicianId) {
          console.log(`🆔 Clinician ID: ${clinicianId}`);
        } else {
          console.log('❌ Could not extract clinician ID');
          console.log('🔍 Available keys:', Object.keys(addData));
          if (addData.data) {
            console.log('🔍 Available data keys:', Object.keys(addData.data));
          }
        }
        
      } else {
        const errorText = await addResponse.text();
        console.log('❌ Add clinician failed');
        console.log('📋 Error Response:', errorText);
      }
      
      await loginContext.dispose();
      await apiContext.dispose();
      
    } catch (error) {
      console.error('❌ Add clinician test failed:', error);
      throw error;
    }
  });

  // Test 5: Network and SSL test
  test('5. Network and SSL Test', async () => {
    try {
      console.log('🌐 Testing network and SSL...');
      
      // Test with different configurations
      const configs = [
        { ignoreHTTPSErrors: false, name: 'Standard SSL' },
        { ignoreHTTPSErrors: true, name: 'Ignore SSL Errors' }
      ];
      
      for (const config of configs) {
        console.log(`\n🧪 Testing with ${config.name}...`);
        
        try {
          const context = await playwrightRequest.newContext({
            baseURL: BASE_URL,
            ignoreHTTPSErrors: config.ignoreHTTPSErrors
          });
          
          const response = await context.post('master/login', {
            data: LOGIN_BODY,
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
          });
          
          console.log(`📡 ${config.name} Status: ${response.status()}`);
          
          if (response.status() === 200) {
            console.log(`✅ ${config.name} works!`);
          } else {
            const errorText = await response.text();
            console.log(`❌ ${config.name} failed: ${errorText}`);
          }
          
          await context.dispose();
          
        } catch (error) {
          console.log(`❌ ${config.name} error:`, error);
        }
      }
      
    } catch (error) {
      console.error('❌ Network test failed:', error);
      throw error;
    }
  });

  // Test 6: Environment check
  test('6. Environment Check', async () => {
    console.log('🔍 Environment Information:');
    console.log(`📍 Base URL: ${BASE_URL}`);
    console.log(`📧 Login Email: ${LOGIN_BODY.email}`);
    console.log(`🔒 Password: ${LOGIN_BODY.password.substring(0, 4)}...`);
    console.log(`🌐 Node.js Version: ${process.version}`);
    console.log(`📅 Current Time: ${new Date().toISOString()}`);
    
    // Test URL parsing
    try {
      const url = new URL(BASE_URL);
      console.log(`✅ URL is valid`);
      console.log(`🔗 Protocol: ${url.protocol}`);
      console.log(`🔗 Host: ${url.host}`);
      console.log(`🔗 Pathname: ${url.pathname}`);
    } catch (error) {
      console.log(`❌ URL parsing failed:`, error);
    }
  });

});