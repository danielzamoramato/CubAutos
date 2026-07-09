const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getAllAds, createAd, updateAd, deleteAd } = require('../controllers/adsControllers');

router.use(auth);

router.get('/', getAllAds);
router.post('/', createAd);
router.put('/:id', updateAd);
router.delete('/:id', deleteAd);

module.exports = router;