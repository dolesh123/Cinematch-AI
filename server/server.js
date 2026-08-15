const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./db');

const authRoutes = require('./routes/auth');
const preferencesRoutes = require('./routes/preferences');
const moviesRoutes = require('./routes/movies');
const recommendationsRoutes = require('./routes/recommendations');
const interactionsRoutes = require('./routes/interactions');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 8000;

// Enable CORS and JSON body parser
app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/movies', moviesRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api', interactionsRoutes); // provides /api/feedback and /api/watchlist
app.use('/api', analyticsRoutes);    // provides /api/my-taste, /api/model/metrics, /api/admin/analytics

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', stack: 'MERN', engine: 'Express.js + Node.js Hybrid Recommender Engine' });
});

async function startServer() {
  await connectDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Express Backend] CineMatch MERN server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();

module.exports = app;
