const { getWeather } = require('/opt/nodejs/weatherClient');  // '/opt/nodejs' is the path where Lambda layers are mounted
exports.handler = async (event) => {
    console.log("api handler lambda event is ", event)
    const latitude = event.latitude
    const longitude = event.longitude

    try {
        const weatherData = await getWeather(latitude, longitude);
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
