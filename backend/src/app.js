require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./auth');
const manejadorErrores = require('./core/middlewares/error.middleware');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', servicio: 'IndigoOne API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/indigo', require('./indigo'));
app.use('/api/optica', require('./optica'));

app.use(manejadorErrores);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`IndigoOne API corriendo en http://localhost:${PORT}`);
});