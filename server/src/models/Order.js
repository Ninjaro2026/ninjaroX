const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }, // total price for this quantity (unitPrice * quantity)
  img: { type: String, required: true }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // custom ID like NZ-XXXX
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Processing'
  },
  total: { type: Number, required: true },
  items: [OrderItemSchema],
  eta: { type: String },
  trackingStep: { type: Number, default: 1 },
  customerName: { type: String },
  shippingAddress: { type: String },
  shippingCity: { type: String },
  shippingZip: { type: String },
  shippingMethod: { type: String },
  isPOS: { type: Boolean, default: false },
  posPaymentMode: { type: String, enum: ['Cash', 'Card', 'UPI'] },
  posCustomerPhone: { type: String },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
