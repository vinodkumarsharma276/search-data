const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const InstallmentService = require('../services/installmentService');
require('dotenv').config();

/**
 * Demonstration script showing how the Sale-Installment system works
 */
async function demonstrateInstallmentSystem() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vinod-electronics');
        console.log('📊 Connected to MongoDB');

        // 1. Create a sample customer
        const customer = new Customer({
            name: 'Rajesh Kumar',
            phone: '9876543210',
            address: {
                street: '123 MG Road',
                city: 'Delhi',
                state: 'Delhi',
                pincode: '110001'
            }
        });
        await customer.save();
        console.log('✅ Sample customer created:', customer.name);

        // 2. Create a sample sale with installment payment
        const sale = new Sale({
            customerId: customer._id,
            items: [{
                // You would have actual product/inventory IDs here
                inventoryId: new mongoose.Types.ObjectId(),
                productId: new mongoose.Types.ObjectId(),
                sellingPrice: 50000,
                discount: 2000,
                finalPrice: 48000,
                gstAmount: 8640,
                totalAmount: 56640
            }],
            subtotal: 48000,
            totalGst: 8640,
            totalAmount: 56640,
            paymentType: 'Installment',
            paymentDetails: {
                downPayment: 10000,
                installmentMonths: 12,
                monthlyInstallment: 4000,
                totalInstallmentAmount: 48000,
                emiStartDate: new Date('2025-08-01')
            },
            salesPerson: 'Vinod Sharma'
        });
        await sale.save();
        console.log('✅ Sample sale created:', sale.saleNumber);

        // 3. Create installments for this sale
        console.log('\n📅 Creating installments...');
        const installments = await InstallmentService.createInstallmentsForSale({
            saleId: sale._id,
            totalAmount: sale.totalAmount,
            downPayment: sale.paymentDetails.downPayment,
            installmentMonths: sale.paymentDetails.installmentMonths,
            emiStartDate: sale.paymentDetails.emiStartDate
        });
        
        console.log(`✅ Created ${installments.length} installments`);
        installments.forEach((inst, index) => {
            console.log(`   ${index + 1}. Due: ${inst.dueDate.toDateString()}, Amount: ₹${inst.originalAmount}`);
        });

        // 4. Simulate some time passing and get updated details
        console.log('\n📊 Getting installment details with current penalties...');
        
        // Get sale without populated references to avoid Product model error
        const saleWithoutRefs = await Sale.findById(sale._id).populate('customerId', 'name phone');
        const installmentsFromDB = await mongoose.model('Installment').find({ saleId: sale._id }).sort({ installmentNumber: 1 });
        
        // Calculate current penalties for each installment
        const installmentsWithPenalty = installmentsFromDB.map(installment => {
            const penaltyInfo = installment.calculateCurrentPenalty();
            return {
                ...installment.toObject(),
                currentPenalty: penaltyInfo
            };
        });
        
        // Calculate summary manually
        const summary = InstallmentService.calculateInstallmentSummary(installmentsWithPenalty);
        
        console.log('\n🏷️ Sale Details:');
        console.log(`   Customer: ${saleWithoutRefs.customerId.name}`);
        console.log(`   Sale Number: ${saleWithoutRefs.saleNumber}`);
        console.log(`   Total Amount: ₹${saleWithoutRefs.totalAmount}`);
        
        console.log('\n📋 Installment Summary:');
        console.log(`   Total Installments: ${summary.totalInstallments}`);
        console.log(`   Paid: ${summary.paidInstallments}`);
        console.log(`   Pending: ${summary.pendingInstallments}`);
        console.log(`   Overdue: ${summary.overdueInstallments}`);
        console.log(`   Total Original Amount: ₹${summary.totalOriginalAmount}`);
        console.log(`   Total Penalty: ₹${summary.totalPenalty}`);
        console.log(`   Next Due Date: ${summary.nextDueDate?.toDateString() || 'None'}`);
        console.log(`   Next Due Amount: ₹${summary.nextDueAmount}`);

        console.log('\n📑 Individual Installments:');
        installmentsWithPenalty.forEach((inst, index) => {
            console.log(`   ${index + 1}. Installment #${inst.installmentNumber}`);
            console.log(`      Due Date: ${inst.dueDate.toDateString()}`);
            console.log(`      Status: ${inst.status}`);
            console.log(`      Original Amount: ₹${inst.originalAmount}`);
            console.log(`      Paid Amount: ₹${inst.paidAmount}`);
            console.log(`      Remaining: ₹${inst.remainingAmount}`);
            console.log(`      Overdue Days: ${inst.currentPenalty.daysOverdue}`);
            console.log(`      Penalty: ₹${inst.currentPenalty.totalPenalty}`);
            console.log(`      Total Due: ₹${inst.totalAmountDue}`);
            console.log('      ---');
        });

        // 5. Simulate making a payment
        console.log('\n💰 Recording a payment for first installment...');
        const firstInstallment = installments[0];
        const updatedInstallment = await InstallmentService.recordPayment(firstInstallment._id, {
            amount: 4000,
            paymentMethod: 'UPI',
            transactionId: 'TXN123456789',
            notes: 'Paid via UPI'
        });
        
        console.log(`✅ Payment recorded for installment #${updatedInstallment.installmentNumber}`);
        console.log(`   Status: ${updatedInstallment.status}`);
        console.log(`   Paid Amount: ₹${updatedInstallment.paidAmount}`);
        console.log(`   Remaining: ₹${updatedInstallment.remainingAmount}`);

        // 6. Show overdue installments (simulate by creating overdue installment)
        console.log('\n⚠️ Getting overdue installments...');
        const overdueInstallments = await InstallmentService.getOverdueInstallments();
        console.log(`Found ${overdueInstallments.length} overdue installments`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n📊 Disconnected from MongoDB');
    }
}

// Run the demonstration
if (require.main === module) {
    demonstrateInstallmentSystem();
}

module.exports = { demonstrateInstallmentSystem };
