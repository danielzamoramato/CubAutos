const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');

router.get('/brands', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM brands ORDER BY name');
  res.json(rows);
});

router.get('/provinces', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM provinces ORDER BY name');
  res.json(rows);
});

router.get('/municipalities', async (req, res) => {
  const { province_id } = req.query;
  const { rows } = await pool.query(
    'SELECT * FROM municipalities WHERE province_id = $1 ORDER BY name',
    [province_id]
  );
  res.json(rows);
});

module.exports = router;