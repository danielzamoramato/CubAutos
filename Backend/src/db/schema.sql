-- Provincias de Cuba
CREATE TABLE provinces (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

-- Municipios
CREATE TABLE municipalities (
  id SERIAL PRIMARY KEY,
  province_id INTEGER REFERENCES provinces(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL
);

-- Marcas
CREATE TABLE brands (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

-- Carros
CREATE TABLE cars (
  id SERIAL PRIMARY KEY,
  brand_id INTEGER REFERENCES brands(id),
  model VARCHAR(100) NOT NULL,
  year INTEGER CHECK (year >= 1900 AND year <= 2100),
  price INTEGER NOT NULL CHECK (price >= 0),
  is_used BOOLEAN DEFAULT true,
  km INTEGER CHECK (km >= 0),          -- NULL si es nuevo
  description TEXT,
  province_id INTEGER REFERENCES provinces(id),
  municipality_id INTEGER REFERENCES municipalities(id),
  owner_name VARCHAR(150) NOT NULL,
  owner_phone VARCHAR(30),
  is_active BOOLEAN DEFAULT true,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Fotos
CREATE TABLE car_images (
  id SERIAL PRIMARY KEY,
  car_id INTEGER REFERENCES cars(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  public_id TEXT NOT NULL,            -- para borrar en Cloudinary
  is_cover BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0
);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_cars_brand ON cars(brand_id);
CREATE INDEX idx_cars_province ON cars(province_id);
CREATE INDEX idx_cars_price ON cars(price);
CREATE INDEX idx_cars_is_active ON cars(is_active);
CREATE INDEX idx_car_images_car ON car_images(car_id);