const mongoose = require('mongoose');
const Distributor = require('./models/Distributor');
const connectDB = require('./config/database');

const migrateDistributorData = async () => {
    console.log('Connecting to the database...');
    await connectDB();
    console.log('Database connected.');

    try {
        console.log('Starting distributor data migration...');

        const result = await Distributor.updateMany(
            { deleted: { $exists: false } },
            { $set: { deleted: false } }
        );

        console.log('\n--- Distributor Data Migration Report ---');
        console.log(`Total documents matched: ${result.matchedCount}`);
        console.log(`Total documents modified: ${result.modifiedCount}`);
        console.log('-----------------------------------------\n');

        if (result.modifiedCount > 0) {
            console.log('✅ Migration successful. All distributors now have the "deleted" flag.');
        } else {
            console.log('ℹ️ No distributors needed migration.');
        }

    } catch (error) {
        console.error('An error occurred during the data migration:', error);
    } finally {
        console.log('Closing database connection.');
        await mongoose.disconnect();
    }
};

migrateDistributorData();
