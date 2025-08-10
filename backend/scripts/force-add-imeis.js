const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vinod-electronics');
    console.log('🔗 Connected');
    const res = await Product.updateMany(
      { sub_category_2: { $in: ['Android Phones','iPhone'] } },
      { $set: { mobile_imei: ['111111111111111','222222222222222'] } }
    );
    console.log('Matched', res.matchedCount, 'Modified', res.modifiedCount);
    const docs = await Product.find({ sub_category_2: { $in: ['Android Phones','iPhone'] } }).lean();
    console.log('Sample:', docs.map(d => ({ id: d._id, imei: d.mobile_imei })));
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Closed');
  }
})();
