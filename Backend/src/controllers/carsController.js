const pool = require('../db/pool');
const { uploadStream, deleteImage } = require('../lib/cloudinary');

// ─── PÚBLICO ────────────────────────────────────────────────

const getCars = async (req, res) => {
  try {
    const {
      q,
      brand_id,
      is_used,
      min_price,
      max_price,
      province_id,
      municipality_id,
      sort,
      electric,
      vehicle_type,
      page = 1,
      limit = 12
    } = req.query;

    const currentPage = Number(page) || 1;
    const currentLimit = Number(limit) || 12;
    const offset = (currentPage - 1) * currentLimit;

    const conditions = ['c.is_active = true'];
    const values = [];
    let i = 1;

    const normalizedQ = typeof q === 'string' ? q.trim() : '';
    if (normalizedQ) {
      conditions.push(`(
        LOWER(b.name) LIKE LOWER($${i}) OR
        LOWER(c.model) LIKE LOWER($${i}) OR
        LOWER(c.description) LIKE LOWER($${i})
      )`);
      values.push(`%${normalizedQ}%`);
      i++;
    }

    if (brand_id !== undefined && brand_id !== '') {
      conditions.push(`c.brand_id = $${i}`);
      values.push(Number(brand_id));
      i++;
    }

    if (is_used === 'true' || is_used === 'false') {
      conditions.push(`c.is_used = $${i}`);
      values.push(is_used === 'true');
      i++;
    }

    if (min_price !== undefined && min_price !== '') {
      conditions.push(`c.price >= $${i}`);
      values.push(Number(min_price));
      i++;
    }

    if (max_price !== undefined && max_price !== '') {
      conditions.push(`c.price <= $${i}`);
      values.push(Number(max_price));
      i++;
    }

    if (province_id !== undefined && province_id !== '') {
      conditions.push(`c.province_id = $${i}`);
      values.push(Number(province_id));
      i++;
    }

    if (municipality_id !== undefined && municipality_id !== '') {
      conditions.push(`c.municipality_id = $${i}`);
      values.push(Number(municipality_id));
      i++;
    }

    if (vehicle_type) {
      conditions.push(`c.vehicle_type = $${i}`);
      values.push(vehicle_type);
      i++;
    }

    if (electric === 'true' || electric === 'false') {
      conditions.push(`c.is_electric = $${i}`);
      values.push(electric === 'true');
      i++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const sortOptions = {
      recent: 'c.created_at DESC',
      price_asc: 'c.price ASC',
      price_desc: 'c.price DESC',
    };
    const orderBy = sortOptions[sort] || sortOptions.recent;
    const finalOrderBy = `(c.is_featured AND c.featured_until > NOW()) DESC, ${orderBy}`;

    const [countResult, result] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) FROM cars c
         JOIN brands b ON c.brand_id = b.id
         ${where}`,
        values
      ),
      pool.query(
        `SELECT
           c.id, c.model, c.year, c.price, c.is_used, c.km, c.is_electric,
           c.is_featured, c.featured_until, c.vehicle_type,
           c.owner_phone, c.created_at,
           b.name AS brand,
           p.name AS province,
           m.name AS municipality,
           img.url AS cover_image
         FROM cars c
         JOIN brands b ON c.brand_id = b.id
         LEFT JOIN provinces p ON c.province_id = p.id
         LEFT JOIN municipalities m ON c.municipality_id = m.id
         LEFT JOIN car_images img ON img.car_id = c.id AND img.is_cover = true
         ${where}
         ORDER BY ${finalOrderBy}
         LIMIT $${i} OFFSET $${i + 1}`,
        [...values, currentLimit, offset]
      ),
    ]);

    const total = parseInt(countResult.rows[0].count);

    res.json({
      cars: result.rows,
      total,
      page: currentPage,
      pages: Math.ceil(total / currentLimit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener los carros' });
  }
};

const getRelatedCars = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener marca y provincia del carro actual
    const current = await pool.query(
      'SELECT brand_id, province_id FROM cars WHERE id = $1', [id]
    );

    if (!current.rows.length) {
      return res.json({ cars: [] });
    }

    const { brand_id, province_id } = current.rows[0];

    const result = await pool.query(
      `SELECT
         c.id, c.model, c.year, c.price, c.is_used, c.km,
         b.name AS brand,
         p.name AS province,
         m.name AS municipality,
         img.url AS cover_image
       FROM cars c
       JOIN brands b ON c.brand_id = b.id
       LEFT JOIN provinces p ON c.province_id = p.id
       LEFT JOIN municipalities m ON c.municipality_id = m.id
       LEFT JOIN car_images img ON img.car_id = c.id AND img.is_cover = true
       WHERE c.is_active = true
         AND c.id != $1
         AND (c.brand_id = $2 OR c.province_id = $3)
       ORDER BY (c.brand_id = $2) DESC, c.created_at DESC
       LIMIT 4`,
      [id, brand_id, province_id]
    );

    res.json({ cars: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener carros relacionados' });
  }
};

const getCarById = async (req, res) => {
  try {
    const { id } = req.params;

    // No esperamos el incremento de vistas — no bloquea la respuesta
    pool.query('UPDATE cars SET views = views + 1 WHERE id = $1', [id]).catch(console.error);

    const [carResult, imagesResult] = await Promise.all([
      pool.query(
        `SELECT
           c.*,
           b.name AS brand,
           p.name AS province,
           m.name AS municipality
         FROM cars c
         JOIN brands b ON c.brand_id = b.id
         LEFT JOIN provinces p ON c.province_id = p.id
         LEFT JOIN municipalities m ON c.municipality_id = m.id
         WHERE c.id = $1 AND c.is_active = true`,
        [id]
      ),
      pool.query(
        `SELECT id, url, is_cover, order_index
         FROM car_images
         WHERE car_id = $1
         ORDER BY order_index ASC`,
        [id]
      ),
    ]);

    if (!carResult.rows.length) {
      return res.status(404).json({ error: 'Carro no encontrado' });
    }

    res.json({
      ...carResult.rows[0],
      images: imagesResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener el carro' });
  }
};

// ─── ADMIN ──────────────────────────────────────────────────

const createCar = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      brand_id, model, year, price, is_used, km,
      description, province_id, municipality_id,
      owner_name, owner_phone, is_electric, vehicle_type,
    } = req.body;

    const cleanYear = year === '' || year === undefined ? null : Number(year);
    const cleanKm = (is_used && km !== '' && km !== undefined) ? Number(km) : null;

    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO cars
         (brand_id, model, year, price, is_used, km, description,
          province_id, municipality_id, owner_name, owner_phone, is_electric, vehicle_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING id`,
      [
        brand_id, model, cleanYear, price,
        is_used ?? true,
        cleanKm,
        description, province_id, municipality_id,
        owner_name, owner_phone,
        is_electric ?? false,
        vehicle_type || 'car'
      ]
    );

    const carId = result.rows[0].id;

    if (req.files && req.files.length > 0) {
      for (let idx = 0; idx < req.files.length; idx++) {
        const file = req.files[idx];
        const uploaded = await uploadStream(file.buffer);

        await client.query(
          `INSERT INTO car_images (car_id, url, public_id, is_cover, order_index)
           VALUES ($1, $2, $3, $4, $5)`,
          [carId, uploaded.secure_url, uploaded.public_id, idx === 0, idx]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ id: carId, message: 'Carro creado exitosamente' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error al crear el carro' });
  } finally {
    client.release();
  }
};

const updateCar = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      brand_id, model, year, price, is_used, km,
      description, province_id, municipality_id,
      owner_name, owner_phone, is_active, is_electric, vehicle_type,
    } = req.body;

    const cleanYear = year === '' || year === undefined ? null : Number(year);
    const cleanKm = (is_used && km !== '' && km !== undefined) ? Number(km) : null;

    await pool.query(
      `UPDATE cars SET
         brand_id=$1, model=$2, year=$3, price=$4,
         is_used=$5, km=$6, description=$7,
         province_id=$8, municipality_id=$9,
         owner_name=$10, owner_phone=$11,
         is_active=$12, is_electric=$13, vehicle_type=$14
       WHERE id=$15`,
      [
        brand_id, model, cleanYear, price,
        is_used, cleanKm,
        description, province_id, municipality_id,
        owner_name, owner_phone,
        is_active ?? true,
        is_electric ?? false,
        vehicle_type || 'car',
        id
      ]
    );

    res.json({ message: 'Carro actualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar el carro' });
  }
};

const deleteCar = async (req, res) => {
  try {
    const { id } = req.params;

    // Borra imágenes de Cloudinary primero
    const images = await pool.query(
      'SELECT public_id FROM car_images WHERE car_id = $1', [id]
    );
    await Promise.all(images.rows.map(img => deleteImage(img.public_id)));

    await pool.query('DELETE FROM cars WHERE id = $1', [id]);
    res.json({ message: 'Carro eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar el carro' });
  }
};

const addImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { cover_index } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se enviaron imágenes' });
    }

    const lastIdx = await pool.query(
      'SELECT COALESCE(MAX(order_index), -1) AS max FROM car_images WHERE car_id = $1', [id]
    );
    let nextIdx = lastIdx.rows[0].max + 1;

    // Si no hay imágenes previas, la primera subida será portada
    const existingCount = await pool.query(
      'SELECT COUNT(*) FROM car_images WHERE car_id = $1', [id]
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
        `INSERT INTO car_images (car_id, url, public_id, is_cover, order_index)
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

const deleteImageById = async (req, res) => {
  try {
    const { imageId } = req.params;

    const result = await pool.query(
      'SELECT public_id, car_id, is_cover FROM car_images WHERE id = $1', [imageId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }

    const { public_id, car_id, is_cover } = result.rows[0];
    await deleteImage(public_id);
    await pool.query('DELETE FROM car_images WHERE id = $1', [imageId]);

    // Si era la portada, asigna la siguiente como portada
    if (is_cover) {
      await pool.query(
        `UPDATE car_images SET is_cover = true
         WHERE car_id = $1 AND id = (
           SELECT id FROM car_images WHERE car_id = $1 ORDER BY order_index ASC LIMIT 1
         )`,
        [car_id]
      );
    }

    res.json({ message: 'Imagen eliminada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar la imagen' });
  }
};

const setCover = async (req, res) => {
  try {
    const { imageId } = req.params;

    const img = await pool.query(
      'SELECT car_id FROM car_images WHERE id = $1', [imageId]
    );
    if (!img.rows.length) return res.status(404).json({ error: 'Imagen no encontrada' });

    const { car_id } = img.rows[0];

    await pool.query('UPDATE car_images SET is_cover = false WHERE car_id = $1', [car_id]);
    await pool.query('UPDATE car_images SET is_cover = true WHERE id = $1', [imageId]);

    res.json({ message: 'Portada actualizada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar portada' });
  }
};

const setFeatured = async (req, res) => {
  try {
    const { id } = req.params;
    const { featured_until } = req.body; // fecha ISO o null para quitar destacado

    const result = await pool.query(
      `UPDATE cars SET
         is_featured = $1,
         featured_until = $2
       WHERE id = $3
       RETURNING is_featured, featured_until`,
      [!!featured_until, featured_until || null, id]
    );

    res.json({
      message: 'Destacado actualizado',
      is_featured: result.rows[0].is_featured,
      featured_until: result.rows[0].featured_until
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar destacado' });
  }
};

module.exports = {
  getCars, getCarById, getRelatedCars, setFeatured,
  createCar, updateCar, deleteCar,
  addImages, deleteImageById, setCover,
};