const pool = require('../db/pool');

const getAdsByPlacement = async (req, res) => {
  try {
    const { placement } = req.params;
    const today = new Date().toISOString().slice(0, 10);

    const { rows } = await pool.query(
      `SELECT id, title, image_url, link_url
       FROM ads
       WHERE placement = $1
         AND is_active = true
         AND (starts_at IS NULL OR starts_at <= $2)
         AND (ends_at IS NULL OR ends_at >= $2)
       ORDER BY created_at ASC`,
      [placement, today]
    );

    res.json({ ads: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener anuncios' });
  }
};

const registerClick = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE ads SET clicks = clicks + 1 WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar click' });
  }
};

// ─── Admin ──────────────────────────────────────────────────

const getAllAds = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM ads ORDER BY created_at DESC');
    res.json({ ads: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener anuncios' });
  }
};

const createAd = async (req, res) => {
  try {
    const { title, image_url, link_url, placement, starts_at, ends_at } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO ads (title, image_url, link_url, placement, starts_at, ends_at)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [title, image_url, link_url, placement, starts_at || null, ends_at || null]
    );
    res.status(201).json({ id: rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear anuncio' });
  }
};

const updateAd = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, image_url, link_url, placement, starts_at, ends_at, is_active } = req.body;
    await pool.query(
      `UPDATE ads SET title=$1, image_url=$2, link_url=$3, placement=$4,
       starts_at=$5, ends_at=$6, is_active=$7 WHERE id=$8`,
      [title, image_url, link_url, placement, starts_at || null, ends_at || null, is_active ?? true, id]
    );
    res.json({ message: 'Anuncio actualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar anuncio' });
  }
};

const deleteAd = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM ads WHERE id = $1', [id]);
    res.json({ message: 'Anuncio eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar anuncio' });
  }
};

module.exports = {
  getAdsByPlacement, registerClick,
  getAllAds, createAd, updateAd, deleteAd,
};