require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRouter = require('./routes/auth');
const promosRoutes = require('./routes/promos');
const adminPromosRoutes = require('./routes/adminPromos');
const carsRoutes  = require('./routes/cars');
const adminRoutes = require('./routes/admin');
const metaRoutes  = require('./routes/meta');
const rentalsRoutes = require('./routes/rentals');
const adminRentalsRoutes = require('./routes/adminRentals');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
}));

app.use(express.json());

app.use('/api/cars',   carsRoutes);
app.use('/api/admin',  adminRoutes);
app.use('/api',        metaRoutes);
app.use('/api/auth', authRouter);
app.use('/api/rentals', rentalsRoutes);
app.use('/api/admin/rentals', adminRentalsRoutes);
app.use('/api/promos', promosRoutes);
app.use('/api/admin/promos', adminPromosRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));