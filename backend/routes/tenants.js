const express = require('express');
const Tenant = require('../models/Tenant');
const router = express.Router();

// Create new tenant
router.post('/', async (req, res) => {
  try {
    const tenant = await Tenant.create(req.body);
    res.status(201).json(tenant);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all tenants with optional filtering
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      propertyId,
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
    if (propertyId) filter.propertyId = propertyId;
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (state) filter.state = { $regex: state, $options: 'i' };

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    const tenants = await Tenant.find(filter)
      .populate('propertyId', 'name address city state')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Tenant.countDocuments(filter);

    res.json({
      tenants,
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

// Get tenant by ID
router.get('/:id', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id)
      .populate('propertyId', 'name address city state rent')
      .populate('documents');
    
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    res.json(tenant);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update tenant
router.put('/:id', async (req, res) => {
  try {
    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    ).populate('propertyId', 'name address city state');
    
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    res.json(tenant);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Patch tenant (partial update)
router.patch('/:id', async (req, res) => {
  try {
    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    ).populate('propertyId', 'name address city state');
    
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    res.json(tenant);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete tenant
router.delete('/:id', async (req, res) => {
  try {
    const tenant = await Tenant.findByIdAndDelete(req.params.id);
    
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    res.json({ message: 'Tenant deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get tenant statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await Tenant.aggregate([
      {
        $group: {
          _id: null,
          totalTenants: { $sum: 1 },
          totalRent: { $sum: '$rentAmount' },
          averageRent: { $avg: '$rentAmount' },
          totalSecurityDeposit: { $sum: '$securityDeposit' }
        }
      }
    ]);

    const statusStats = await Tenant.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const leaseExpiryStats = await Tenant.aggregate([
      {
        $match: {
          status: 'Active',
          leaseEnd: { $gte: new Date() }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$leaseEnd' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      overview: stats[0] || {},
      statusDistribution: statusStats,
      leaseExpiryDistribution: leaseExpiryStats
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Search tenants
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
        { state: { $regex: query, $options: 'i' } }
      ]
    };

    const skip = (page - 1) * limit;

    const tenants = await Tenant.find(searchFilter)
      .populate('propertyId', 'name address city state')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Tenant.countDocuments(searchFilter);

    res.json({
      tenants,
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

// Get tenants with expiring leases
router.get('/leases/expiring', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + Number(days));

    const tenants = await Tenant.find({
      status: 'Active',
      leaseEnd: { $lte: expiryDate }
    })
    .populate('propertyId', 'name address city state')
    .sort({ leaseEnd: 1 });

    res.json(tenants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add payment to tenant history
router.post('/:id/payments', async (req, res) => {
  try {
    const { amount, status, notes } = req.body;
    
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    tenant.paymentHistory.push({
      date: new Date(),
      amount,
      status,
      notes
    });

    await tenant.save();
    res.json(tenant);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;

