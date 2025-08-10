// Quick report to list any products still using price instead of mrp
const mongoose = require('mongoose');
const Product = require('../models/Product');
(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vinod-electronics');
    const legacyCount = await Product.countDocuments({ price: { $exists: true } });
    const sample = await Product.find({ price: { $exists: true } }).limit(5).lean();
    console.log('Legacy price field docs:', legacyCount);
    if(sample.length){
      console.log('Sample legacy docs ids:', sample.map(d=>d._id));
    }
    const mrpCount = await Product.countDocuments({ mrp: { $exists: true } });
    console.log('Docs with mrp:', mrpCount);
    await mongoose.disconnect();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
