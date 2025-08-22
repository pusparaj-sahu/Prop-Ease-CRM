const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, default: 'USA', trim: true },
    type: { 
      type: String, 
      enum: ['Apartment', 'House', 'Commercial', 'Land', 'Office', 'Retail'],
      required: true 
    },
    status: { 
      type: String, 
      enum: ['Available', 'Rented', 'Under Maintenance', 'Sold', 'Reserved'],
      default: 'Available'
    },
    rent: { type: Number, required: true, min: 0 },
    purchasePrice: { type: Number, min: 0 },
    bedrooms: { type: Number, min: 0 },
    bathrooms: { type: Number, min: 0 },
    area: { type: Number, min: 0 }, // in square feet
    yearBuilt: { type: Number },
    description: { type: String, trim: true },
    features: [{ type: String, trim: true }], // Array of features
    amenities: [{ type: String, trim: true }], // Array of amenities
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' }, // Current tenant
    images: [{ type: String }], // Array of image URLs
    documents: [{ 
      name: String,
      url: String,
      type: String,
      uploadedAt: { type: Date, default: Date.now }
    }],
    location: {
      latitude: Number,
      longitude: Number
    },
    propertyTax: { type: Number, min: 0 },
    insurance: { type: Number, min: 0 },
    utilities: { type: Number, min: 0 },
    maintenanceCost: { type: Number, min: 0 },
    occupancyRate: { type: Number, min: 0, max: 100, default: 0 },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    tags: [{ type: String, trim: true }]
  },
  { 
    timestamps: { createdAt: true, updatedAt: true },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for total monthly expenses
PropertySchema.virtual('totalMonthlyExpenses').get(function() {
  return (this.propertyTax || 0) + (this.insurance || 0) + (this.utilities || 0) + (this.maintenanceCost || 0);
});

// Virtual for net monthly income
PropertySchema.virtual('netMonthlyIncome').get(function() {
  return (this.rent || 0) - this.totalMonthlyExpenses;
});

// Indexes for better query performance (removed duplicates)
PropertySchema.index({ city: 1, state: 1 });
PropertySchema.index({ type: 1, status: 1 });
PropertySchema.index({ rent: 1 });
PropertySchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

module.exports = mongoose.model('Property', PropertySchema);
