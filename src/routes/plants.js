const express = require('express');
const router = express.Router();

// Hardcoded plant database for now
const plantDatabase = [
  { name: 'Basil', daysToMaturity: 60, tempLower: 70, tempUpper: 85, tolerance: 'flexible', maxWeeksOutside: 4, size: 'S', spacing: 3, category: 'Herb' },
  { name: 'Beets (Spring)', daysToMaturity: 55, tempLower: 50, tempUpper: 85, tolerance: 'moderate', maxWeeksOutside: 3, size: 'XS', spacing: 1.5, category: 'Vegetable' },
  { name: 'Calendula (Spring)', daysToMaturity: 80, tempLower: 68, tempUpper: 85, tolerance: 'moderate', maxWeeksOutside: 3, size: 'S', spacing: 3, category: 'Flower' },
  { name: 'Kale (Spring)', daysToMaturity: 60, tempLower: 45, tempUpper: 75, tolerance: 'strict', maxWeeksOutside: 2, size: 'M', spacing: 4.5, category: 'Vegetable' },
  { name: 'Sweet Peppers', daysToMaturity: 75, tempLower: 70, tempUpper: 85, tolerance: 'moderate', maxWeeksOutside: 3, size: 'M', spacing: 4.5, category: 'Vegetable' },
  { name: 'Summer Squash', daysToMaturity: 50, tempLower: 70, tempUpper: 95, tolerance: 'moderate', maxWeeksOutside: 3, size: 'XL', spacing: 12, category: 'Vegetable' },
  // Add more plants here
];

router.get('/', (req, res) => {
  res.json({
    plants: plantDatabase,
    version: '1.0',
    lastUpdated: new Date().toISOString()
  });
});

module.exports = router;