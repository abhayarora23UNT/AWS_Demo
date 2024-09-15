const AWS = require('aws-sdk');
const CognitoIdentityServiceProvider = AWS.CognitoIdentityServiceProvider;

const userPoolId = process.env.CUPId;
const clientId = process.env.CUPClientId;

const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider();
exports.handler = async (event) => {
    console.log("+++lambda event is ",event);
    const body = JSON.parse(event.body);
    const params = {
        AuthFlow: 'ADMIN_NO_SRP_AUTH',
        ClientId: clientId,
        AuthParameters: {
            USERNAME: body.email,
            PASSWORD: body.password   
        }
    };

    try {
        const data = await cognitoIdentityServiceProvider.initiateAuth(params).promise();
        const idToken = data.AuthenticationResult.IdToken;
        console.log("+++idToken  ",idToken);
        //return idToken;
    } catch (error) {
        console.error(error);
        throw error;
    }
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};
