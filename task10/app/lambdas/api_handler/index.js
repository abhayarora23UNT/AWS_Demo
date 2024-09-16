const { AuthenticationService } = require("./cognito_service");
const authService = new AuthenticationService();

const AWS = require('aws-sdk');
//const clientId = process.env.CUPClientId;

const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();

const buildResponse = (statusCodeVal, messageVal) => ({
    statusCode: statusCodeVal,
    body: JSON.stringify({ statusCode: statusCodeVal, message: messageVal }),
});
async function performCognitoSignUp(event, userPoolId) {
    try {
        const performCognitoSignUpPromise = await authService.signUp(event, userPoolId);
        console.log("performCognitoSignUpPromise ", performCognitoSignUpPromise)
        return buildResponse(200, 'User created and confirmed successfully')
        // // Create the user
        // const adminCreateUser = await cognitoIdentityServiceProvider.adminCreateUser(params).promise();
        // console.log("adminCreateUser ", adminCreateUser)
        // // Admin confirm the user
        // const adminConfirmSignUp = await cognito.adminConfirmSignUp({
        //     UserPoolId: userPoolId,
        //     Username: email,
        // }).promise();
        // console.log("adminConfirmSignUp ", adminConfirmSignUp)
        // return buildResponse(200, 'User created and confirmed successfully');
    } catch (error) {
        console.error(error);
        return buildResponse(
            400,
            `Bad request syntax or unsupported method ,error: ${error}`
        );
    }
}
async function performCognitoSignIn(event, userPoolId) {
    const body = JSON.parse(event.body);
    const params = {
        AuthFlow: 'USER_PASSWORD_AUTH',
        //ClientId: clientId,
        UserPoolId: userPoolId,
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
            `Bad request syntax or unsupported method ,error: ${error}`
        );
    }
}
exports.handler = async (event) => {
    console.log("+++lambda event is ", event);
    const userPoolId = process.env.CUPId;
    console.log("+++userPoolId is ", userPoolId);
    const httpMethod = event.httpMethod
    const httpPath = event.path
    try {
        const initializeClientIdPromise = await authService.initializeClientId();
        console.log("initializeClientIdPromise ", initializeClientIdPromise)
        console.log("httpMethod ", httpMethod)
        console.log("httpPath ", httpPath)
        if (httpMethod === 'POST' && httpPath === '/signup') {
            performCognitoSignUp(event, userPoolId)
        } else if (httpMethod === 'POST' && httpPath === '/signin') {
            performCognitoSignIn(event, userPoolId)
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
            500,
            `Internal Server Error. Request path: ${httpPath}. HTTP method: ${httpMethod} Error : ${error}`
        );
    }

};
