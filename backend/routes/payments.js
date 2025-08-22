const express = require('express');
const router = express.Router();

// Mock payments data (replace with actual MongoDB model later)
let payments = [
  {
    _id: '1',
    tenantId: '1',
    propertyId: '1',
    amount: 1500,
    dueDate: '2024-12-01',
    status: 'Pending'
  }
];

// Get all payments
router.get('/', async (req, res) => {
  try {
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new payment
router.post('/', async (req, res) => {
  try {
    const payment = {
      _id: Date.now().toString(),
      ...req.body,
      status: req.body.status || 'Pending'
    };
    payments.push(payment);
    res.status(201).json(payment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update payment
router.put('/:id', async (req, res) => {
  try {
    const index = payments.findIndex(p => p._id === req.params.id);
    if (index === -1) return res.status(404).json({ message: 'Payment not found' });
    
    payments[index] = { ...payments[index], ...req.body };
    res.json(payments[index]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete payment
router.delete('/:id', async (req, res) => {
  try {
    const index = payments.findIndex(p => p._id === req.params.id);
    if (index === -1) return res.status(404).json({ message: 'Payment not found' });
    
    payments.splice(index, 1);
    res.json({ message: 'Payment deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
