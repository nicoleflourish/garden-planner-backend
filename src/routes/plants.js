const express = require('express');
const router = express.Router();
const googleSheetsService = require('../services/googleSheetsService');

// In-memory cache
let cachedPlants = null;
let lastFetch = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

router.get('/', async (req, res) => {
  try {
    // Check cache
    if (cachedPlants && lastFetch && Date.now() - lastFetch < CACHE_DURATION) {
      return res.json({
        plants: cachedPlants,
        version: '1.0',
        lastUpdated: new Date(lastFetch).toISOString(),
        cached: true
      });
    }
    
    // Fetch from Google Sheets
    const sheetId = process.env.GOOGLE_SHEET_ID;
    
    if (!sheetId) {
      return res.status(500).json({
        error: 'Configuration error',
        message: 'Google Sheet ID not configured'
      });
    }
    
    const plants = await googleSheetsService.fetchPlants(sheetId);
    
    // Update cache
    cachedPlants = plants;
    lastFetch = Date.now();
    
    res.json({
      plants,
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      cached: false
    });
    
  } catch (error) {
    console.error('Error fetching plants:', error);
    res.status(500).json({
      error: 'Failed to fetch plants',
      message: error.message
    });
  }
});

module.exports = router;