const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const {
  getAdminRentals, createRental, updateRental, deleteRental,
  addRentalImages, deleteRentalImage, setRentalCover, toggleRentalActive,
} = require('../controllers/rentalsController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes'));
  },
});

router.use(auth);

router.get('/', getAdminRentals);
router.post('/', upload.array('images', 20), createRental);
router.put('/:id', updateRental);
router.delete('/:id', deleteRental);
router.post('/:id/images', upload.array('images', 20), addRentalImages);
router.delete('/images/:imageId', deleteRentalImage);
router.patch('/images/:imageId/cover', setRentalCover);
router.patch('/:id/toggle', toggleRentalActive);

module.exports = router;