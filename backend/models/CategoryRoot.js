const mongoose = require('mongoose');

const categoryRootSchema = new mongoose.Schema({
  root_key: { type: String, required: true, unique: true, index: true }, // unique implies index; explicit index retains single definition
  root_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  nodes: { type: [mongoose.Schema.Types.Mixed], default: [] },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CategoryRoot', categoryRootSchema);
