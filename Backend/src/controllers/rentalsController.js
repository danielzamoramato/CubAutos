const pool = require('../db/pool');
const { uploadStream, deleteImage } = require('../lib/cloudinary');

// ─── PÚBLICO ────────────────────────────────────────────────

const getRentals = async (req, res) => {
  try {
    const { q, brand, transmission, min_price, max_price, province, municipality_id, sort, page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    const conditions = ['r.is_active = true'];
    const values = [];
    let i = 1;

    if (q) {
      conditions.push(`(
        LOWER(b.name) LIKE LOWER($${i}) OR
        LOWER(r.model) LIKE LOWER($${i}) OR
        LOWER(r.description) LIKE LOWER($${i})
      )`);
      values.push(`%${q}%`);
      i++;
    }
    if (brand) { conditions.push(`r.brand_id = $${i}`); values.push(brand); i++; }
    if (transmission) { conditions.push(`r.transmission = $${i}`); values.push(transmission); i++; }
    if (min_price) { conditions.push(`r.price_per_day >= $${i}`); values.push(Number(min_price)); i++; }
    if (max_price) { conditions.push(`r.price_per_day <= $${i}`); values.push(Number(max_price)); i++; }
    if (province) { conditions.push(`r.province_id = $${i}`); values.push(province); i++; }
    if (municipality_id) { conditions.push(`r.municipality_id = $${i}`); values.push(municipality_id); i++; }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const sortOptions = {
      recent: 'r.created_at DESC',
      price_asc: 'r.price_per_day ASC',
      price_desc: 'r.price_per_day DESC',
    };
    const orderBy = sortOptions[sort] || sortOptions.recent;

    const [countResult, result] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) FROM rentals r
         JOIN brands b ON r.brand_id = b.id
         ${where}`,
        values
      ),
      pool.query(
        `SELECT
           r.id, r.model, r.year, r.price_per_day, r.transmission, r.seats,
           r.owner_phone, r.created_at,
           b.name AS brand,
           p.name AS province,
           m.name AS municipality,
           img.url AS cover_image
         FROM rentals r
         JOIN brands b ON r.brand_id = b.id
         LEFT JOIN provinces p ON r.province_id = p.id
         LEFT JOIN municipalities m ON r.municipality_id = m.id
         LEFT JOIN rental_images img ON img.rental_id = r.id AND img.is_cover = true
         ${where}
         ORDER BY ${orderBy}
         LIMIT $${i} OFFSET $${i + 1}`,
        [...values, limit, offset]
      ),
    ]);

    const total = parseInt(countResult.rows[0].count);

    res.json({
      rentals: result.rows,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener los carros de renta' });
  }
};

const getRentalById = async (req, res) => {
  try {
    const { id } = req.params;

    pool.query('UPDATE rentals SET views = views + 1 WHERE id = $1', [id]).catch(console.error);

    const [rentalResult, imagesResult] = await Promise.all([
      pool.query(
        `SELECT
           r.*,
           b.name AS brand,
           p.name AS province,
           m.name AS municipality
         FROM rentals r
         JOIN brands b ON r.brand_id = b.id
         LEFT JOIN provinces p ON r.province_id = p.id
         LEFT JOIN municipalities m ON r.municipality_id = m.id
         WHERE r.id = $1 AND r.is_active = true`,
        [id]
      ),
      pool.query(
        `SELECT id, url, is_cover, order_index
         FROM rental_images
         WHERE rental_id = $1
         ORDER BY order_index ASC`,
        [id]
      ),
    ]);

    if (!rentalResult.rows.length) {
      return res.status(404).json({ error: 'Carro de renta no encontrado' });
    }

    res.json({
      ...rentalResult.rows[0],
      images: imagesResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener el carro de renta' });
  }
};

// ─── ADMIN ──────────────────────────────────────────────────

const createRental = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      brand_id, model, year, price_per_day, transmission, seats,
      description, province_id, municipality_id,
      owner_name, owner_phone,
    } = req.body;

    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO rentals
         (brand_id, model, year, price_per_day, transmission, seats, description,
          province_id, municipality_id, owner_name, owner_phone)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id`,
      [brand_id, model, year, price_per_day,
       transmission || 'manual', seats || null,
       description, province_id, municipality_id,
       owner_name, owner_phone]
    );

    const rentalId = result.rows[0].id;

    if (req.files && req.files.length > 0) {
      for (let idx = 0; idx < req.files.length; idx++) {
        const file = req.files[idx];
        const uploaded = await uploadStream(file.buffer);

        await client.query(
          `INSERT INTO rental_images (rental_id, url, public_id, is_cover, order_index)
           VALUES ($1, $2, $3, $4, $5)`,
          [rentalId, uploaded.secure_url, uploaded.public_id, idx === 0, idx]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ id: rentalId, message: 'Carro de renta creado exitosamente' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error al crear el carro de renta' });
  } finally {
    client.release();
  }
};

const updateRental = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      brand_id, model, year, price_per_day, transmission, seats,
      description, province_id, municipality_id,
      owner_name, owner_phone, is_active,
    } = req.body;

    await pool.query(
      `UPDATE rentals SET
         brand_id=$1, model=$2, year=$3, price_per_day=$4,
         transmission=$5, seats=$6, description=$7,
         province_id=$8, municipality_id=$9,
         owner_name=$10, owner_phone=$11,
         is_active=$12
       WHERE id=$13`,
      [brand_id, model, year, price_per_day,
       transmission || 'manual', seats || null,
       description, province_id, municipality_id,
       owner_name, owner_phone,
       is_active ?? true, id]
    );

    res.json({ message: 'Carro de renta actualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar el carro de renta' });
  }
};

const deleteRental = async (req, res) => {
  try {
    const { id } = req.params;

    const images = await pool.query(
      'SELECT public_id FROM rental_images WHERE rental_id = $1', [id]
    );
    await Promise.all(images.rows.map(img => deleteImage(img.public_id)));

    await pool.query('DELETE FROM rentals WHERE id = $1', [id]);
    res.json({ message: 'Carro de renta eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar el carro de renta' });
  }
};

const addRentalImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { cover_index } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se enviaron imágenes' });
    }

    const lastIdx = await pool.query(
      'SELECT COALESCE(MAX(order_index), -1) AS max FROM rental_images WHERE rental_id = $1', [id]
    );
    let nextIdx = lastIdx.rows[0].max + 1;

    const existingCount = await pool.query(
      'SELECT COUNT(*) FROM rental_images WHERE rental_id = $1', [id]
    );
    const isFirstUpload = parseInt(existingCount.rows[0].count) === 0;

    const uploaded = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const result = await uploadStream(file.buffer);

      const isCover = isFirstUpload && (
        cover_index !== undefined ? i === Number(cover_index) : i === 0
      );

      await pool.query(
        `INSERT INTO rental_images (rental_id, url, public_id, is_cover, order_index)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, result.secure_url, result.public_id, isCover, nextIdx]
      );
      uploaded.push({ url: result.secure_url, order_index: nextIdx });
      nextIdx++;
    }

    res.status(201).json({ uploaded });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al subir imágenes' });
  }
};

const deleteRentalImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    const result = await pool.query(
      'SELECT public_id, rental_id, is_cover FROM rental_images WHERE id = $1', [imageId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }

    const { public_id, rental_id, is_cover } = result.rows[0];
    await deleteImage(public_id);
    await pool.query('DELETE FROM rental_images WHERE id = $1', [imageId]);

    if (is_cover) {
      await pool.query(
        `UPDATE rental_images SET is_cover = true
         WHERE rental_id = $1 AND id = (
           SELECT id FROM rental_images WHERE rental_id = $1 ORDER BY order_index ASC LIMIT 1
         )`,
        [rental_id]
      );
    }

    res.json({ message: 'Imagen eliminada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar la imagen' });
  }
};

const setRentalCover = async (req, res) => {
  try {
    const { imageId } = req.params;

    const img = await pool.query(
      'SELECT rental_id FROM rental_images WHERE id = $1', [imageId]
    );
    if (!img.rows.length) return res.status(404).json({ error: 'Imagen no encontrada' });

    const { rental_id } = img.rows[0];

    await pool.query('UPDATE rental_images SET is_cover = false WHERE rental_id = $1', [rental_id]);
    await pool.query('UPDATE rental_images SET is_cover = true WHERE id = $1', [imageId]);

    res.json({ message: 'Portada actualizada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar portada' });
  }
};

const toggleRentalActive = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    await pool.query('UPDATE rentals SET is_active = $1 WHERE id = $2', [is_active, id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar' });
  }
};

const getAdminRentals = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.id, r.model, r.year, r.price_per_day, r.transmission, r.is_active, r.views,
              b.name AS brand, p.name AS province
       FROM rentals r
       LEFT JOIN brands b ON b.id = r.brand_id
       LEFT JOIN provinces p ON p.id = r.province_id
       ORDER BY r.created_at DESC`
    );
    res.json({ rentals: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener carros de renta' });
  }
};

module.exports = {
  getRentals, getRentalById, getAdminRentals,
  createRental, updateRental, deleteRental,
  addRentalImages, deleteRentalImage, setRentalCover, toggleRentalActive,
};