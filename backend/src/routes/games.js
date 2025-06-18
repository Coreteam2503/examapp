const express = require('express');
const router = express.Router();
const gameFormatController = require('../controllers/gameFormatController');
const { authenticateToken } = require('../middleware/auth');
const { validateGameFormat, validateId } = require('../middleware/validation');

// Generate game format quiz
router.post('/generate', authenticateToken, validateGameFormat, gameFormatController.generateGameFormat);

// Get game by ID
router.get('/:id', authenticateToken, validateId(), gameFormatController.getGameById);

module.exports = router;
