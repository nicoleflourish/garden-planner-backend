const { google } = require('googleapis');

class GoogleSheetsService {
  constructor() {
    this.sheets = google.sheets('v4');
    // No authentication needed for public sheets!
  }
  
  async fetchPlants(sheetId) {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'Sheet1!A2:I', // Adjust if your sheet has a different name
        key: process.env.GOOGLE_API_KEY || 'AIzaSyDummyKeyForPublicSheets' // Optional for public sheets
      });
      
      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return [];
      }
      
      // Convert rows to plant objects
      const plants = rows.map(row => ({
        name: row[0],
        daysToMaturity: parseInt(row[1]) || 0,
        tempLower: parseInt(row[2]) || 0,
        tempUpper: parseInt(row[3]) || 0,
        tolerance: row[4] || 'moderate',
        maxWeeksOutside: parseInt(row[5]) || 3,
        size: row[6] || 'M',
        spacing: parseFloat(row[7]) || 3,
        category: row[8] || 'Vegetable'
      })).filter(plant => plant.name); // Filter out empty rows
      
      return plants;
      
    } catch (error) {
      console.error('Error fetching plants from Google Sheets:', error);
      throw error;
    }
  }
}

module.exports = new GoogleSheetsService();