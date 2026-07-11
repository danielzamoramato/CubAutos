const express = require('express');
const pool = require('../db/pool')
const multer = require('multer');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createCar, updateCar, deleteCar,
  addImages, deleteImageById, setCover, setFeatured,
} = require('../controllers/carsController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes'));
  },
});

router.use(auth);

router.patch('/cars/:id/featured', setFeatured);

router.get('/cars', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.model, c.year, c.price, c.is_used, c.is_active, c.views,
              c.is_featured, c.featured_until,
              b.name AS brand, p.name AS province
       FROM cars c
       LEFT JOIN brands b ON b.id = c.brand_id
       LEFT JOIN provinces p ON p.id = c.province_id
       ORDER BY c.created_at DESC`
    )
    res.json({ cars: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener carros' })
  }
})

router.post('/cars', upload.array('images', 20), createCar);
router.put('/cars/:id', updateCar);
router.delete('/cars/:id', deleteCar);
router.post('/cars/:id/images', upload.array('images', 20), addImages);
router.delete('/images/:imageId', deleteImageById);
router.patch('/images/:imageId/cover', setCover);

router.patch('/cars/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params
    const { is_active } = req.body
    await pool.query('UPDATE cars SET is_active = $1 WHERE id = $2', [is_active, id])
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al actualizar' })
  }
})

module.exports = router;