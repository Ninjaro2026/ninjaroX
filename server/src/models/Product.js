const mongoose = require('mongoose');

const ComboItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  quantity: { type: Number, required: true }
}, { _id: false });

const ReviewSchema = new mongoose.Schema({
  id: { type: String, required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  date: { type: String, required: true },
  verified: { type: Boolean, default: true }
}, { timestamps: true });

const ProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  mrp: { type: Number },
  category: { type: String },
  showInStorefront: { type: Boolean, default: true },
  priority: { type: Number },
  imageSrc: { type: String },
  imageAlt: { type: String },
  topBgColor: { type: String },
  bottomBgColor: { type: String },
  buttonTextColor: { type: String },
  stock: { type: Number, default: 0 },
  isCombo: { type: Boolean, default: false },
  comboItems: [ComboItemSchema],
  isBestSeller: { type: Boolean, default: false },
  reviews: [ReviewSchema]
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
