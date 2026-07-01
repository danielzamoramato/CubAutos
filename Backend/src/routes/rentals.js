const express = require('express');
const router = express.Router();
const { getRentals, getRentalById } = require('../controllers/rentalsController');

router.get('/', getRentals);
router.get('/:id', getRentalById);

module.exports = router;