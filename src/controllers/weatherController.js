const weatherService = require('../services/weatherService');

// In-memory cache
const cache = new Map();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

const getWeatherData = async (req, res) => {
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
      console.log(`✓ Cache HIT: ${zipCode}`);
      return res.json({ ...cached.data, cached: true });
    }
    
    console.log(`✗ Cache MISS: ${zipCode} - Fetching from API`);
    
    // Fetch from weather service
    const weatherData = await weatherService.fetchWeatherData(zipCode);
    
    // Cache the result
    cache.set(cacheKey, {
      data: weatherData,
      timestamp: Date.now()
    });
    
    res.json({ ...weatherData, cached: false });
    
  } catch (error) {
    console.error('Weather controller error:', error);
    
    if (error.message === 'Zip code not found') {
      return res.status(404).json({
        error: 'Not found',
        message: 'Zip code not found'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch weather data',
      message: error.message 
    });
  }
};

module.exports = { getWeatherData };