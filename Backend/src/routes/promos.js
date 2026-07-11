const express = require('express');
const router = express.Router();
const { getAdsByPlacement, registerClick } = require('../controllers/promosControllers');

router.get('/:placement', getAdsByPlacement);
router.post('/:id/click', registerClick);

module.exports = router;