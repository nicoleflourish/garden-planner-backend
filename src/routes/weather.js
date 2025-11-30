const express = require('express');
const router = express.Router();
const { getWeatherData } = require('../controllers/weatherController');
const { cacheMiddleware } = require('../middleware/cache');

// Cache weather data for 6 hours (21600000 ms)
// Weather patterns don't change frequently, so this is safe
// Each zip code gets its own cache entry
router.get('/:zipCode', cacheMiddleware(21600000), getWeatherData);

module.exports = router;
