const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    phone: { type: String, trim: true },
    
    // Role and permissions
    role: { 
      type: String, 
      enum: ['Admin', 'Manager', 'Agent', 'Viewer'],
      default: 'Agent'
    },
    permissions: [{
      module: String, // properties, tenants, owners, etc.
      actions: [String] // create, read, update, delete
    }],
    
    // Profile information
    avatar: { type: String }, // URL to avatar image
    department: { type: String, trim: true },
    position: { type: String, trim: true },
    employeeId: { type: String, trim: true, unique: true },
    
    // Contact information
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    
    // Work information
    hireDate: { type: Date },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedProperties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],
    assignedTenants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' }],
    
    // Status and preferences
    status: { 
      type: String, 
      enum: ['Active', 'Inactive', 'Suspended', 'Terminated'],
      default: 'Active'
    },
    isOnline: { type: Boolean, default: false },
    lastActive: { type: Date },
    
    // Communication preferences
    communicationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    },
    
    // Security
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    passwordChangedAt: { type: Date },
    
    // Activity tracking
    lastLogin: { type: Date },
    loginHistory: [{
      date: { type: Date, default: Date.now },
      ip: String,
      userAgent: String,
      success: Boolean
    }],
    
    // Settings
    settings: {
      theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
      language: { type: String, default: 'en' },
      timezone: { type: String, default: 'UTC' },
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true }
      }
    },
    
    // Notes and tags
    notes: { type: String, trim: true },
    tags: [{ type: String, trim: true }]
  },
  { 
    timestamps: { createdAt: true, updatedAt: true },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return this.name;
});

// Virtual for isLocked
UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.passwordChangedAt = Date.now() - 1000; // 1 second ago
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to check if password was changed after token was issued
UserSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Method to increment login attempts
UserSchema.methods.incLoginAttempts = function() {
  if (this.lockUntil && this.lockUntil > Date.now()) {
    return;
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
UserSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

// Indexes for better query performance (removed duplicates)
UserSchema.index({ role: 1, status: 1 });
UserSchema.index({ managerId: 1 });
UserSchema.index({ assignedProperties: 1 });
UserSchema.index({ assignedTenants: 1 });
UserSchema.index({ lastActive: -1 });

module.exports = mongoose.model('User', UserSchema);
