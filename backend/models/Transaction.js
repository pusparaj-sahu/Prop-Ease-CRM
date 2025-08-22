const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
  {
    type: { 
      type: String, 
      enum: ['Income', 'Expense'], 
      required: true 
    },
    category: { 
      type: String, 
      required: true,
      enum: ['Rent', 'Maintenance', 'Utilities', 'Insurance', 'Property Tax', 'Late Fees', 'Security Deposit', 'Other']
    },
    amount: { 
      type: Number, 
      required: true 
    },
    description: { 
      type: String, 
      required: true, 
      trim: true 
    },
    date: { 
      type: Date, 
      required: true, 
      default: Date.now 
    },
    
    // Related entities (optional)
    propertyId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Property' 
    },
    tenantId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Tenant' 
    },
    ownerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Owner' 
    },
    
    // Transaction details
    paymentMethod: { 
      type: String, 
      enum: ['Cash', 'Check', 'Credit Card', 'Bank Transfer', 'Online', 'Other'], 
      default: 'Other' 
    },
    reference: { 
      type: String, 
      trim: true 
    }, // Invoice number, receipt number, etc.
    
    // Status and processing
    status: { 
      type: String, 
      enum: ['Pending', 'Completed', 'Failed', 'Cancelled'], 
      default: 'Completed' 
    },
    processedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    processedAt: { 
      type: Date, 
      default: Date.now 
    },
    
    // Additional metadata
    tags: [{ 
      type: String, 
      trim: true 
    }],
    attachments: [{
      name: String,
      url: String,
      type: String,
      uploadedAt: { type: Date, default: Date.now }
    }],
    
    // Recurring transaction info
    isRecurring: { 
      type: Boolean, 
      default: false 
    },
    recurringFrequency: { 
      type: String, 
      enum: ['Monthly', 'Quarterly', 'Annually', 'Weekly'] 
    },
    nextDueDate: { 
      type: Date 
    }
  },
  { 
    timestamps: { createdAt: true, updatedAt: true },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for absolute amount (always positive)
TransactionSchema.virtual('absoluteAmount').get(function() {
  return Math.abs(this.amount);
});

// Virtual for transaction age in days
TransactionSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const diffTime = now.getTime() - this.date.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for isOverdue (for recurring transactions)
TransactionSchema.virtual('isOverdue').get(function() {
  if (!this.isRecurring || !this.nextDueDate) return false;
  return new Date() > this.nextDueDate;
});

// Indexes for better query performance
TransactionSchema.index({ type: 1, date: -1 });
TransactionSchema.index({ category: 1, date: -1 });
TransactionSchema.index({ propertyId: 1, date: -1 });
TransactionSchema.index({ tenantId: 1, date: -1 });
TransactionSchema.index({ ownerId: 1, date: -1 });
TransactionSchema.index({ status: 1, date: -1 });
TransactionSchema.index({ date: -1 });

module.exports = mongoose.model('Transaction', TransactionSchema);

