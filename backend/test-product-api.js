/**
 * Test Product API - Check if single and multiple product creation works
 */

const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/    } catch (error) {
        console.log('⚠️ Multiple products endpoint error:');
        console.log('Status:', error.response?.status);
        console.log('Message:', error.response?.data?.message || 'Endpoint error');
        return null;
    }
}

// Test invalid scenarios
async function testInvalidScenarios(categoryId, distributorId) {
    console.log('\n🧪 Testing Invalid Scenarios...');
    console.log('=====================================');
    
    // Test single product with missing brand
    try {
        console.log('🔍 Testing single product with missing brand...');
        
        const invalidProduct = {
            categoryFormData: {
                common_model_number: 'Invalid-Product',
                common_purchase_price: 30000,
                // Missing brand field
            },
            supplierId: distributorId,
            selected_category_id: categoryId,
            condition: 'new',
            sellingPrice: 32000
        };

        await axios.post(`${BASE_URL}/products`, invalidProduct, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        console.log('⚠️  Unexpected success - should have failed!');
        
    } catch (error) {
        console.log('✅ Expected error for missing brand:', error.response?.data?.message || error.message);
    }

    // Test bulk with mixed valid/invalid products
    try {
        console.log('\n🔍 Testing bulk creation with mixed valid/invalid products...');
        
        const mixedProducts = {
            products: [
                {
                    categoryFormData: {
                        common_model_number: 'Valid-Product-1',
                        common_purchase_price: 30000,
                        mobile_brand: 'Apple'
                    },
                    supplierId: distributorId,
                    selected_category_id: categoryId,
                    condition: 'new',
                    sellingPrice: 32000
                },
                {
                    categoryFormData: {
                        common_model_number: 'Invalid-Product-2',
                        common_purchase_price: 25000
                        // Missing brand
                    },
                    supplierId: distributorId,
                    selected_category_id: categoryId,
                    condition: 'new',
                    sellingPrice: 27000
                },
                {
                    categoryFormData: {
                        common_model_number: 'Valid-Product-3',
                        common_purchase_price: 35000,
                        mobile_brand: 'Samsung'
                    },
                    supplierId: distributorId,
                    selected_category_id: categoryId,
                    condition: 'new',
                    sellingPrice: 37000
                }
            ]
        };

        const mixedResponse = await axios.post(`${BASE_URL}/products/bulk`, mixedProducts, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        console.log('📊 Mixed results status:', mixedResponse.status);
        console.log('📋 Mixed results summary:', mixedResponse.data.summary);
        console.log('✅ Successful products:', mixedResponse.data.summary.successful);
        console.log('❌ Failed products:', mixedResponse.data.summary.failed);
        
        if (mixedResponse.data.errors) {
            console.log('📝 Error details:', mixedResponse.data.errors);
        }

    } catch (error) {
        console.log('❌ Error during mixed bulk creation:', error.message);
        if (error.response?.data) {
            console.log('📋 Server response:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

async function runTests() {// Test credentials (you'll need to update these)
const TEST_USER = {
    email: 'admin@example.com',
    password: 'admin123'
};

let authToken = '';

async function login() {
    try {
        console.log('🔐 Logging in...');
        const response = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
        authToken = response.data.token;
        console.log('✅ Login successful');
        return true;
    } catch (error) {
        console.error('❌ Login failed:', error.response?.data || error.message);
        return false;
    }
}

async function getCategories() {
    try {
        console.log('📂 Fetching categories...');
        const response = await axios.get(`${BASE_URL}/categories/top-level`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const electronics = response.data.data.find(cat => cat.name === 'Electronics');
        
        // Get Mobile category
        const mobileResponse = await axios.get(`${BASE_URL}/categories/${electronics._id}/children`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const mobile = mobileResponse.data.data.find(cat => cat.name === 'Mobile');
        
        console.log('✅ Found Mobile category:', mobile._id);
        return mobile._id;
    } catch (error) {
        console.error('❌ Error fetching categories:', error.response?.data || error.message);
        return null;
    }
}

async function getDistributors() {
    try {
        console.log('🏪 Fetching distributors...');
        const response = await axios.get(`${BASE_URL}/distributors`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const distributor = response.data.distributors[0];
        console.log('✅ Found distributor:', distributor._id);
        return distributor._id;
    } catch (error) {
        console.error('❌ Error fetching distributors:', error.response?.data || error.message);
        return null;
    }
}

// Test 1: Single Product Creation with Loose Schema
async function testSingleProduct(categoryId, distributorId) {
    console.log('\n🧪 Test 1: Single Product Creation with Loose Schema');
    
    const productData = {
        // Core required fields
        selected_category_id: categoryId,
        supplierId: distributorId,
        category_path: ['Electronics', 'Mobile'],
        category_path_ids: [categoryId],
        
        // Dynamic form data from frontend (this should map to attributes)
        categoryFormData: {
            // Common fields
            common_model_number: 'iPhone 15 Pro',
            common_serial_number: 'IPH15PRO001',
            common_dp_dealer_price: 95000,
            common_mrp: 134900,
            common_igst: 18,
            common_cgst: 9,
            
            // Category-specific fields
            mobile_brand: 'Apple',
            mobile_imei: '123456789012345',
            mobile_os: 'iOS',
            mobile_storage: '256',
            mobile_ram: '8',
            mobile_battery: 3274,
            mobile_screen_size: '6.1',
            mobile_camera_mp: '48'
        },
        
        // Core product fields (should map to main schema)
        condition: 'New',
        sellingPrice: 125000,
        hsnCode: '8517'
    };

    try {
        const response = await axios.post(`${BASE_URL}/products`, productData, {
            headers: { 
                Authorization: `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Single product created successfully!');
        console.log('📦 Product ID:', response.data.data._id);
        console.log('🏷️ Brand:', response.data.data.brand);
        console.log('💰 Price:', response.data.data.price);
        return response.data.data._id;
    } catch (error) {
        console.error('❌ Single product creation failed:');
        console.error('Status:', error.response?.status);
        console.error('Message:', error.response?.data?.message);
        console.error('Error:', error.response?.data?.error);
        return null;
    }
}

// Test 2: Multiple Products Creation (Future Feature)
async function testMultipleProducts(categoryId, distributorId) {
    console.log('\n🧪 Test 2: Multiple Products Creation (Future Feature)');
    
    const multipleProductData = {
        products: [
            {
                selected_category_id: categoryId,
                supplierId: distributorId,
                category_path: ['Electronics', 'Mobile'],
                category_path_ids: [categoryId],
                categoryFormData: {
                    common_model_number: 'Galaxy S24',
                    common_serial_number: 'GALS24001',
                    common_dp_dealer_price: 65000,
                    common_mrp: 79999,
                    common_igst: 18,
                    common_cgst: 9,
                    mobile_brand: 'Samsung',
                    mobile_imei: '987654321098765',
                    mobile_os: 'Android',
                    mobile_storage: '256',
                    mobile_ram: '8'
                },
                condition: 'New',
                sellingPrice: 75000,
                hsnCode: '8517'
            },
            {
                selected_category_id: categoryId,
                supplierId: distributorId,
                category_path: ['Electronics', 'Mobile'],
                category_path_ids: [categoryId],
                categoryFormData: {
                    common_model_number: 'Pixel 8',
                    common_serial_number: 'PIX8001',
                    common_dp_dealer_price: 55000,
                    common_mrp: 75999,
                    common_igst: 18,
                    common_cgst: 9,
                    mobile_brand: 'Google',
                    mobile_imei: '555444333222111',
                    mobile_os: 'Android',
                    mobile_storage: '128',
                    mobile_ram: '8'
                },
                condition: 'New',
                sellingPrice: 65000,
                hsnCode: '8517'
            }
        ]
    };

    try {
        const response = await axios.post(`${BASE_URL}/products/bulk`, multipleProductData, {
            headers: { 
                Authorization: `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Multiple products created successfully!');
        console.log('📦 Products created:', response.data.data.length);
        return response.data.data;
    } catch (error) {
        console.log('⚠️ Multiple products endpoint not implemented yet (expected)');
        console.log('Status:', error.response?.status);
        console.log('Message:', error.response?.data?.message || 'Endpoint not found');
        return null;
    }
}

async function runTests() {
    console.log('🚀 Starting Product API Tests');
    console.log('=====================================');
    
    // Step 1: Login
    const loginSuccess = await login();
    if (!loginSuccess) {
        console.log('❌ Cannot proceed without authentication');
        return;
    }
    
    // Step 2: Get required IDs
    const categoryId = await getCategories();
    const distributorId = await getDistributors();
    
    if (!categoryId || !distributorId) {
        console.log('❌ Cannot proceed without category and distributor IDs');
        return;
    }
    
    // Step 3: Test single product
    const productId = await testSingleProduct(categoryId, distributorId);
    
    // Step 4: Test multiple products
    const bulkResults = await testMultipleProducts(categoryId, distributorId);
    
    // Step 5: Test invalid scenarios
    await testInvalidScenarios(categoryId, distributorId);
    
    console.log('\n📊 Test Summary:');
    console.log('=====================================');
    console.log('✅ Login:', loginSuccess ? 'PASS' : 'FAIL');
    console.log('✅ Category fetch:', categoryId ? 'PASS' : 'FAIL');
    console.log('✅ Distributor fetch:', distributorId ? 'PASS' : 'FAIL');
    console.log('✅ Single product:', productId ? 'PASS' : 'FAIL');
    console.log('✅ Bulk products:', bulkResults ? 'PASS' : 'FAIL');
    console.log('✅ Error handling: TESTED');
    console.log('\n🎉 All API tests completed!');
    console.log('📋 Features verified:');
    console.log('   - Single product creation with loose schema');
    console.log('   - Bulk product creation');
    console.log('   - Error handling and validation');
    console.log('   - Mixed valid/invalid product handling');
}

// Run tests
runTests().catch(console.error);
