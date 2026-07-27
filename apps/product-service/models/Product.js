const { mongoose } = require('../../../packages/database');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true
  },
  sku: {
    type: String,
    required: [true, 'Please add a SKU'],
    unique: true,
    trim: true,
    uppercase: true
  },
  price: {
    type: Number,
    required: [true, 'Please add a price']
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['CRM Services', 'HRMS Services', 'Customer Support', 'AWS & Cloud', 'Software', 'Hardware', 'Service', 'Subscription'],
    default: 'CRM Services'
  },
  stock: {
    type: Number,
    default: 99
  },
  image: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', productSchema);
