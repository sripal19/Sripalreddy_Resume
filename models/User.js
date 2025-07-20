const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'builder', 'supervisor', 'worker'],
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  location: {
    type: String,
    enum: ['Kukatpally', 'Bachupally', 'Madhapur', 'Kondapur', 'Financial District', 'Nanakramguda', 'Manikonda'],
    required: function() {
      return this.role === 'worker' || this.role === 'supervisor';
    }
  },
  isApproved: {
    type: Boolean,
    default: function() {
      return this.role === 'admin';
    }
  },
  companyName: {
    type: String,
    required: function() {
      return this.role === 'builder';
    }
  },
  // Worker specific fields
  category: {
    type: String,
    enum: ['mason', 'helper', 'carpenter', 'plumber', 'painter', 'electrician'],
    required: function() {
      return this.role === 'worker';
    }
  },
  experience: {
    type: Number, // years of experience
    required: function() {
      return this.role === 'worker';
    }
  },
  rating: {
    type: Number,
    default: 4.0,
    min: 1,
    max: 5
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  currentProject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LaborRequest',
    default: null
  }
}, {
  timestamps: true
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);