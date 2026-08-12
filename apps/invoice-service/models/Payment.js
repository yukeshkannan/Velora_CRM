const { mongoose } = require('../../../packages/database');

const PaymentSchema = new mongoose.Schema({
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId, // Storing ID for easy querying, could be ref if needed
    required: false
  },
  customerName: {
    type: String,
    required: false
  },
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  method: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Check', 'Credit Card', 'UPI', 'Other'],
    default: 'Bank Transfer'
  },
  reference: {
    type: String
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Payment', PaymentSchema);
