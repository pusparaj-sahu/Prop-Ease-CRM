const express = require('express');
const Owner = require('../models/Owner');
const Property = require('../models/Property');
const router = express.Router();

// Create new owner
router.post('/', async (req, res) => {
  try {
    const owner = await Owner.create(req.body);
    res.status(201).json(owner);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all owners with optional filtering
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      city,
      state,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (state) filter.state = { $regex: state, $options: 'i' };

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    const owners = await Owner.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Owner.countDocuments(filter);

    res.json({
      owners,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: Number(limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get owner by ID with properties
router.get('/:id', async (req, res) => {
  try {
    const owner = await Owner.findById(req.params.id);
    if (!owner) {
      return res.status(404).json({ message: 'Owner not found' });
    }

    // Get properties owned by this owner
    const properties = await Property.find({ ownerId: owner._id })
      .populate('tenantId', 'name email phone leaseEnd');

    const ownerWithProperties = owner.toObject();
    ownerWithProperties.properties = properties;
    
    res.json(ownerWithProperties);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update owner
router.put('/:id', async (req, res) => {
  try {
    const owner = await Owner.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!owner) {
      return res.status(404).json({ message: 'Owner not found' });
    }
    
    res.json(owner);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Patch owner (partial update)
router.patch('/:id', async (req, res) => {
  try {
    const owner = await Owner.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!owner) {
      return res.status(404).json({ message: 'Owner not found' });
    }
    
    res.json(owner);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete owner
router.delete('/:id', async (req, res) => {
  try {
    // Check if owner has properties
    const propertyCount = await Property.countDocuments({ ownerId: req.params.id });
    if (propertyCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete owner. They own ${propertyCount} properties.` 
      });
    }

    const owner = await Owner.findByIdAndDelete(req.params.id);
    
    if (!owner) {
      return res.status(404).json({ message: 'Owner not found' });
    }
    
    res.json({ message: 'Owner deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get owner statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await Owner.aggregate([
      {
        $group: {
          _id: null,
          totalOwners: { $sum: 1 },
          activeOwners: {
            $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] }
          }
        }
      }
    ]);

    const statusStats = await Owner.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const cityStats = await Owner.aggregate([
      {
        $group: {
          _id: '$city',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      overview: stats[0] || {},
      statusDistribution: statusStats,
      topCities: cityStats
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Search owners
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const searchFilter = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
        { address: { $regex: query, $options: 'i' } },
        { city: { $regex: query, $options: 'i' } },
        { state: { $regex: query, $options: 'i' } },
        { companyName: { $regex: query, $options: 'i' } }
      ]
    };

    const skip = (page - 1) * limit;

    const owners = await Owner.find(searchFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Owner.countDocuments(searchFilter);

    res.json({
      owners,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: Number(limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get owner portfolio summary
router.get('/:id/portfolio', async (req, res) => {
  try {
    const owner = await Owner.findById(req.params.id);
    if (!owner) {
      return res.status(404).json({ message: 'Owner not found' });
    }

    const properties = await Property.find({ ownerId: owner._id });
    
    const portfolio = {
      owner: {
        name: owner.name,
        email: owner.email,
        phone: owner.phone
      },
      properties: {
        total: properties.length,
        available: properties.filter(p => p.status === 'Available').length,
        rented: properties.filter(p => p.status === 'Rented').length,
        maintenance: properties.filter(p => p.status === 'Under Maintenance').length
      },
      financial: {
        totalRent: properties.reduce((sum, p) => sum + (p.rent || 0), 0),
        totalValue: properties.reduce((sum, p) => sum + (p.purchasePrice || 0), 0),
        averageRent: properties.length > 0 ? 
          properties.reduce((sum, p) => sum + (p.rent || 0), 0) / properties.length : 0
      },
      occupancy: {
        rate: properties.length > 0 ? 
          (properties.filter(p => p.status === 'Rented').length / properties.length) * 100 : 0
      }
    };

    res.json(portfolio);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add document to owner
router.post('/:id/documents', async (req, res) => {
  try {
    const { name, url, type } = req.body;
    
    const owner = await Owner.findById(req.params.id);
    if (!owner) {
      return res.status(404).json({ message: 'Owner not found' });
    }

    owner.documents.push({
      name,
      url,
      type,
      uploadedAt: new Date()
    });

    await owner.save();
    res.json(owner);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;

