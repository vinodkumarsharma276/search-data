const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const Installment = require('../models/Installment');
const InstallmentService = require('../services/installmentService');
require('dotenv').config();

/**
 * Demonstration script showing overdue installments with penalty calculations
 */
async function demonstrateOverdueInstallments() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vinod-electronics');
        console.log('📊 Connected to MongoDB');

        // 1. Create a sample customer
        const customer = new Customer({
            name: 'Priya Sharma',
            phone: '9876543211',
            address: {
                street: '456 Karol Bagh',
                city: 'Delhi',
                state: 'Delhi',
                pincode: '110005'
            }
        });
        await customer.save();
        console.log('✅ Sample customer created:', customer.name);

        // 2. Create a sale with installments starting from past dates (to simulate overdue)
        const sale = new Sale({
            customerId: customer._id,
            items: [{
                inventoryId: new mongoose.Types.ObjectId(),
                productId: new mongoose.Types.ObjectId(),
                sellingPrice: 30000,
                discount: 1000,
                finalPrice: 29000,
                gstAmount: 5220,
                totalAmount: 34220
            }],
            subtotal: 29000,
            totalGst: 5220,
            totalAmount: 34220,
            paymentType: 'Installment',
            paymentDetails: {
                downPayment: 5000,
                installmentMonths: 6,
                monthlyInstallment: 5000,
                totalInstallmentAmount: 30000,
                emiStartDate: new Date('2025-05-01') // Past date to create overdue installments
            },
            salesPerson: 'Vinod Sharma'
        });
        await sale.save();
        console.log('✅ Sample sale created:', sale.saleNumber);

        // 3. Manually create installments with past due dates
        console.log('\n📅 Creating installments with past due dates...');
        const installmentDates = [
            new Date('2025-06-01'), // 50 days overdue
            new Date('2025-07-01'), // 20 days overdue
            new Date('2025-07-15'), // 6 days overdue
            new Date('2025-07-25'), // Future (not due yet)
            new Date('2025-08-01'), // Future
            new Date('2025-09-01')  // Future
        ];

        const installmentsData = [];
        for (let i = 0; i < 6; i++) {
            const installment = new Installment({
                saleId: sale._id,
                customerId: customer._id,
                installmentNumber: i + 1,
                dueDate: installmentDates[i],
                originalAmount: 4870, // (34220 - 5000) / 6
                remainingAmount: 4870,
                totalAmountDue: 4870
            });
            
            // Simulate partial payment for one installment
            if (i === 1) {
                installment.paidAmount = 2000;
                installment.remainingAmount = 2870;
                installment.status = 'Partially Paid';
                installment.paymentMethod = 'Cash';
                installment.paidDate = new Date('2025-07-10');
            }
            
            await installment.save();
            installmentsData.push(installment);
        }
        
        console.log(`✅ Created ${installmentsData.length} installments with mixed statuses`);

        // 4. Get current penalty calculations
        console.log('\n⚠️ Analyzing overdue installments with penalties...');
        const allInstallments = await Installment.find({ saleId: sale._id }).sort({ installmentNumber: 1 });
        
        console.log('\n📊 Current Date:', new Date().toDateString());
        console.log('📋 Installment Analysis:');
        
        let totalPenalty = 0;
        let totalOverdue = 0;
        
        for (const installment of allInstallments) {
            const penaltyInfo = installment.calculateCurrentPenalty();
            const status = installment.status;
            
            console.log(`\n   ${installment.installmentNumber}. Installment #${installment.installmentNumber}`);
            console.log(`      Due Date: ${installment.dueDate.toDateString()}`);
            console.log(`      Status: ${status}`);
            console.log(`      Original Amount: ₹${installment.originalAmount}`);
            console.log(`      Paid Amount: ₹${installment.paidAmount}`);
            console.log(`      Remaining: ₹${installment.remainingAmount}`);
            
            if (penaltyInfo.daysOverdue > 0) {
                console.log(`      🚨 OVERDUE by ${penaltyInfo.daysOverdue} days`);
                console.log(`      💰 Penalty: ₹${penaltyInfo.totalPenalty} (₹2 × ${penaltyInfo.daysOverdue} days)`);
                console.log(`      💸 Total Due: ₹${installment.remainingAmount + penaltyInfo.totalPenalty}`);
                totalPenalty += penaltyInfo.totalPenalty;
                totalOverdue += installment.remainingAmount;
            } else {
                const daysToGo = Math.ceil((installment.dueDate - new Date()) / (1000 * 60 * 60 * 24));
                console.log(`      ⏰ Due in ${daysToGo} days`);
                console.log(`      💰 No penalty yet`);
            }
        }
        
        console.log('\n📈 Overall Summary:');
        console.log(`   Total Overdue Amount: ₹${totalOverdue}`);
        console.log(`   Total Penalty: ₹${totalPenalty}`);
        console.log(`   Total Amount Due (Including Penalties): ₹${totalOverdue + totalPenalty}`);

        // 5. Update penalties automatically using the service
        console.log('\n🔄 Running automatic penalty update...');
        const updateResult = await InstallmentService.updateAllPenalties();
        console.log(`✅ Updated penalties for ${updateResult.updated} installments`);

        // 6. Show overdue installments using the service
        console.log('\n📋 Getting overdue installments from service...');
        const overdueInstallments = await InstallmentService.getOverdueInstallments();
        
        if (overdueInstallments.length > 0) {
            console.log(`\n🚨 Found ${overdueInstallments.length} overdue installments:`);
            overdueInstallments.forEach((inst, index) => {
                const penalty = inst.calculateCurrentPenalty();
                console.log(`   ${index + 1}. Customer: ${inst.customerId.name}`);
                console.log(`      Sale: ${inst.saleId.saleNumber}`);
                console.log(`      Installment #${inst.installmentNumber}`);
                console.log(`      Due: ${inst.dueDate.toDateString()}`);
                console.log(`      Overdue: ${penalty.daysOverdue} days`);
                console.log(`      Penalty: ₹${penalty.totalPenalty}`);
                console.log(`      Amount Due: ₹${inst.remainingAmount + penalty.totalPenalty}`);
                console.log('      ---');
            });
        } else {
            console.log('   No overdue installments found');
        }

        // 7. Simulate making a payment with penalty
        if (overdueInstallments.length > 0) {
            console.log('\n💰 Recording payment for overdue installment (including penalty)...');
            const overdueInst = overdueInstallments[0];
            const penaltyInfo = overdueInst.calculateCurrentPenalty();
            
            console.log(`   Paying ₹${overdueInst.remainingAmount} + ₹${penaltyInfo.totalPenalty} penalty = ₹${overdueInst.remainingAmount + penaltyInfo.totalPenalty}`);
            
            const updatedInstallment = await InstallmentService.recordPayment(overdueInst._id, {
                amount: overdueInst.remainingAmount,
                paymentMethod: 'UPI',
                transactionId: 'TXN987654321',
                notes: 'Payment with penalty',
                penaltyPaid: penaltyInfo.totalPenalty
            });
            
            console.log(`✅ Payment recorded for installment #${updatedInstallment.installmentNumber}`);
            console.log(`   Status: ${updatedInstallment.status}`);
            console.log(`   Penalty paid: ₹${updatedInstallment.penaltyDetails.penaltyPaid}`);
        }

        // 8. Show final summary
        console.log('\n📊 Final Customer Statement:');
        const customerInstallments = await Installment.find({ customerId: customer._id })
            .populate('saleId', 'saleNumber')
            .sort({ dueDate: 1 });
            
        customerInstallments.forEach((inst, index) => {
            const penalty = inst.calculateCurrentPenalty();
            const statusEmoji = inst.status === 'Paid' ? '✅' : 
                               inst.status === 'Overdue' ? '🚨' : 
                               inst.status === 'Partially Paid' ? '⚠️' : '⏰';
            
            console.log(`   ${statusEmoji} ${inst.saleId.saleNumber} - EMI #${inst.installmentNumber}`);
            console.log(`      Due: ${inst.dueDate.toDateString()} | Status: ${inst.status}`);
            console.log(`      Amount: ₹${inst.remainingAmount} ${penalty.totalPenalty > 0 ? `+ ₹${penalty.totalPenalty} penalty` : ''}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\n📊 Disconnected from MongoDB');
    }
}

// Run the demonstration
if (require.main === module) {
    demonstrateOverdueInstallments();
}

module.exports = { demonstrateOverdueInstallments };
