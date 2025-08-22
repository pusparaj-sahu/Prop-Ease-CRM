const express = require('express');
const router = express.Router();
const { groq } = require('../sanity/client');

router.get('/properties', async (req, res) => {
  try {
    const query = `*[_type == "property"]{_id, name, address, city, state, rent, owner->{_id, name}} | order(name asc)`;
    const result = await groq(query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch properties', error: err.message });
  }
});

router.get('/tenants', async (req, res) => {
  try {
    const query = `*[_type == "tenant"]{_id, name, email, phone, property->{_id, name}} | order(name asc)`;
    const result = await groq(query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tenants', error: err.message });
  }
});

module.exports = router;


