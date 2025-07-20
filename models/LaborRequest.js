const mongoose = require('mongoose');

const laborRequestSchema = new mongoose.Schema({
  builder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: String,
    enum: ['Kukatpally', 'Bachupally', 'Madhapur', 'Kondapur', 'Financial District', 'Nanakramguda', 'Manikonda'],
    required: true
  },
  category: {
    type: String,
    enum: ['mason', 'helper', 'carpenter', 'plumber', 'painter', 'electrician'],
    required: true
  },
  numberOfWorkers: {
    type: Number,
    required: true,
    min: 1
  },
  numberOfDays: {
    type: Number,
    required: true,
    min: 1
  },
  wagePerDay: {
    type: Number,
    required: true
  },
  totalCost: {
    type: Number,
    required: true
  },
  withSupervisor: {
    type: Boolean,
    default: false
  },
  supervisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isEmergency: {
    type: Boolean,
    default: false
  },
  emergencyCharge: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'in-progress', 'completed'],
    default: 'pending'
  },
  assignedWorkers: [{
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    }
  }],
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  },
  description: {
    type: String,
    default: ''
  },
  workAddress: {
    type: String,
    required: true
  },
  contactPerson: {
    name: String,
    phone: String
  },
  previousCrew: {
    type: Boolean,
    default: false
  },
  preferredWorkers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  workerRatings: [{
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String
  }]
}, {
  timestamps: true
});

// Calculate total cost including emergency charges
laborRequestSchema.pre('save', function(next) {
  let baseCost = this.wagePerDay * this.numberOfWorkers * this.numberOfDays;
  
  if (this.isEmergency) {
    this.emergencyCharge = baseCost * 0.1; // 10% emergency charge
    this.totalCost = baseCost + this.emergencyCharge;
  } else {
    this.totalCost = baseCost;
  }
  
  next();
});

module.exports = mongoose.model('LaborRequest', laborRequestSchema);