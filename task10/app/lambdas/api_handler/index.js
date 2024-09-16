const AWS = require('aws-sdk');

//const clientId = process.env.CUPClientId;

const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();

export const buildResponse = (statusCodeVal, messageVal) => ({
    statusCode: statusCodeVal,
    body: JSON.stringify({ statusCode: statusCodeVal, message: messageVal }),
});
async function performCognitoSignUp(event,userPoolId) {
    try {
        console.log("inside performCognitoSignUp")
        const { firstName, lastName, email, password } = JSON.parse(event.body);
        const params = {
           // ClientId: clientId,
            UserPoolId, userPoolId,
            Username: email,
            UserAttributes: [
                { Name: 'firstName', Value: firstName },
                { Name: 'lastName', Value: lastName },
                { Name: "email", Value: email, },
            ],
            TemporaryPassword: password,
            MessageAction: 'SUPPRESS'
        };
        // Create the user
        const adminCreateUser = await cognitoIdentityServiceProvider.adminCreateUser(params).promise();
        console.log("adminCreateUser ", adminCreateUser)
        // Admin confirm the user
        const adminConfirmSignUp = await cognito.adminConfirmSignUp({
            UserPoolId: userPoolId,
            Username: email,
        }).promise();
        console.log("adminConfirmSignUp ", adminConfirmSignUp)
        return buildResponse(200, 'User created and confirmed successfully');
    } catch (error) {
        console.error(error);
        return buildResponse(
            400,
            `Bad request syntax or unsupported method. Request path: ${httpPath}. HTTP method: ${httpMethod}`
        );
    }
}
async function performCognitoSignIn(event,userPoolId) {
    const body = JSON.parse(event.body);
    const params = {
        AuthFlow: 'USER_PASSWORD_AUTH',
        //ClientId: clientId,
        UserPoolId, userPoolId,
        AuthParameters: {
            USERNAME: body.email,
            PASSWORD: body.password
        },
        MessageAction: 'SUPPRESS'
    };
    try {
        const data = await cognitoIdentityServiceProvider.initiateAuth(params).promise();
        console.log('Sign-in successful', data);
        return buildResponse(200, 'Sign-in successful');
    } catch (error) {
        console.error(error);
        return buildResponse(
            400,
            `Bad request syntax or unsupported method. Request path: ${httpPath}. HTTP method: ${httpMethod}`
        );
    }
}
exports.handler = async (event) => {
    console.log("+++lambda event is ", event);
    const userPoolId = process.env.CUPId;
    console.log("+++userPoolId is ", userPoolId);
    const httpMethod = event.requestContext.http.method
    const httpPath = event.requestContext.http.path
    if (httpMethod === 'POST' && httpPath === '/signup') {
        performCognitoSignUp(event,userPoolId)
    } else if (httpMethod === 'POST' && httpPath === '/signin') {
        performCognitoSignIn(event,userPoolId)
    } else {
        return buildResponse(
            500,
            `Internal Server Error. Request path: ${httpPath}. HTTP method: ${httpMethod}`
        );
    }
};
