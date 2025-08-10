const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vinod-electronics');
    console.log('🔗 Connected to MongoDB');

    // Find products that look like smartphones (category path includes Smartphones)
    const phones = await Product.find({ $or: [ { main_category: 'Electronics', sub_category_1: 'Smartphones' }, { sub_category_2: 'Android Phones' }, { sub_category_2: 'iPhone' } ] });
    console.log(`📦 Found ${phones.length} phone products to update with dummy IMEIs`);

    let updated = 0;
    for (const phone of phones) {
      // Skip if already has mobile_imei array
      if (Array.isArray(phone.mobile_imei) && phone.mobile_imei.length >= 2) continue;
      phone.mobile_imei = [
        phone.mobile_imei?.[0] || '111111111111111',
        phone.mobile_imei?.[1] || '222222222222222'
      ];
      await phone.save();
      updated++;
    }

    console.log(`✅ Updated ${updated} products with dummy IMEIs`);
  } catch (err) {
    console.error('❌ Error adding dummy IMEIs:', err);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
})();
