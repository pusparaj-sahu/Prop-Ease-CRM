const mongoose = require('mongoose');

const TenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    phone: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date },
    ssn: { type: String, trim: true }, // Social Security Number (encrypted in production)
    status: { 
      type: String, 
      enum: ['Active', 'Inactive', 'Pending', 'Evicted', 'Moved Out'],
      default: 'Active'
    },
    // Current property information
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
    
    // Lease information
    leaseStart: { type: Date, required: true },
    leaseEnd: { type: Date, required: true },
    rentAmount: { type: Number, required: true, min: 0 },
    securityDeposit: { type: Number, min: 0 },
    lateFees: { type: Number, min: 0, default: 0 },
    
    // Contact information
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    
    // Emergency contact
    emergencyContact: {
      name: { type: String, trim: true },
      relationship: { type: String, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true }
    },
    
    // Employment information
    employer: { type: String, trim: true },
    jobTitle: { type: String, trim: true },
    monthlyIncome: { type: Number, min: 0 },
    
    // Documents
    documents: [{
      name: String,
      url: String,
      type: String, // ID, lease, etc.
      uploadedAt: { type: Date, default: Date.now }
    }],
    
    // Preferences and notes
    preferences: {
      pets: { type: Boolean, default: false },
      smoking: { type: Boolean, default: false },
      parking: { type: Boolean, default: false }
    },
    notes: { type: String, trim: true },
    
    // Financial information
    creditScore: { type: Number, min: 300, max: 850 },
    paymentHistory: [{
      date: { type: Date, default: Date.now },
      amount: Number,
      status: { type: String, enum: ['Paid', 'Late', 'Partial', 'Overdue'] },
      notes: String
    }],
    
    // Communication preferences
    communicationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      phone: { type: Boolean, default: false }
    },
    
    // Tags for categorization
    tags: [{ type: String, trim: true }]
  },
  { 
    timestamps: { createdAt: true, updatedAt: true },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for lease status
TenantSchema.virtual('leaseStatus').get(function() {
  const now = new Date();
  if (this.leaseEnd < now) return 'Expired';
  if (this.leaseStart > now) return 'Future';
  return 'Active';
});

// Virtual for days until lease expires
TenantSchema.virtual('daysUntilExpiry').get(function() {
  const now = new Date();
  const diffTime = this.leaseEnd.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for total rent paid
TenantSchema.virtual('totalRentPaid').get(function() {
  return this.paymentHistory
    .filter(payment => payment.status === 'Paid')
    .reduce((sum, payment) => sum + payment.amount, 0);
});

// Indexes for better query performance (removed duplicates)
TenantSchema.index({ propertyId: 1, status: 1 });

module.exports = mongoose.model('Tenant', TenantSchema);
