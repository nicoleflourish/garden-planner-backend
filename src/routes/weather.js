const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

router.get('/:zipCode', weatherController.getWeatherByZip);

module.exports = router;