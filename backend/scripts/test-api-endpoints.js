const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5001/api';

/**
 * Script to test all API endpoints
 */
async function testAPIEndpoints() {
    console.log('🧪 Testing Vinod Electronics API Endpoints\n');
    
    try {
        // 1. Test Health Check
        console.log('1️⃣ Testing Health Check...');
        const healthResponse = await axios.get('http://localhost:5001/health');
        console.log('✅ Health Check:', healthResponse.data.status);
        console.log('   Uptime:', Math.round(healthResponse.data.uptime), 'seconds\n');

        // 2. Test Customer Creation
        console.log('2️⃣ Testing Customer Creation...');
        const customerData = {
            name: 'Test Customer API',
            phone: '9999999999',
            address: {
                street: '123 Test Street',
                city: 'Test City',
                state: 'Test State',
                pincode: '123456'
            }
        };
        
        const customerResponse = await axios.post(`${BASE_URL}/customers`, customerData);
        const customerId = customerResponse.data._id;
        console.log('✅ Customer Created:', customerResponse.data.name);
        console.log('   Customer ID:', customerId, '\n');

        // 3. Test Get All Customers
        console.log('3️⃣ Testing Get All Customers...');
        const customersResponse = await axios.get(`${BASE_URL}/customers`);
        console.log('✅ Total Customers:', customersResponse.data.total);
        console.log('   Retrieved:', customersResponse.data.customers.length, 'customers\n');

        // 4. Test Sale Creation
        console.log('4️⃣ Testing Sale Creation...');
        const saleData = {
            customerId: customerId,
            items: [{
                inventoryId: null,
                productId: null,
                productName: 'Samsung 43" Smart TV',
                brand: 'Samsung',
                category: 'Television',
                serialNumber: 'SAM123456',
                sellingPrice: 45000,
                discount: 2000,
                finalPrice: 43000,
                gstAmount: 7740,
                totalAmount: 50740
            }],
            subtotal: 43000,
            totalGst: 7740,
            totalAmount: 50740,
            paymentType: 'Installment',
            paymentDetails: {
                downPayment: 10000,
                installmentMonths: 12,
                monthlyInstallment: 3395,
                totalInstallmentAmount: 40740,
                emiStartDate: new Date('2025-08-01')
            },
            salesPerson: 'API Test User'
        };

        const saleResponse = await axios.post(`${BASE_URL}/sales`, saleData);
        const saleId = saleResponse.data.data._id;
        console.log('✅ Sale Created:', saleResponse.data.data.saleNumber);
        console.log('   Sale ID:', saleId);
        console.log('   Total Amount: ₹', saleResponse.data.data.totalAmount, '\n');

        // 5. Test Installment Creation
        console.log('5️⃣ Testing Installment Creation...');
        const installmentData = {
            saleId: saleId,
            totalAmount: 50740,
            downPayment: 10000,
            installmentMonths: 12,
            emiStartDate: '2025-08-01'
        };

        const installmentResponse = await axios.post(`${BASE_URL}/installments/create-for-sale`, installmentData);
        console.log('✅ Installments Created:', installmentResponse.data.data.length);
        const firstInstallmentId = installmentResponse.data.data[0]._id;
        console.log('   First Installment ID:', firstInstallmentId);
        console.log('   Monthly Amount: ₹', installmentResponse.data.data[0].originalAmount, '\n');

        // 6. Test Get Sale with Installments
        console.log('6️⃣ Testing Get Sale Details...');
        const saleDetailsResponse = await axios.get(`${BASE_URL}/installments/sale/${saleId}`);
        console.log('✅ Sale Details Retrieved');
        console.log('   Customer:', saleDetailsResponse.data.data.sale.customerId.name);
        console.log('   Total Installments:', saleDetailsResponse.data.data.summary.totalInstallments);
        console.log('   Pending Installments:', saleDetailsResponse.data.data.summary.pendingInstallments, '\n');

        // 7. Test Payment Recording
        console.log('7️⃣ Testing Payment Recording...');
        const paymentData = {
            amount: 3395,
            paymentMethod: 'UPI',
            transactionId: 'API_TEST_12345',
            notes: 'API test payment'
        };

        const paymentResponse = await axios.post(`${BASE_URL}/installments/${firstInstallmentId}/payment`, paymentData);
        console.log('✅ Payment Recorded');
        console.log('   Installment Status:', paymentResponse.data.data.status);
        console.log('   Paid Amount: ₹', paymentResponse.data.data.paidAmount, '\n');

        // 8. Test Get Customer Installments
        console.log('8️⃣ Testing Get Customer Installments...');
        const customerInstallmentsResponse = await axios.get(`${BASE_URL}/installments/customer/${customerId}`);
        console.log('✅ Customer Installments Retrieved');
        console.log('   Total Installments:', customerInstallmentsResponse.data.pagination.total);
        console.log('   Page 1 Results:', customerInstallmentsResponse.data.data.length, '\n');

        // 9. Test Sales Statistics
        console.log('9️⃣ Testing Sales Dashboard Statistics...');
        const statsResponse = await axios.get(`${BASE_URL}/sales/stats/dashboard`);
        console.log('✅ Dashboard Stats Retrieved');
        console.log('   Today\'s Sales:', statsResponse.data.data.today.totalSales);
        console.log('   Today\'s Revenue: ₹', statsResponse.data.data.today.totalAmount);
        console.log('   Recent Sales Count:', statsResponse.data.data.recentSales.length, '\n');

        // 10. Test Get Overdue Installments
        console.log('🔟 Testing Get Overdue Installments...');
        const overdueResponse = await axios.get(`${BASE_URL}/installments/overdue`);
        console.log('✅ Overdue Installments Retrieved');
        console.log('   Overdue Count:', overdueResponse.data.data.length, '\n');

        // 11. Test Search Customers
        console.log('1️⃣1️⃣ Testing Customer Search...');
        const searchResponse = await axios.get(`${BASE_URL}/customers?search=Test`);
        console.log('✅ Customer Search Results');
        console.log('   Search Results:', searchResponse.data.customers.length, 'customers found\n');

        // 12. Test Get Customer Sales
        console.log('1️⃣2️⃣ Testing Get Customer Sales...');
        const customerSalesResponse = await axios.get(`${BASE_URL}/sales/customer/${customerId}`);
        console.log('✅ Customer Sales Retrieved');
        console.log('   Total Sales for Customer:', customerSalesResponse.data.data.pagination.total, '\n');

        console.log('🎉 All API tests completed successfully! 🎉');
        console.log('\n📊 Test Summary:');
        console.log('✅ Health Check - Working');
        console.log('✅ Customer Management - Working');
        console.log('✅ Sale Creation - Working');
        console.log('✅ Installment Management - Working');
        console.log('✅ Payment Processing - Working');
        console.log('✅ Search & Filtering - Working');
        console.log('✅ Statistics & Dashboard - Working');
        console.log('✅ Overdue Management - Working');

    } catch (error) {
        console.error('❌ API Test Failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

// Helper function to test specific endpoint
async function testEndpoint(method, url, data = null, description = '') {
    try {
        console.log(`Testing: ${description || method.toUpperCase()} ${url}`);
        
        let response;
        switch (method.toLowerCase()) {
            case 'get':
                response = await axios.get(url);
                break;
            case 'post':
                response = await axios.post(url, data);
                break;
            case 'put':
                response = await axios.put(url, data);
                break;
            case 'delete':
                response = await axios.delete(url);
                break;
            default:
                throw new Error('Unsupported HTTP method');
        }
        
        console.log('✅ Success:', response.status, response.statusText);
        return response.data;
    } catch (error) {
        console.error('❌ Failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
        throw error;
    }
}

// Run the tests if this file is executed directly
if (require.main === module) {
    testAPIEndpoints();
}

module.exports = { testAPIEndpoints, testEndpoint };
