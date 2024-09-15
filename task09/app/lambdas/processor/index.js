

const axios = require('axios');
const AWS = require('aws-sdk');
const uuid = require('uuid');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const weatherTable = 'cmtr-bd1b882e-Weather-test';

const fetchWeatherData = async () => {
  const url = 'https://api.open-meteo.com/v1/forecast';
  const params = {
    latitude: 52.52,
    longitude: 13.41,
    current: 'temperature_2m,wind_speed_10m',
    hourly: 'temperature_2m,relative_humidity_2m,wind_speed_10m'
  };

  try {
    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
};

const formatData = (weatherData) => {
  return {
    id: uuid.v4(), // Generate a unique ID
    forecast: {
      elevation: weatherData.elevation,
      generationtime_ms: weatherData.generationtime_ms,
      hourly: {
        temperature_2m: weatherData.hourly.temperature_2m,
        time: weatherData.hourly.time,
      },
      hourly_units: {
        temperature_2m: weatherData.hourly_units.temperature_2m,
        time: weatherData.hourly_units.time,
      },
      latitude: weatherData.latitude,
      longitude: weatherData.longitude,
      timezone: weatherData.timezone,
      timezone_abbreviation: weatherData.timezone_abbreviation,
      utc_offset_seconds: weatherData.utc_offset_seconds,
    }
  };
};

const storeDataInDynamoDB = async (data) => {
  const params = {
    TableName: weatherTable,
    Item: data
  };

  try {
    console.log("db param ",params)
    await dynamodb.put(params).promise();
    console.log('Data inserted successfully');
  } catch (error) {
    console.error('Error inserting data into DynamoDB:', error);
    throw error;
  }
};

exports.handler = async (event) => {
   
    try {
        console.log("+++lambda event is ", event);
        const weatherData = await fetchWeatherData();
        console.log("+++ weatherData is ", weatherData);
        const formattedData = formatData(weatherData);
        console.log("+++ formattedData is ", formattedData);
        await storeDataInDynamoDB(formattedData);
      } catch (error) {
        console.error('An error occurred:', error);
        return {
            statusCode: 500,
            body: JSON.stringify('Failed to insert data in dynamoDb')
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify('Item saved successfully')
    };
 
};


