class WeatherAdapter {
  async getCurrentWeather(city = 'Mumbai', country = 'IN') {
    throw new Error(`Live weather is not configured for ${city}, ${country}.`);
  }
}

module.exports = new WeatherAdapter();
