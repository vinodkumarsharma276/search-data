const mongoose = require('mongoose');
const Distributor = require('./models/Distributor');
const connectDB = require('./config/database');

const checkDistributorData = async () => {
    console.log('Connecting to the database...');
    await connectDB();
    console.log('Database connected.');

    try {
        console.log('Starting distributor data quality check...');
        const distributors = await Distributor.find({}).lean();
        const totalDistributors = distributors.length;
        console.log(`Found ${totalDistributors} distributors to check.`);

        let issuesFound = 0;
        const issuesSummary = {
            legacyCreatedAtField: 0,
            legacyUpdatedAtField: 0,
            legacyContactPersonField: 0,
            missingDeletedFlag: 0,
            mongooseTimestampsMissing: 0,
        };

        for (const dist of distributors) {
            let docHasIssue = false;

            if (dist.created_at) {
                issuesSummary.legacyCreatedAtField++;
                docHasIssue = true;
            }
            if (dist.updated_at) {
                issuesSummary.legacyUpdatedAtField++;
                docHasIssue = true;
            }
            if (dist.contactPerson) {
                issuesSummary.legacyContactPersonField++;
                docHasIssue = true;
            }
            if (dist.deleted === undefined) {
                issuesSummary.missingDeletedFlag++;
                docHasIssue = true;
            }
            if (!dist.createdAt || !dist.updatedAt) {
                issuesSummary.mongooseTimestampsMissing++;
                docHasIssue = true;
            }

            if (docHasIssue) {
                issuesFound++;
            }
        }

        console.log('\n--- Distributor Data Quality Report ---');
        console.log(`Total distributors checked: ${totalDistributors}`);
        console.log(`Distributors with issues: ${issuesFound}`);
        console.log('-----------------------------------------');
        console.log(`- Documents with legacy 'created_at' field: ${issuesSummary.legacyCreatedAtField}`);
        console.log(`- Documents with legacy 'updated_at' field: ${issuesSummary.legacyUpdatedAtField}`);
        console.log(`- Documents with legacy 'contactPerson' field: ${issuesSummary.legacyContactPersonField}`);
        console.log(`- Documents missing a 'deleted' flag: ${issuesSummary.missingDeletedFlag}`);
        console.log(`- Documents missing Mongoose timestamps ('createdAt'/'updatedAt'): ${issuesSummary.mongooseTimestampsMissing}`);
        console.log('-----------------------------------------\n');

        if (issuesFound > 0) {
            console.log('Action required: Please run the migration script to clean up the data.');
        } else {
            console.log('✅ All distributors seem to be in good shape. No immediate action required.');
        }

    } catch (error) {
        console.error('An error occurred during the data check:', error);
    } finally {
        console.log('Closing database connection.');
        await mongoose.disconnect();
    }
};

checkDistributorData();
