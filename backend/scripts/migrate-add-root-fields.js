// Migration: populate root_id, path arrays, build materialized root docs
const mongoose = require('mongoose');
const Category = require('../models/Category');
const CategoryRoot = require('../models/CategoryRoot');
require('dotenv').config();

(async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vinod-electronics';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const roots = await Category.find({ parent_id: null });
    console.log('Found roots:', roots.length);

    for (const root of roots) {
      // BFS to update descendants
      const queue = [root];
      while (queue.length) {
        const node = queue.shift();
        let changed = false;
        if (!node.root_id || !node.path_ids || node.path_ids.length === 0) {
          if (!node.parent_id) {
            node.root_id = node._id;
            node.path_ids = [node._id];
            node.path_keys = [node.field_key];
          } else {
            const parent = await Category.findById(node.parent_id);
            node.root_id = parent.root_id || parent._id;
            node.path_ids = [...(parent.path_ids || [parent._id]), node._id];
            node.path_keys = [...(parent.path_keys || [parent.field_key]), node.field_key];
          }
          changed = true;
        }
        if (changed) await node.save();
        const children = await Category.find({ parent_id: node._id });
        queue.push(...children);
      }
      // Rebuild materialized tree for this root
      await Category.rebuildRootTree(root._id);
      console.log('Rebuilt tree for root', root.name);
    }

    console.log('Migration complete');
    await mongoose.disconnect();
  } catch (e) {
    console.error('Migration failed:', e);
    process.exit(1);
  }
})();
