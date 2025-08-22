const mongoose = require('mongoose');

const OwnerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    phone: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date },
    ssn: { type: String, trim: true }, // Social Security Number (encrypted in production)
    status: { 
      type: String, 
      enum: ['Active', 'Inactive', 'Pending', 'Suspended'],
      default: 'Active'
    },
    
    // Contact information
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zipCode: { type: String, required: true, trim: true },
    country: { type: String, default: 'USA', trim: true },
    
    // Business information
    companyName: { type: String, trim: true },
    businessLicense: { type: String, trim: true },
    taxId: { type: String, trim: true },
    
    // Financial information
    bankAccount: {
      bankName: String,
      accountNumber: String, // encrypted in production
      routingNumber: String,
      accountType: { type: String, enum: ['Checking', 'Savings', 'Business'] }
    },
    
    // Payment preferences
    paymentPreferences: {
      method: { type: String, enum: ['Direct Deposit', 'Check', 'Wire Transfer'], default: 'Direct Deposit' },
      frequency: { type: String, enum: ['Monthly', 'Quarterly', 'Annually'], default: 'Monthly' }
    },
    
    // Documents
    documents: [{
      name: String,
      url: String,
      type: String, // ID, license, etc.
      uploadedAt: { type: Date, default: Date.now }
    }],
    
    // Emergency contact
    emergencyContact: {
      name: { type: String, trim: true },
      relationship: { type: String, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true }
    },
    
    // Communication preferences
    communicationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      phone: { type: Boolean, default: false },
      mail: { type: Boolean, default: false }
    },
    
    // Notes and preferences
    notes: { type: String, trim: true },
    preferences: {
      maintenanceAlerts: { type: Boolean, default: true },
      financialReports: { type: Boolean, default: true },
      tenantUpdates: { type: Boolean, default: true }
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

// Virtual for total properties owned
OwnerSchema.virtual('totalProperties').get(function() {
  // This will be populated when we query with populate
  return this.properties ? this.properties.length : 0;
});

// Virtual for total portfolio value
OwnerSchema.virtual('totalPortfolioValue').get(function() {
  // This will be populated when we query with populate
  if (!this.properties) return 0;
  return this.properties.reduce((sum, property) => sum + (property.purchasePrice || 0), 0);
});

// Virtual for total monthly income
OwnerSchema.virtual('totalMonthlyIncome').get(function() {
  // This will be populated when we query with populate
  if (!this.properties) return 0;
  return this.properties.reduce((sum, property) => sum + (property.rent || 0), 0);
});

// Indexes for better query performance (removed duplicates)
OwnerSchema.index({ city: 1, state: 1 });

module.exports = mongoose.model('Owner', OwnerSchema);
