// Script: show-products.js
// Purpose: Print raw product documents from MongoDB (both all and non-deleted)

const mongoose = require('mongoose');
const Product = require('../models/Product');

(async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vinod-electronics';
    await mongoose.connect(uri);

    const total = await Product.estimatedDocumentCount();
    const activeFilter = { $or: [ { deleted: false }, { deleted: { $exists: false } } ] };

    const allProducts = await Product.find({}).sort({ createdAt: -1 }).lean();
    const activeProducts = allProducts.filter(p => p.deleted !== true);

    console.log('=== PRODUCT RAW DUMP ===');
    console.log('Total documents:', total);
    console.log('Active (not deleted):', activeProducts.length);
    console.log('Deleted (soft):', allProducts.length - activeProducts.length);
    console.log('\n-- Active Products (raw) --');
    console.log(JSON.stringify(activeProducts, null, 2));

    console.log('\n-- All Products (including deleted) --');
    console.log(JSON.stringify(allProducts, null, 2));

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error dumping products:', err);
    process.exit(1);
  }
})();
