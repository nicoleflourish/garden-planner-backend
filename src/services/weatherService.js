const axios = require('axios');

class WeatherService {
  async fetchWeatherData(zipCode) {
    try {
      // Step 1: Geocode zip to lat/lon
      const location = await this.geocodeZip(zipCode);
      
      // Step 2: Fetch historical weather (past year)
      const historicalData = await this.fetchHistoricalWeather(
        location.latitude,
        location.longitude
      );
      
      // Step 3: Calculate weekly averages
      const weeklyData = this.calculateWeeklyAverages(historicalData);
      
      return {
        zipCode,
        location,
        weeklyData,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Weather service error:', error);
      throw error;
    }
  }
  
  async geocodeZip(zipCode) {
    const response = await axios.get(
      'https://nominatim.openstreetmap.org/search',
      {
        params: {
          postalcode: zipCode,
          country: 'US',
          format: 'json',
          limit: 1
        },
        headers: {
          'User-Agent': 'GardenPlannerApp/1.0'
        }
      }
    );
    
    if (!response.data || response.data.length === 0) {
      throw new Error('Zip code not found');
    }
    
    const result = response.data[0];
    return {
      name: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon)
    };
  }
  
  async fetchHistoricalWeather(lat, lon) {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setFullYear(startDate.getFullYear() - 1);
    
    const formatDate = (date) => date.toISOString().split('T')[0];
    
    const response = await axios.get(
      'https://archive-api.open-meteo.com/v1/archive',
      {
        params: {
          latitude: lat,
          longitude: lon,
          start_date: formatDate(startDate),
          end_date: formatDate(endDate),
          daily: 'temperature_2m_max,temperature_2m_min',
          temperature_unit: 'fahrenheit',
          timezone: 'auto'
        }
      }
    );
    
    return response.data.daily;
  }
  
  calculateWeeklyAverages(dailyData) {
    const weeklyData = [];
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    
    for (let i = 0; i < 52; i++) {
      const weekStart = i * 7;
      const weekEnd = Math.min(weekStart + 7, dailyData.time.length);
      
      let sumMax = 0;
      let sumMin = 0;
      let count = 0;
      
      for (let j = weekStart; j < weekEnd; j++) {
        sumMax += dailyData.temperature_2m_max[j];
        sumMin += dailyData.temperature_2m_min[j];
        count++;
      }
      
      const avgTemp = (sumMax + sumMin) / (count * 2);
      
      const weekDate = new Date(startDate);
      weekDate.setDate(weekDate.getDate() + (i * 7));
      const dateStr = weekDate.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'short' 
      });
      
      weeklyData.push({
        week: i + 1,
        date: dateStr,
        avg: Math.round(avgTemp * 10) / 10
      });
    }
    
    return weeklyData;
  }
}

module.exports = new WeatherService();