const mongoose = require('mongoose');
const Category = require('./models/Category');
require('dotenv').config();

async function quickCheck() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        
        const categories = await Category.find({}).select('name parent_id is_leaf');
        console.log(`Total categories: ${categories.length}`);
        
        categories.forEach(cat => {
            console.log(`- ${cat.name} (leaf: ${cat.is_leaf})`);
        });
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

quickCheck();
