const axios = require('axios');

async function testSearchAPI() {
    try {
        console.log('🔍 Testing search API endpoint...');
        
        // Test 1: Search with Electronics category and "sams" (should find Samsung in Mobile subcategory)
        console.log('\n📱 Test 1: Electronics category + sams');
        const response1 = await axios.get('http://localhost:5001/api/products/search-test', {
            params: {
                categoryId: '68894012aa8db476fee173ac', // Electronics category
                searchQuery: 'sams'
            }
        });
        
        console.log('Response:', {
            success: response1.data.success,
            total: response1.data.total,
            products: response1.data.products.map(p => ({
                brand: p.brand,
                model: p.model_number,
                serial: p.serial_number,
                mrp: p.mrp,
                dealer_price: p.dealer_price,
                stock: p.currentStock,
                condition: p.condition
            }))
        });
        
    } catch (error) {
        if (error.response) {
            console.error('❌ API Error:', error.response.status, error.response.data);
        } else {
            console.error('❌ Request Error:', error.message);
        }
    }
}

testSearchAPI();
