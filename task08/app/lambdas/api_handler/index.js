const { getWeather } = require('/opt/nodejs/weather-client');  // '/opt/nodejs' is the path where Lambda layers are mounted
exports.handler = async (event) => {
    console.log("api handler lambda event is ", event)
    const latitude = event.latitude | 50.4375
    const longitude = event.longitude | 30.5

    try {
        const weatherData = await getWeather(latitude, longitude);
        console.log("weatherData is ", weatherData)
        return {
            statusCode: 200,
            body: JSON.stringify(weatherData),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
