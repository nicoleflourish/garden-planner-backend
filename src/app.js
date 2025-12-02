const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
origin: [
    'http://localhost:3000', 
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://garden-planner-frontend.onrender.com',
    'https://www.flourishgardensolutions.com',
    'https://flourishgardensolutions.com'
  ],
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString() 
  });
});

// Import routes
const weatherRoutes = require('./routes/weather');
const plantRoutes = require('./routes/plants');

// Use routes
app.use('/api/weather', weatherRoutes);
app.use('/api/plants', plantRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend API running on port ${PORT}`);
});