const { mongoose } = require('../../../packages/database');

const opportunitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title for the opportunity'],
    trim: true,
    maxlength: [100, 'Title can not be more than 100 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Please add an estimated amount']
  },
  stage: {
    type: String,
    enum: ['New', 'In Execution', 'Review', 'Completed', 'Cancelled'],
    default: 'New'
  },
  modules: [{
    name: String,
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed'],
      default: 'Pending'
    },
    clientStatus: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed'],
      default: 'Pending'
    }
  }],
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: [true, 'Please refer to a Contact']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  expectedCloseDate: {
    type: Date
  },
  employeeTaskStatus: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Opportunity', opportunitySchema);
