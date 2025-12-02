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
      
      // Step 4: NEW - Process season data
      const processed = this.processSeasonData(weeklyData);
      
      return {
        zipCode,
        location,
        weeklyData,
        processed,  // ← NEW: Pre-processed data
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Weather service error:', error);
      throw error;
    }
  }
  
  // NEW: Season processing logic (moved from frontend)
  processSeasonData(weeklyData) {
    // Helper: Determine season from temperature
    const getSeason = (temp) => {
      if (temp >= 85) return 'hot';
      if (temp >= 65) return 'warm';
      if (temp >= 40) return 'cool';
      return 'cold';
    };

    // Add season to each week
    let seasonData = weeklyData.map(week => ({ 
      ...week, 
      season: getSeason(week.avg) 
    }));

    // Smooth outlier weeks
    const smoothSeasons = [...seasonData];
    for (let i = 0; i < seasonData.length; i++) {
      const prev = seasonData[(i - 1 + seasonData.length) % seasonData.length];
      const current = seasonData[i];
      const next = seasonData[(i + 1) % seasonData.length];
      
      if (current.season !== prev.season && 
          current.season !== next.season && 
          prev.season === next.season) {
        const avgNeighborTemp = (prev.avg + next.avg) / 2;
        if (Math.abs(current.avg - avgNeighborTemp) <= 15) {
          smoothSeasons[i] = { ...current, season: prev.season };
        }
      }
    }
    seasonData = smoothSeasons;

    // Find transitions
    const transitions = [];
    for (let i = 0; i < seasonData.length; i++) {
      const current = seasonData[i];
      const next = seasonData[(i + 1) % seasonData.length];
      if (current.season !== next.season) {
        transitions.push({ 
          transitionWeek: i + 1, 
          fromSeason: current.season, 
          toSeason: next.season, 
          weekIndex: i 
        });
      }
    }

    // Merge close transitions (within 4 weeks)
    const mergedTransitions = [];
    let i = 0;
    while (i < transitions.length) {
      const current = transitions[i];
      let lastInSequence = current;
      let j = i + 1;
      while (j < transitions.length && 
             transitions[j].weekIndex - lastInSequence.weekIndex <= 4) {
        lastInSequence = transitions[j];
        j++;
      }
      mergedTransitions.push(lastInSequence);
      i = j;
    }

    // Create planting windows with weeks
    const plantingWindows = mergedTransitions.map(t => ({
      transitionWeek: t.transitionWeek,
      fromSeason: t.fromSeason,
      toSeason: t.toSeason,
      windowStart: (t.weekIndex >= 1 ? t.weekIndex : seasonData.length - 1),
      windowEnd: ((t.weekIndex + 3) % seasonData.length),
      weeks: []
    }));

    plantingWindows.forEach(t => {
      for (let w = t.windowStart; w <= t.windowEnd; w++) {
        t.weeks.push(seasonData[(w - 1) % seasonData.length]);
      }
    });

    // Create season ranges
    const seasonRanges = plantingWindows.map(t => ({
      season: `${t.fromSeason}-${t.toSeason}`,
      startWeek: t.windowStart,
      endWeek: t.windowEnd
    }));

    return {
      seasonData: smoothSeasons,
      transitions: plantingWindows,
      seasonRanges: seasonRanges
    };
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
        avg: Math.round(avgTemp * 10) / 10,
        year: weekDate.getFullYear()
      });
    }
    
    return weeklyData;
  }
}

module.exports = new WeatherService();
