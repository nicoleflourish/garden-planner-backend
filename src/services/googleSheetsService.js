const { google } = require('googleapis');

class GoogleSheetsService {
  constructor() {
    this.sheets = google.sheets({ version: 'v4' });
  }
  
  async fetchPlants(sheetId) {
    try {
      const apiKey = process.env.GOOGLE_API_KEY;
      
      if (!apiKey) {
        throw new Error('GOOGLE_API_KEY not configured');
      }
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'Sheet1!A2:J1000', // Get up to 1000 rows
        key: apiKey
      });
      
      const rows = response.data.values;
      
      if (!rows || rows.length === 0) {
        console.log('No data found in sheet');
        return [];
      }
      
      console.log(`Found ${rows.length} rows in Google Sheet`);
      
      // Convert rows to plant objects
      const plants = rows
        .map(row => {
          if (!row[0]) return null; // Skip empty rows
          
          return {
            name: row[0],
            daysToMaturity: parseInt(row[1]) || 0,
            tempLower: parseInt(row[2]) || 0,
            tempUpper: parseInt(row[3]) || 0,
            tolerance: row[4] || 'moderate',
            maxWeeksOutside: parseInt(row[5]) || 3,
            size: row[6] || 'M',
            spacing: parseFloat(row[7]) || 3,
            category: row[8] || 'Vegetable',
            perennial: row[9] === 'TRUE' || row[9] === true || false
          };
        })
        .filter(plant => plant !== null);
      
      console.log(`Parsed ${plants.length} valid plants`);
      return plants;
      
    } catch (error) {
      console.error('Error fetching plants from Google Sheets:', error.message);
      console.error('Error details:', error);
      throw error;
    }
  }
}

module.exports = new GoogleSheetsService();
