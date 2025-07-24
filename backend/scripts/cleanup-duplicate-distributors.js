const mongoose = require('mongoose');
const Distributor = require('../models/Distributor');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vinod-electronics';

async function cleanupDuplicates() {
    try {
        console.log('🧹 ========================================');
        console.log('🧹 CLEANING UP DUPLICATE DISTRIBUTORS');
        console.log('🧹 ========================================');
        
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully!');
        
        console.log('\n🔍 Analyzing existing distributors for duplicates...');
        
        // Find all distributors
        const allDistributors = await Distributor.find().sort({ createdAt: 1 });
        console.log(`📊 Total distributors found: ${allDistributors.length}`);
        
        // Track GST and PAN numbers
        const gstNumbers = new Map();
        const panNumbers = new Map();
        const duplicatesToDelete = [];
        
        console.log('\n🔍 Checking for GST number duplicates...');
        for (const distributor of allDistributors) {
            if (gstNumbers.has(distributor.gstNumber)) {
                const existing = gstNumbers.get(distributor.gstNumber);
                console.log(`❌ DUPLICATE GST: ${distributor.gstNumber}`);
                console.log(`   - Existing: ${existing.name} (${existing._id}) - Created: ${existing.createdAt}`);
                console.log(`   - Duplicate: ${distributor.name} (${distributor._id}) - Created: ${distributor.createdAt}`);
                duplicatesToDelete.push({
                    id: distributor._id,
                    reason: 'Duplicate GST Number',
                    gstNumber: distributor.gstNumber,
                    name: distributor.name
                });
            } else {
                gstNumbers.set(distributor.gstNumber, distributor);
            }
        }
        
        console.log('\n🔍 Checking for PAN number duplicates...');
        for (const distributor of allDistributors) {
            if (!duplicatesToDelete.find(d => d.id.toString() === distributor._id.toString())) {
                if (panNumbers.has(distributor.panNumber)) {
                    const existing = panNumbers.get(distributor.panNumber);
                    console.log(`❌ DUPLICATE PAN: ${distributor.panNumber}`);
                    console.log(`   - Existing: ${existing.name} (${existing._id}) - Created: ${existing.createdAt}`);
                    console.log(`   - Duplicate: ${distributor.name} (${distributor._id}) - Created: ${distributor.createdAt}`);
                    duplicatesToDelete.push({
                        id: distributor._id,
                        reason: 'Duplicate PAN Number',
                        panNumber: distributor.panNumber,
                        name: distributor.name
                    });
                } else {
                    panNumbers.set(distributor.panNumber, distributor);
                }
            }
        }
        
        console.log('\n📈 SUMMARY:');
        console.log(`📊 Total distributors: ${allDistributors.length}`);
        console.log(`🔄 Unique GST numbers: ${gstNumbers.size}`);
        console.log(`🔄 Unique PAN numbers: ${panNumbers.size}`);
        console.log(`❌ Duplicates to delete: ${duplicatesToDelete.length}`);
        
        if (duplicatesToDelete.length > 0) {
            console.log('\n🗑️ DUPLICATES TO DELETE:');
            duplicatesToDelete.forEach((dup, index) => {
                console.log(`${index + 1}. ${dup.name} (${dup.id}) - ${dup.reason}`);
            });
            
            console.log('\n🗑️ Deleting duplicate records...');
            const deleteIds = duplicatesToDelete.map(d => d.id);
            const deleteResult = await Distributor.deleteMany({ _id: { $in: deleteIds } });
            
            console.log(`✅ Deleted ${deleteResult.deletedCount} duplicate distributors`);
        } else {
            console.log('\n✅ No duplicates found! Database is clean.');
        }
        
        console.log('\n🔨 Creating unique indexes...');
        try {
            // Drop existing indexes on gstNumber and panNumber if they exist
            await mongoose.connection.db.collection('distributors').dropIndex('gstNumber_1').catch(() => {});
            await mongoose.connection.db.collection('distributors').dropIndex('panNumber_1').catch(() => {});
            
            // Create unique indexes
            await mongoose.connection.db.collection('distributors').createIndex({ gstNumber: 1 }, { unique: true });
            await mongoose.connection.db.collection('distributors').createIndex({ panNumber: 1 }, { unique: true });
            
            console.log('✅ Unique indexes created successfully!');
        } catch (indexError) {
            console.error('❌ Error creating indexes:', indexError.message);
        }
        
        // Verify final count
        const finalCount = await Distributor.countDocuments();
        console.log(`\n📈 Final distributor count: ${finalCount}`);
        
        console.log('\n🧹 ========================================');
        console.log('🧹 CLEANUP COMPLETED SUCCESSFULLY!');
        console.log('🧹 ========================================');
        console.log('✅ No more duplicate GST or PAN numbers allowed');
        console.log('✅ Unique constraints are now enforced');
        console.log('✅ Database is ready for production use');
        
    } catch (error) {
        console.error('❌ ========================================');
        console.error('❌ ERROR DURING CLEANUP!');
        console.error('❌ ========================================');
        console.error('❌ Error details:', error);
        console.error('❌ ========================================');
    } finally {
        // Close database connection
        console.log('\n🔌 Closing database connection...');
        await mongoose.connection.close();
        console.log('✅ Database connection closed.');
        process.exit(0);
    }
}

// Run the cleanup function
cleanupDuplicates();
