const { AuthenticationService } = require("./cognito_service");
const authService = new AuthenticationService();

const AWS = require('aws-sdk');
const uuid = require('uuid');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const dynamodbAdmin = new AWS.DynamoDB();
//const clientId = process.env.CUPClientId;

const tableNumberIndex = 'NumberIndex'; // GSI
let tablesDynamo='cmtr-bd1b882e-Tables-test'
let reservationDynamo='cmtr-bd1b882e-Reservations-test';
const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();

const buildResponse = (statusCodeVal, messageVal) => ({
    statusCode: statusCodeVal,
    body: JSON.stringify({ statusCode: statusCodeVal, message: messageVal }),
});
async function performCognitoSignUp(event, userPoolId) {
    try {
        const params = { UserPoolId: userPoolId, MaxResults: 1 };

        //----------------- Generate Client Id -----------------//
        const data = await cognitoIdentityServiceProvider.listUserPoolClients(params).promise();
        let clientId = "";
        if (data.UserPoolClients && data.UserPoolClients.length > 0) {
            clientId = data.UserPoolClients[0].ClientId;
            console.log("client Id is ", clientId)
        } else {
            throw new Error("Application Authentication Service is not configured properly.");
        }

        //----------------- Generate adminCreateUser -----------------//
        const { firstName, lastName, email, password } = JSON.parse(event.body);
        const adminCreateUserParam = {
            UserPoolId: userPoolId,
            Username: email,
            UserAttributes: [
                { Name: 'given_name', Value: firstName },
                { Name: 'family_name', Value: lastName },
                { Name: "email", Value: email, },
                { Name: "email_verified", Value: 'true' },
            ],
            TemporaryPassword: password,
            MessageAction: 'SUPPRESS',
            DesiredDeliveryMediums: ['EMAIL'],
            ForceAliasCreation: false
        };
        console.log("adminCreateUserParam params ", adminCreateUserParam)
        const adminCreateUserPromise = await cognitoIdentityServiceProvider.adminCreateUser(adminCreateUserParam).promise();
        console.log("adminCreateUserPromise ", adminCreateUserPromise)

        //----------------- Generate adminInitiateAuth -----------------//
        const adminInitiateAuthParam = {
            AuthFlow: 'ADMIN_NO_SRP_AUTH',
            ClientId: clientId,
            UserPoolId: userPoolId,
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password
            },
        };
        console.log("adminInitiateAuthParam ", adminInitiateAuthParam)
        const adminInitiateAuthPromise = await cognitoIdentityServiceProvider.adminInitiateAuth(adminInitiateAuthParam).promise();
        console.log("adminInitiateAuthPromise ", adminInitiateAuthPromise)

        //----------------- Generate adminRespondToAuthChallenge -----------------//
        const adminRespondToAuthChallengeParam = {
            ClientId: clientId,
            UserPoolId: userPoolId,
            ChallengeName: 'NEW_PASSWORD_REQUIRED',
            Session: adminInitiateAuthPromise.Session,
            ChallengeResponses: {
                "USERNAME": email,
                "PASSWORD": password,
                "NEW_PASSWORD": password
            },
        };
        console.log("adminRespondToAuthChallengeParam ", adminRespondToAuthChallengeParam)
        const adminRespondToAuthChallengePromise = await cognitoIdentityServiceProvider.adminRespondToAuthChallenge(adminRespondToAuthChallengeParam).promise();
        console.log("adminRespondToAuthChallengePromise ", adminRespondToAuthChallengePromise)
        return buildResponse(200, 'User has been successfully signed up')
    } catch (error) {
        console.error("performCognitoSignUp " + error);
        return buildResponse(
            400,
            `Bad request syntax or unsupported method ,error: ${error}`
        );
    }
}
async function performCognitoSignIn(event, userPoolId) {
    try {
        const { email, password } = JSON.parse(event.body);
        const params = { UserPoolId: userPoolId, MaxResults: 1 };
        const data = await cognitoIdentityServiceProvider.listUserPoolClients(params).promise();
        let clientId = "";
        if (data.UserPoolClients && data.UserPoolClients.length > 0) {
            clientId = data.UserPoolClients[0].ClientId;
            console.log("client Id is ", clientId)
        } else {
            throw new Error("Application Authentication Service is not configured properly.");
        }

        const adminInitiateAuthParam = {
            AuthFlow: 'ADMIN_NO_SRP_AUTH',
            ClientId: clientId,
            UserPoolId: userPoolId,
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password
            },
        };
        console.log("adminInitiateAuthParam ", adminInitiateAuthParam)
        const adminInitiateAuthPromise = await cognitoIdentityServiceProvider.adminInitiateAuth(adminInitiateAuthParam).promise();
        console.log("adminInitiateAuthPromise ", adminInitiateAuthPromise)
        return {
            statusCode: 200,
            body: JSON.stringify({ "accessToken": adminInitiateAuthPromise.AuthenticationResult.IdToken }),
        }
    } catch (error) {
        console.error(error);
        return buildResponse(
            400,
            `Bad request syntax or unsupported method ,error: ${error}`
        );
    }
}

async function getTables(event, userPoolId) {
    console.log("getTables event", event)
    const params = {
        TableName: tablesDynamo,
    };
    let scanResults = [];
    let lastEvaluatedKey = null;
    try {
        do {
            if (lastEvaluatedKey) {
                params.ExclusiveStartKey = lastEvaluatedKey;
            }
            const data = await dynamodb.scan(params).promise();
            scanResults.push(...data.Items);
            lastEvaluatedKey = data.LastEvaluatedKey;
        } while (lastEvaluatedKey);

        console.log("getTables Scan succeeded:", scanResults);
        return {
            statusCode: 200,
            body: JSON.stringify({ "tables": scanResults }),
        }
    } catch (err) {
        console.error("Error scanning table:", err);
        return buildResponse(
            400,
            `Bad request syntax or unsupported method ,error: ${err}`
        );
    }
}

async function getTablesById(event, userPoolId) {
    console.log("getTablesById event", event)
    const queryId = event.pathParameters.tableId
    console.log("queryId in param is ", queryId)
    const partitionKeyValue = Number(queryId);
    const params = {
        TableName: tablesDynamo,
        Key: {
            id: partitionKeyValue
        }
    };
    try {
        const data = await dynamodb.get(params).promise();
        console.log("getTablesById Query Result:", data.Item);
        if (data.Item) {
            return {
                statusCode: 200,
                body: JSON.stringify(data.Item),
            };
        } else {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Item not found" }),
            };
        }
    } catch (err) {
        console.error("Error Querying table:", err);
        return buildResponse(
            400,
            `Bad request syntax or unsupported method ,error: ${err}`
        );
    }
}

async function postTables(event, userPoolId) {
    console.log("postTables event", event)
    const { id, number, places, isVip, minOrder } = JSON.parse(event.body)
    const itemData = {
        "id": id,
        "number": number,
        "places": places,
        "isVip": isVip,
        "minOrder": minOrder
    }
    const params = {
        TableName: tablesDynamo,
        Item: itemData
    };
    try {
        console.log("postTables param ", params)
        await dynamodb.put(params).promise();
        console.log('Data inserted successfully in table Tables');
        return {
            statusCode: 200,
            body: JSON.stringify({ "id": id }),
        }
    } catch (error) {
        console.error('Error inserting data into DynamoDB Tables:', error);
        return buildResponse(
            400,
            `Bad request syntax or unsupported method ,error: ${error}`
        );
    }
}

async function getReservations(event, userPoolId) {
    console.log("getReservations event", event)
    const params = {
        TableName: reservationDynamo,
    };
    let scanResults = [];
    let lastEvaluatedKey = null;
    try {
        do {
            if (lastEvaluatedKey) {
                params.ExclusiveStartKey = lastEvaluatedKey;
            }
            const data = await dynamodb.scan(params).promise();
            scanResults.push(...data.Items);
            lastEvaluatedKey = data.LastEvaluatedKey;
        } while (lastEvaluatedKey);

        console.log("getReservations Scan succeeded:", scanResults);
        return {
            statusCode: 200,
            body: JSON.stringify({ "reservations": scanResults }),
        }
    } catch (err) {
        console.error("Error scanning table:", err);
        return buildResponse(
            400,
            `Bad request syntax or unsupported method ,error: ${err}`
        );
    }
}

async function postReservations(event, userPoolId) {
    console.log("postReservations event", event)
    const { tableNumber, clientName, phoneNumber, date, slotTimeStart, slotTimeEnd } = JSON.parse(event.body)

    const tableExistsInDB = await checkTableExistsInDB(reservationDynamo);
    console.log("is table exists in DB ", tableExistsInDB)
    if (!tableExistsInDB) {
        console.error(`Table ${reservationDynamo} does not exist.`);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: `Table ${reservationDynamo} does not exist.` }),
        };
    }

    const tableNumberExistsForReservation = await checkTableNumberExists(tableNumber);
    if (!tableNumberExistsForReservation) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: `Table Nunber ${tableNumber} does not exist` })
        };
    }

    // Check for overlapping reservations
    const overlapExists = await checkForOverlappingReservations(event);
    console.log("is overlapExists for reservation ", overlapExists)

    if (overlapExists) {
        console.error('Overlap with existing reservation detected.');
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Reservation overlaps with an existing reservation.' }),
        };
    }

    
    const uniqueId = uuid.v4();
    const itemData = {
        id: uuid.v4(), // Generate a unique ID
        "tableNumber": tableNumber,
        "clientName": clientName,
        "phoneNumber": phoneNumber,
        "date": date,
        "slotTimeStart": slotTimeStart,
        "slotTimeEnd": slotTimeEnd
    }
    const params = {
        TableName: reservationDynamo,
        Item: itemData
    };
    try {
        console.log("db param ", params)
        await dynamodb.put(params).promise();
        console.log('Data inserted successfully in table reservation');
        return {
            statusCode: 200,
            body: JSON.stringify({ "reservationId": uniqueId }),
        }
    } catch (error) {
        console.error('Error inserting data into DynamoDB Tables:', error);
        return buildResponse(
            400,
            `Bad request syntax or unsupported method ,error: ${error}`
        );
    }
}

async function checkTableExistsInDB(tableName) {
    try {
        const describeTablePromise=await dynamodbAdmin.describeTable({ TableName: tableName }).promise();
        console.log("describeTablePromise ",describeTablePromise)
        return true;
    } catch (error) {
        console.error('Error describeTable:', error);
        if (error.code === 'ResourceNotFoundException') {
            return false;
        }
    }
}

// Function to check for overlapping reservations
async function checkForOverlappingReservations(event) {
    const { tableNumber, clientName, phoneNumber, date, slotTimeStart, slotTimeEnd } = JSON.parse(event.body)
    const params = {
        TableName: reservationDynamo,
        FilterExpression: 'tableNumber = :tableNumber AND #date = :date AND #slotTimeStart < :slotTimeEnd AND #slotTimeEnd > :slotTimeStart',
        ExpressionAttributeNames: {
            '#date': 'date',
            '#slotTimeStart': 'slotTimeStart',
            '#slotTimeEnd': 'slotTimeEnd',
        },
        ExpressionAttributeValues: {
            ':tableNumber': tableNumber,
            ':date': date,
            ':slotTimeStart': slotTimeStart,
            ':slotTimeEnd': slotTimeEnd,
        }
    };

    try {
        const data = await dynamodb.scan(params).promise();
        console.log("scan for overlapping reservation ",data)
        return data.Items.length > 0; // Returns true if there are overlapping reservations
    } catch (error) {
        console.error('Error querying for overlapping reservations:', error);
        throw error; // Re-throw error to be handled by the calling function
    }
}

async function checkTableNumberExists(tableNumber) {
    const params = {
        TableName: tablesDynamo,
        IndexName: tableNumberIndex, // The GSI name
        KeyConditionExpression: 'number = :tableNumber',
        ExpressionAttributeValues: {
            ':tableNumber': tableNumber
        }
    };

    try {
        const result = await dynamodb.query(params).promise();
        console.log("checkTableNumberExists result ",result)
        return result.Items.length > 0;
    } catch (error) {
        console.error('Error checking table number existence:', error);
        throw error; // Re-throw error to be handled by the main handler
    }
}
function initializeTableNames(env = 'default') {
    if (env == 'local') {
        tablesDynamo = 'cmtr-bd1b882e-Tables'
        reservationDynamo = 'cmtr-bd1b882e-Reservations';
    }
}
exports.handler = async (event) => {
    console.log("+++lambda event is ", event);
    const userPoolId = process.env.CUPId;
    const httpMethod = event.httpMethod
    const httpPath = event.path
    const tablesPattern = /^\/tables$/;
    const tablesWithIdPattern = /^\/tables\/(\d+)$/;
    try {
        // initializeTableNames('local') // for local testing
        if (httpMethod === 'POST' && httpPath === '/signup') {
            const signUpResult = await performCognitoSignUp(event, userPoolId)
            console.log("+++signUpResult is ", signUpResult);
            return signUpResult
        } else if (httpMethod === 'POST' && httpPath === '/signin') {
            const signInResult = await performCognitoSignIn(event, userPoolId)
            console.log("+++signInResult is ", signInResult);
            return signInResult
        } else if (httpMethod === 'GET' && tablesPattern.test(httpPath)) {
            const getTablesResult = await getTables(event, userPoolId)
            console.log("+++getTablesResult is ", getTablesResult);
            return getTablesResult
        } else if (httpMethod === 'GET' && tablesWithIdPattern.test(httpPath)) {
            const getTablesByIdResult = await getTablesById(event, userPoolId)
            console.log("+++getTablesByIdResult is ", getTablesByIdResult);
            return getTablesByIdResult
        } else if (httpMethod === 'POST' && httpPath === '/tables') {
            const postTableResult = await postTables(event, userPoolId)
            console.log("+++postTableResult is ", postTableResult);
            return postTableResult
        } else if (httpMethod === 'GET' && httpPath === '/reservations') {
            const getReservationsResult = await getReservations(event, userPoolId)
            console.log("+++getReservationsResult is ", getReservationsResult);
            return getReservationsResult
        } else if (httpMethod === 'POST' && httpPath === '/reservations') {
            const postReservationsResult = await postReservations(event, userPoolId)
            console.log("+++postReservationsResult is ", postReservationsResult);
            return postReservationsResult
        } else {
            return buildResponse(
                400,
                `Bad Request. Request path: ${httpPath}. HTTP method: ${httpMethod}`
            );
        }
    }
    catch (error) {
        console.log("lambda error ", error)
        return buildResponse(
            400,
            `Bad Request`
        );
    }

};
