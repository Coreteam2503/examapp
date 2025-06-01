const express = require('express');
const router = express.Router();

// Placeholder routes for file uploads
router.post('/', (req, res) => {
  res.json({ message: 'File upload endpoint - coming soon' });
});

router.get('/', (req, res) => {
  res.json({ message: 'List uploads endpoint - coming soon' });
});

module.exports = router;
