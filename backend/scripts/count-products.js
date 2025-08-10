// Quick script to print product counts
const mongoose = require('mongoose');
const Product = require('../models/Product');

(async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vinod-electronics';
    await mongoose.connect(uri);
    const total = await Product.estimatedDocumentCount();
    const nonDeleted = await Product.countDocuments({ $or: [ { deleted: false }, { deleted: { $exists: false } } ] });
    const deleted = await Product.countDocuments({ deleted: true });
    console.log('\nProduct counts');
    console.log('----------------');
    console.log('Total documents        :', total);
    console.log('Active (not deleted)   :', nonDeleted);
    console.log('Soft-deleted (deleted) :', deleted);
    console.log('\nBreakdown by supplier (top 10):');
    const bySupplier = await Product.aggregate([
      { $group: { _id: '$supplierId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    bySupplier.forEach((s,i)=> console.log(`${i+1}. ${s._id}: ${s.count}`));
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error counting products:', err);
    process.exit(1);
  }
})();
