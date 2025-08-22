const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: false, trim: true, lowercase: true },
    phone: { type: String, required: false, trim: true },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Site Visit', 'Closed'],
      default: 'New',
      index: true,
    },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: false, index: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    
    // Additional lead information
    source: { 
      type: String, 
      enum: ['Website', 'Referral', 'Social Media', 'Advertisement', 'Walk-in', 'Other'],
      default: 'Website'
    },
    budget: { type: Number, min: 0 },
    preferredLocation: { type: String, trim: true },
    moveInDate: { type: Date },
    notes: { type: String, trim: true },
    
    // Contact preferences
    preferredContact: { 
      type: String, 
      enum: ['Email', 'Phone', 'SMS', 'Any'],
      default: 'Any'
    },
    
    // Follow-up tracking
    lastContact: { type: Date },
    nextFollowUp: { type: Date },
    contactHistory: [{
      date: { type: Date, default: Date.now },
      method: String,
      notes: String,
      outcome: String
    }],
    
    // Tags for categorization
    tags: [{ type: String, trim: true }]
  },
  { 
    timestamps: { createdAt: true, updatedAt: true },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for lead age in days
LeadSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const diffTime = now.getTime() - this.createdAt.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for next follow-up status
LeadSchema.virtual('followUpStatus').get(function() {
  if (!this.nextFollowUp) return 'No Follow-up Scheduled';
  
  const now = new Date();
  const diffTime = this.nextFollowUp.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Due Today';
  if (diffDays <= 3) return 'Due Soon';
  return 'Scheduled';
});

// Indexes for better query performance (removed duplicates)
LeadSchema.index({ assignedTo: 1, status: 1 });
LeadSchema.index({ source: 1, status: 1 });
LeadSchema.index({ nextFollowUp: 1 });

module.exports = mongoose.model('Lead', LeadSchema);


