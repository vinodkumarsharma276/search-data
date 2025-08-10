// Script to clean old prefixed model_number (e.g., 'MOD-1234') and serial_number values (e.g., 'LAP-...','AND-...','IOS-...','GEN-...')
// Keeps only the significant unique core while avoiding collisions.
// Strategy:
// 1. For model_number: if it matches /^MOD-[A-Z0-9]{4}$/i remove 'MOD-' prefix
// 2. For serial_number: if it contains '-' and starts with one of known legacy prefixes (LAP|AND|IOS|GEN) and second token is a millisecond timestamp length 13, rebuild as timestamp(base36)+rand
// 3. Guarantee uniqueness by checking existing set in-memory; append short random suffix when needed.

const mongoose = require('mongoose');
const Product = require('../models/Product');

(async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vinod-electronics';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const cursor = Product.find({ $or: [
      { model_number: /^MOD-[A-Za-z0-9]{4}$/ },
      { serial_number: /^(LAP|AND|IOS|GEN)-/ }
    ] }).cursor();

    let updates = 0;
    const seenModels = new Set();
    const seenSerials = new Set();

    // Preload existing model/serial to reduce collision risk
    const existing = await Product.find({}, { model_number: 1, serial_number: 1 }).lean();
    existing.forEach(p => { if(p.model_number) seenModels.add(p.model_number); if(p.serial_number) seenSerials.add(p.serial_number); });

    const makeUnique = (base, seen) => {
      let candidate = base;
      while(seen.has(candidate)) {
        candidate = base + Math.random().toString(36).slice(2,4).toUpperCase();
      }
      seen.add(candidate);
      return candidate;
    };

    for await (const doc of cursor) {
      let changed = false;

      // Clean model_number
      if (doc.model_number && /^MOD-[A-Za-z0-9]{4}$/.test(doc.model_number)) {
        const core = doc.model_number.slice(4); // remove prefix
        doc.model_number = makeUnique(core.toUpperCase(), seenModels);
        changed = true;
      }

      // Clean serial_number
      if (doc.serial_number && /^(LAP|AND|IOS|GEN)-/.test(doc.serial_number)) {
        const parts = doc.serial_number.split('-');
        if (parts.length >= 2 && /^\d{13}$/.test(parts[1])) {
          const ts = Number(parts[1]);
          const base36 = ts.toString(36).toUpperCase();
          const rand = Math.random().toString(36).slice(2,6).toUpperCase();
          const core = base36 + rand;
          doc.serial_number = makeUnique(core, seenSerials);
          changed = true;
        } else {
          // Fallback: strip first token
          const rest = parts.slice(1).join('-');
          const core = rest.replace(/-/g,'').slice(0,14).toUpperCase() || Math.random().toString(36).slice(2,10).toUpperCase();
          doc.serial_number = makeUnique(core, seenSerials);
          changed = true;
        }
      }

      if (changed) {
        await doc.save();
        updates++;
        if (updates % 50 === 0) console.log(`Updated ${updates} documents...`);
      }
    }

    console.log(`Cleanup complete. Updated ${updates} documents.`);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error cleaning prefixes:', err);
    process.exit(1);
  }
})();
