const express = require('express');
const router = express.Router();
const { getCars, getCarById, getRelatedCars  } = require('../controllers/carsController');

router.get('/', getCars);
router.get('/:id/related', getRelatedCars);
router.get('/:id', getCarById);

module.exports = router;