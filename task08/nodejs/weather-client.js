const axios = require('axios');

const getWeather = async (latitude, longitude) => {
    const url = 'https://api.open-meteo.com/v1/forecast';
    const params = {
        latitude: latitude,
        longitude: longitude,
        current: 'temperature_2m,wind_speed_10m',
        hourly: 'temperature_2m,relative_humidity_2m,wind_speed_10m'
    };

    try {
        const response = await axios.get(url, { params });
        return response.data;
    } catch (error) {
        throw new Error(`Error fetching weather data: ${error.message}`);
    }
};

module.exports = {
    getWeather
};