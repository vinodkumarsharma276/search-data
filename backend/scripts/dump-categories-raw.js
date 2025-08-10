// Dump raw category documents exactly as stored
const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

(async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vinod-electronics';
    await mongoose.connect(uri);
    const docs = await Category.find({}).lean();
    console.log(JSON.stringify(docs, null, 2));
    await mongoose.disconnect();
  } catch (e) {
    console.error('Error dumping categories:', e);
    process.exit(1);
  }
})();
