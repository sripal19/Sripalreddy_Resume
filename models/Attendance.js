const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  laborRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LaborRequest',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  checkIn: {
    type: Date,
    default: null
  },
  checkOut: {
    type: Date,
    default: null
  },
  hoursWorked: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'partial', 'late'],
    default: 'present'
  },
  notes: {
    type: String,
    default: ''
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  dailyWage: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Calculate hours worked
attendanceSchema.pre('save', function(next) {
  if (this.checkIn && this.checkOut) {
    const diffInMs = this.checkOut - this.checkIn;
    this.hoursWorked = Math.round((diffInMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
  }
  next();
});

// Compound index for efficient querying
attendanceSchema.index({ worker: 1, date: 1 }, { unique: true });
attendanceSchema.index({ laborRequest: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);