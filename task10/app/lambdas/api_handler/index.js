const { AuthenticationService } = require("./cognito_service");
const authService = new AuthenticationService();

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
//const clientId = process.env.CUPClientId;

const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();

const buildResponse = (statusCodeVal, messageVal) => ({
    statusCode: statusCodeVal,
    body: JSON.stringify({ statusCode: statusCodeVal, message: messageVal }),
});
async function performCognitoSignUp(event, userPoolId) {
    try {
        const params = { UserPoolId: userPoolId, MaxResults: 1 };
        console.log("initializeClientId cognitoIdentity obj ", cognitoIdentityServiceProvider)

        //----------------- Generate Client Id -----------------//

        const data = await cognitoIdentityServiceProvider.listUserPoolClients(params).promise();
        console.log("initializeClientId ", data)
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

        //----------------- Generate adminConfirmSignUp -----------------//
        // const adminConfirmSignUpPromise = await cognitoIdentityServiceProvider.adminConfirmSignUp({
        //     UserPoolId: userPoolId,
        //     Username: email,
        // }).promise();
        // console.log("adminConfirmSignUpPromise ", adminConfirmSignUpPromise)
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
        console.log("initializeClientId cognitoIdentity obj ", cognitoIdentityServiceProvider)
        const data = await cognitoIdentityServiceProvider.listUserPoolClients(params).promise();
        console.log("initializeClientId ", data)
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
    console.log("getTables userPoolId", userPoolId)
    const queryStringParameters = event.queryStringParameters || {};
    console.log("queryStringParameters ",queryStringParameters)
    const tableId = queryStringParameters.tableId; 
}

async function postTables(event, userPoolId) {
    console.log("postTables event", event)
    console.log("postTables userPoolId", userPoolId)
    //const tableName = 'cmtr-bd1b882e-Tables';
    const tableName = 'cmtr-bd1b882e-Tables-test';
    const { id, number, places, isVip, minOrder } = JSON.parse(event.body)
    const itemData = {
        "id": id,
        "number": number,
        "places": places,
        "isVip": isVip,
        "minOrder": minOrder
    }
    const params = {
        TableName: tableName,
        Item: itemData
    };
    try {
        console.log("db param ", params)
        await dynamodb.put(params).promise();
        console.log('Data inserted successfully');
    } catch (error) {
        console.error('Error inserting data into DynamoDB:', error);
        throw error;
    }
}

async function getReservations(event, userPoolId) {
    console.log("getReservations event", event)
    console.log("getReservations userPoolId", userPoolId)
}

async function postReservations(event, userPoolId) {
    console.log("postReservations event", event)
    console.log("postReservations userPoolId", userPoolId)
}
exports.handler = async (event) => {
    console.log("+++lambda event is ", event);
    const userPoolId = process.env.CUPId;
    console.log("+++userPoolId is ", userPoolId);
    const httpMethod = event.httpMethod
    const httpPath = event.path
    try {
        console.log("httpMethod ", httpMethod)
        console.log("httpPath ", httpPath)
        if (httpMethod === 'POST' && httpPath === '/signup') {
            const signUpResult = await performCognitoSignUp(event, userPoolId)
            console.log("+++signUpResult is ", signUpResult);
            return signUpResult
        } else if (httpMethod === 'POST' && httpPath === '/signin') {
            const signInResult = await performCognitoSignIn(event, userPoolId)
            console.log("+++signInResult is ", signInResult);
            return signInResult
        } else if (httpMethod === 'GET' && httpPath === '/tables') {
            const getTablesResult = await getTables(event, userPoolId)
            console.log("+++getTablesResult is ", getTablesResult);
            return getTablesResult
        }else if (httpMethod === 'POST' && httpPath === '/tables') {
            const postTableResult = await postTables(event, userPoolId)
            console.log("+++postTableResult is ", postTableResult);
            return postTableResult
        }else if (httpMethod === 'GET' && httpPath === '/reservations') {
            const getReservationsResult = await getReservations(event, userPoolId)
            console.log("+++getReservationsResult is ", getReservationsResult);
            return getReservationsResult
        }else if (httpMethod === 'POST' && httpPath === '/reservations') {
            const postReservationsResult = await postReservations(event, userPoolId)
            console.log("+++postReservationsResult is ", postReservationsResult);
            return postReservationsResult
        }else {
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
