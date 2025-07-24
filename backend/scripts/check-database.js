const mongoose = require('mongoose');
const Distributor = require('../models/Distributor');

const MONGODB_URI = 'mongodb://localhost:27017/vinod-electronics';

async function checkDatabase() {
    try {
        await mongoose.connect(MONGODB_URI);
        
        const distributors = await Distributor.find().limit(3);
        console.log('Sample distributors after cleanup:');
        distributors.forEach(d => {
            console.log(`- ${d.name}: GST=${d.gstNumber}, PAN=${d.panNumber}`);
        });
        
        const totalCount = await Distributor.countDocuments();
        console.log(`\nTotal distributors: ${totalCount}`);
        
        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkDatabase();
