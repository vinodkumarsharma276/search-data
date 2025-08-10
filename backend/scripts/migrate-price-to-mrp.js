// Migration: rename product field 'price' -> 'mrp'
const mongoose = require('mongoose');
const Product = require('../models/Product');

(async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vinod-electronics';
    await mongoose.connect(uri);
    console.log('Connected for migration');

    // Find docs with price and without mrp
    const toMigrate = await Product.countDocuments({ price: { $exists: true }, mrp: { $exists: false } });
    console.log('Documents needing migration:', toMigrate);

    if(toMigrate>0){
      const batchSize = 500;
      let migrated = 0;
      while(true){
        const batch = await Product.find({ price: { $exists: true }, mrp: { $exists: false } }).limit(batchSize).select('_id price');
        if(!batch.length) break;
        const bulk = Product.collection.initializeUnorderedBulkOp();
        batch.forEach(doc => {
          bulk.find({ _id: doc._id }).updateOne({ $set: { mrp: doc.price }, $unset: { price: "" } });
        });
        const res = await bulk.execute();
        migrated += res.nModified || res.nUpserted || 0;
        console.log(`Migrated batch; total migrated so far: ${migrated}`);
      }
    }

    // Validation
    const remaining = await Product.countDocuments({ price: { $exists: true }, mrp: { $exists: false } });
    console.log('Remaining needing migration:', remaining);
    const mrpCount = await Product.countDocuments({ mrp: { $exists: true } });
    console.log('Products with mrp field:', mrpCount);

    await mongoose.disconnect();
    console.log('Migration completed');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
})();
