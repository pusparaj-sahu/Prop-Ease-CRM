const express = require('express');
const SupportTicket = require('../models/SupportTicket');
const router = express.Router();

// Create new support ticket
router.post('/', async (req, res) => {
  try {
    const ticket = await SupportTicket.create(req.body);
    res.status(201).json(ticket);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all support tickets with optional filtering
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      priority,
      category,
      tenantId,
      propertyId,
      assignedTo,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (tenantId) filter.tenantId = tenantId;
    if (propertyId) filter.propertyId = propertyId;
    if (assignedTo) filter.assignedTo = assignedTo;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    const tickets = await SupportTicket.find(filter)
      .populate('tenantId', 'name email phone')
      .populate('propertyId', 'name address city state')
      .populate('assignedTo', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await SupportTicket.countDocuments(filter);

    res.json({
      tickets,
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

// Get ticket by ID
router.get('/:id', async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('tenantId', 'name email phone')
      .populate('propertyId', 'name address city state')
      .populate('assignedTo', 'name email');
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    res.json(ticket);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update ticket
router.put('/:id', async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    )
    .populate('tenantId', 'name email phone')
    .populate('propertyId', 'name address city state')
    .populate('assignedTo', 'name email');
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    res.json(ticket);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Patch ticket (partial update)
router.patch('/:id', async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    )
    .populate('tenantId', 'name email phone')
    .populate('propertyId', 'name address city state')
    .populate('assignedTo', 'name email');
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    res.json(ticket);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete ticket
router.delete('/:id', async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndDelete(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    res.json({ message: 'Ticket deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get ticket statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await SupportTicket.aggregate([
      {
        $group: {
          _id: null,
          totalTickets: { $sum: 1 },
          openTickets: {
            $sum: { $cond: [{ $eq: ['$status', 'Open'] }, 1, 0] }
          },
          inProgressTickets: {
            $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] }
          },
          resolvedTickets: {
            $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] }
          }
        }
      }
    ]);

    const statusStats = await SupportTicket.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const priorityStats = await SupportTicket.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryStats = await SupportTicket.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const monthlyStats = await SupportTicket.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: -1 }
      },
      {
        $limit: 12
      }
    ]);

    res.json({
      overview: stats[0] || {},
      statusDistribution: statusStats,
      priorityDistribution: priorityStats,
      categoryDistribution: categoryStats,
      monthlyTrend: monthlyStats
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Search tickets
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const searchFilter = {
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ]
    };

    const skip = (page - 1) * limit;

    const tickets = await SupportTicket.find(searchFilter)
      .populate('tenantId', 'name email phone')
      .populate('propertyId', 'name address city state')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await SupportTicket.countDocuments(searchFilter);

    res.json({
      tickets,
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

// Add progress update to ticket
router.post('/:id/progress', async (req, res) => {
  try {
    const { status, notes, updatedBy } = req.body;
    
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.progress.push({
      date: new Date(),
      status,
      notes,
      updatedBy
    });

    // Update main status if provided
    if (status) {
      ticket.status = status;
    }

    await ticket.save();
    
    const updatedTicket = await SupportTicket.findById(req.params.id)
      .populate('tenantId', 'name email phone')
      .populate('propertyId', 'name address city state')
      .populate('assignedTo', 'name email');

    res.json(updatedTicket);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Add communication to ticket
router.post('/:id/communications', async (req, res) => {
  try {
    const { type, message, from, to } = req.body;
    
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.communications.push({
      date: new Date(),
      type,
      message,
      from,
      to
    });

    await ticket.save();
    
    const updatedTicket = await SupportTicket.findById(req.params.id)
      .populate('tenantId', 'name email phone')
      .populate('propertyId', 'name address city state')
      .populate('assignedTo', 'name email');

    res.json(updatedTicket);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Resolve ticket
router.post('/:id/resolve', async (req, res) => {
  try {
    const { description, completedBy, tenantSatisfaction } = req.body;
    
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.status = 'Resolved';
    ticket.resolution = {
      description,
      completedBy,
      completedAt: new Date(),
      tenantSatisfaction
    };

    await ticket.save();
    
    const updatedTicket = await SupportTicket.findById(req.params.id)
      .populate('tenantId', 'name email phone')
      .populate('propertyId', 'name address city state')
      .populate('assignedTo', 'name email');

    res.json(updatedTicket);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get tickets by SLA status
router.get('/sla/status', async (req, res) => {
  try {
    const { status } = req.query;
    
    let filter = { status: { $nin: ['Resolved', 'Closed'] } };
    
    if (status === 'breached') {
      filter['sla.breached'] = true;
    } else if (status === 'atRisk') {
      filter['sla.breached'] = false;
      filter['sla.targetResolutionTime'] = { $exists: true };
    }

    const tickets = await SupportTicket.find(filter)
      .populate('tenantId', 'name email phone')
      .populate('propertyId', 'name address city state')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: 1 });

    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

