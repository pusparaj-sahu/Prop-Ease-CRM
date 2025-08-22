const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    dueDate: { type: Date, required: false },
    status: { 
      type: String, 
      enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Pending'
    },
    priority: { 
      type: String, 
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    relatedLead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: false },
    relatedProperty: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: false },
    relatedTenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: false },
    
    // Task details
    category: { 
      type: String, 
      enum: ['Follow-up', 'Maintenance', 'Inspection', 'Documentation', 'Meeting', 'Other'],
      default: 'Other'
    },
    estimatedDuration: { type: Number }, // in hours
    actualDuration: { type: Number }, // in hours
    
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

// Virtual for task age in days
TaskSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const diffTime = now.getTime() - this.createdAt.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for overdue status
TaskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'Completed') return false;
  return new Date() > this.dueDate;
});

// Virtual for days until due
TaskSchema.virtual('daysUntilDue').get(function() {
  if (!this.dueDate) return null;
  
  const now = new Date();
  const diffTime = this.dueDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Indexes for better query performance (removed duplicates)
TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ dueDate: 1, status: 1 });
TaskSchema.index({ category: 1, status: 1 });

module.exports = mongoose.model('Task', TaskSchema);


