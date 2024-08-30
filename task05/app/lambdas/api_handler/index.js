const AWS = require('aws-sdk');
AWS.config.update({ region: "eu-central-1" });
const { v4: uuidv4 } = require('uuid');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = 'Events';

exports.handler = async (event) => {
    try {
        console.log("+++dynamo event is ", event)
        // Parse the request body
        const body = JSON.parse(event.body);

        // Extract the principalId and content from the request body
        const { principalId, content } = body;

        // Validate input
        if (principalId === undefined || content === undefined) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Invalid request: missing principalId or content' }),
            };
        }

        // Generate a unique ID for the event
        const eventId = uuidv4();

        // Get the current timestamp in ISO 8601 format
        const createdAt = new Date().toISOString();

        // Prepare the event data
        const eventData = {
            id: eventId,
            principalId: principalId,
            createdAt: createdAt,
            body: content,
        };

        console.log('dynamo db eventData:', JSON.stringify(eventData));
        // Save the event data to DynamoDB
        const dynamoDbResp = await dynamodb.put({
            TableName: TABLE_NAME,
            Item: eventData,
        }).promise();

        console.log('dynamoDbResp promise:', dynamoDbResp);
        // Return the created event as the response
        return {
            statusCode: 201,
            body: JSON.stringify({ event: eventData }),
        };
    } catch (error) {
        // Handle any errors
        console.error('apiHandlar Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error', error: error.message }),
        };
    }
};
