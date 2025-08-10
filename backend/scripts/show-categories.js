// Script to print all categories with hierarchy details
const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

(async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vinod-electronics';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const categories = await Category.find({}).sort({ level: 1, name: 1 }).lean();
    console.log(`Total categories: ${categories.length}`);

    // Build lookup by id
    const byId = new Map(categories.map(c => [c._id.toString(), c]));

    const lines = [];
    for (const cat of categories) {
      // Build path names
      const pathNames = [];
      let current = cat;
      while (current) {
        pathNames.unshift(current.name);
        if (current.parent_id) current = byId.get(current.parent_id.toString()); else current = null;
      }
      const pathStr = pathNames.join(' > ');
      lines.push({
        id: cat._id,
        name: cat.name,
        level: cat.level,
        field_key: cat.field_key,
        field_label: cat.field_label,
        is_leaf: cat.is_leaf,
        path: pathStr,
        form_fields: (cat.form_schema || []).map(f => `${f.field_id}:${f.label}:${f.type}`).join(', ')
      });
    }

    console.log('\n=== CATEGORY LIST (Hierarchical) ===');
    lines.forEach(l => {
      console.log(`[L${l.level}] ${l.path}  :: field_key=${l.field_key}  is_leaf=${l.is_leaf}`);
      if (l.form_fields) console.log('  Fields:', l.form_fields);
    });

    console.log('\nJSON Export (compact):');
    console.log(JSON.stringify(lines, null, 2));

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error showing categories:', err);
    process.exit(1);
  }
})();
