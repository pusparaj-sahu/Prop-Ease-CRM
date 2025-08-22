const mongoose = require('mongoose');

const SupportTicketSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    priority: { 
      type: String, 
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    status: { 
      type: String, 
      enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
      default: 'Open'
    },
    category: { 
      type: String, 
      enum: ['Maintenance', 'HVAC', 'Plumbing', 'Electrical', 'Parking', 'Security', 'Noise', 'Other'],
      required: true
    },
    
    // Related entities
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Staff member assigned
    
    // Location details
    location: {
      unit: String,
      area: String, // kitchen, bathroom, etc.
      specificLocation: String
    },
    
    // Scheduling
    preferredDate: { type: Date },
    preferredTime: { type: String, enum: ['Morning', 'Afternoon', 'Evening', 'Any'] },
    estimatedDuration: { type: Number }, // in hours
    
    // Cost information
    estimatedCost: { type: Number, min: 0 },
    actualCost: { type: Number, min: 0 },
    costApproved: { type: Boolean, default: false },
    
    // Progress tracking
    progress: [{
      date: { type: Date, default: Date.now },
      status: String,
      notes: String,
      updatedBy: String
    }],
    
    // Attachments
    attachments: [{
      name: String,
      url: String,
      type: String,
      uploadedAt: { type: Date, default: Date.now }
    }],
    
    // Communication history
    communications: [{
      date: { type: Date, default: Date.now },
      type: { type: String, enum: ['Email', 'Phone', 'SMS', 'In-Person'] },
      message: String,
      from: String,
      to: String
    }],
    
    // Resolution
    resolution: {
      description: String,
      completedBy: String,
      completedAt: Date,
      tenantSatisfaction: { type: Number, min: 1, max: 5 }
    },
    
    // Tags and categorization
    tags: [{ type: String, trim: true }],
    urgency: { type: String, enum: ['Normal', 'Urgent', 'Emergency'] },
    
    // SLA tracking
    sla: {
      targetResolutionTime: { type: Number }, // in hours
      actualResolutionTime: { type: Number }, // in hours
      breached: { type: Boolean, default: false }
    }
  },
  { 
    timestamps: { createdAt: true, updatedAt: true },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for ticket age in days
SupportTicketSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const diffTime = now.getTime() - this.createdAt.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for SLA status
SupportTicketSchema.virtual('slaStatus').get(function() {
  if (this.status === 'Resolved' || this.status === 'Closed') {
    return 'Completed';
  }
  
  if (!this.sla.targetResolutionTime) return 'No SLA';
  
  const ageInHours = this.ageInDays * 24;
  if (ageInHours > this.sla.targetResolutionTime) {
    return 'Breached';
  } else if (ageInHours > this.sla.targetResolutionTime * 0.8) {
    return 'At Risk';
  }
  return 'On Track';
});

// Indexes for better query performance (removed duplicates)
SupportTicketSchema.index({ category: 1, status: 1 });
SupportTicketSchema.index({ tenantId: 1, createdAt: -1 });
SupportTicketSchema.index({ propertyId: 1, status: 1 });
SupportTicketSchema.index({ assignedTo: 1, status: 1 });
SupportTicketSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SupportTicket', SupportTicketSchema);
