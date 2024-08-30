// Import required classes from AWS SDK v3
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { PutCommand } = require('@aws-sdk/lib-dynamodb')
const { v4: uuidv4 } = require('uuid');
const TABLE_NAME = 'cmtr-bd1b882e-Events-test';

exports.handler = async (event) => {
    try {
        const dynamoClient = new DynamoDBClient({ region: 'eu-central-1' });
        console.log("+++dynamoClient is ", dynamoClient);
        console.log("+++lambda event is ", event);
        const body = JSON.parse(event.body);
        const { principalId, content } = body;
        // Validate input
        if (principalId === undefined || content === undefined) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Invalid request: missing principalId or content' }),
            };
        }

        const eventId = uuidv4();
        const createdAt = new Date().toISOString();
        console.log("+++dynamo object data content is ", content);
        const eventData = {
            id: eventId,
            principalId: principalId,
            createdAt: createdAt,
            body: content
        };

        console.log('dynamo db eventData:', JSON.stringify(eventData));

        const params = {
            TableName: TABLE_NAME,
            Item: eventData
        };

        const command = new PutCommand(params);
        console.log("+++put command is ", command);
        const dynamoDbResp = await dynamoClient.send(command);

        console.log('dynamoDbResp: ', dynamoDbResp);

        if (dynamoDbResp.$metadata.httpStatusCode == 200) {
            const response = {
                statusCode: 201,
                event: eventData
            };
            return {
                statusCode: 201,
                body: JSON.stringify(response),
            };
        } else {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Error while trying to put item in Dynamo DB', error: error.message }),
            };
        }

    } catch (error) {
        // Handle any errors
        console.error('apiHandler Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error while trying to put item in Dynamo DB', error: error.message }),
        };
    }
};
