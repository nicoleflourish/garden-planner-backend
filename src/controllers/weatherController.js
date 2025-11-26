const weatherService = require('../services/weatherService');

// In-memory cache (replace with Redis in production)
const cache = new Map();
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

exports.getWeatherByZip = async (req, res, next) => {
  try {
    const { zipCode } = req.params;
    
    // Validate zip code
    if (!/^\d{5}$/.test(zipCode)) {
      return res.status(400).json({ 
        error: 'Invalid zip code',
        message: 'Zip code must be 5 digits' 
      });
    }
    
    // Check cache
    const cacheKey = `weather:${zipCode}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json({ ...cached.data, cached: true });
    }
    
    // Fetch from weather service
    const weatherData = await weatherService.fetchWeatherData(zipCode);
    
    // Cache the result
    cache.set(cacheKey, {
      data: weatherData,
      timestamp: Date.now()
    });
    
    res.json({ ...weatherData, cached: false });
    
  } catch (error) {
    if (error.message === 'Zip code not found') {
      return res.status(404).json({
        error: 'Not found',
        message: error.message
      });
    }
    next(error);
  }
};