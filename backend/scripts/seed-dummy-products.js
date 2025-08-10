// Seed 100 dummy products across existing categories
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Distributor = require('../models/Distributor');

function rand(min,max){return Math.floor(Math.random()*(max-min+1))+min;}
function pick(arr){return arr[rand(0,arr.length-1)];}
// Generate a shorter, prefix-free unique serial (kept reasonably compact to avoid multi-line wrapping in UI)
function generateSerial(idx){
  // base36 timestamp + random + idx segment => typically 12-16 chars
  return (
    Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).slice(2,6).toUpperCase() +
    idx.toString(36).toUpperCase()
  );
}

(async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vinod-electronics';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const distributors = await Distributor.find({}).select('_id name').limit(10);
    if(distributors.length===0){throw new Error('No distributors found to assign products');}

    // Leaf categories
    const leafCategories = await Category.find({ is_leaf: true });
    if(leafCategories.length===0) throw new Error('No leaf categories found');

    // Pre-build path cache
    const categoryPathCache = {};
    for(const cat of leafCategories){
      const path = await cat.getCategoryPath();
      categoryPathCache[cat._id] = path; // ordered root->leaf
    }

    const docs = [];
    const TOTAL = 100;

    for(let i=0;i<TOTAL;i++){
      const leaf = pick(leafCategories);
      const path = categoryPathCache[leaf._id];
      const supplier = pick(distributors);

      // Build hierarchical fields (names not ids) + pricing
      const base = { supplierId: supplier._id, sold:false };
      path.forEach(node => { if(node.field_key) base[node.field_key] = node.name; });

      // Shared pricing integrity: dealer_price < price
  const mrp = rand(5000,150000); // broad range
  const dealer = mrp - rand(500, Math.min(5000, Math.floor(mrp*0.3))); // ensure less than mrp

  base.mrp = mrp; // using mrp field (was price previously)
      base.dealer_price = dealer;
  // Model number without the old 'MOD-' prefix; random 6-char alphanumeric
  base.model_number = Math.random().toString(36).slice(2,8).toUpperCase();

      // Category-specific fields
      if(leaf.name === 'Laptops'){
        base.brand = pick(['Dell','HP','Lenovo','Asus','Acer','Apple']);
        base.serial_number = generateSerial(i);
      } else if(leaf.name === 'Android Phones'){
        base.brand = pick(['Samsung','Xiaomi','OnePlus','Realme','Vivo','Oppo']);
        base.ram_gb = pick(['4','6','8','12']);
        base.storage_gb = pick(['64','128','256','512']);
        base.color = pick(['black','white','blue','red','green','gold','silver']);
        base.serial_number = generateSerial(i);
        base.android_version = pick(['11','12','13','14','15']);
      } else if(leaf.name === 'iPhone'){
        base.brand = 'Apple';
        base.ram_gb = pick(['4','6','8']);
        base.storage_gb = pick(['128','256','512','1024']);
        base.color = pick(['black','white','blue','red','green','gold','silver']);
        base.serial_number = generateSerial(i);
        base.ios_version = pick(['16','17','18']);
      } else {
        base.brand = 'Generic';
        base.serial_number = generateSerial(i);
      }

      docs.push(base);
    }

    // Insert batch
    await Product.insertMany(docs);
    console.log(`Inserted ${docs.length} dummy products.`);

    // Quick validation
    const dupSerials = await Product.aggregate([
      { $group: { _id: '$serial_number', c: { $sum: 1 } } },
      { $match: { c: { $gt: 1 } } }
    ]);
    if(dupSerials.length){
      console.warn('Warning: duplicate serials detected', dupSerials);
    } else {
      console.log('All serial numbers are unique.');
    }

    // Updated pricing integrity check for mrp vs dealer_price
    const violPrice = await Product.countDocuments({ $expr: { $lte: ['$mrp','$dealer_price'] } });
    if(violPrice>0){
      console.warn('Pricing integrity violations (dealer_price >= mrp):', violPrice);
    } else {
      console.log('Pricing integrity validated (dealer_price < mrp for all).');
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error seeding dummy products:', err);
    process.exit(1);
  }
})();
