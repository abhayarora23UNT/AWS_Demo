const AWS = require("aws-sdk");
const poolId = process.env.CUPId;

class AuthenticationService {
    constructor() {
        this.cognitoIdentity = new AWS.CognitoIdentityServiceProvider({ region: 'eu-central-1' });
        this.clientId = undefined;
    }

    initializeClientId = async () => {
        console.log("poolId is ",poolId)
        const params = { UserPoolId: poolId, MaxResults: 1 };
        const data = await this.cognitoIdentity.listUserPoolClients(params).promise();
        console.log("initializeClientId ", data)
        if (data.UserPoolClients && data.UserPoolClients.length > 0) {
            this.clientId = data.UserPoolClients[0].ClientId;
        } else {
            throw new Error("Application Authentication Service is not configured properly.");
        }
    }

    async signUp(event, userPoolId) {
        console.log("inside performCognitoSignUp ", event)
        console.log("userPoolId ", userPoolId)
        const { email, password } = JSON.parse(event.body);
        // const params = {
        //     // ClientId: clientId,
        //     UserPoolId: userPoolId,
        //     Username: email,
        //     UserAttributes: [
        //         { Name: 'given_name', Value: firstName },
        //         { Name: 'family_name', Value: lastName },
        //         { Name: "email", Value: email, },
        //         { Name: "email_verified", Value: 'true' },
        //     ],
        //     TemporaryPassword: password,
        //     MessageAction: 'SUPPRESS',
        //     DesiredDeliveryMediums: ['EMAIL'],
        //     ForceAliasCreation: false
        // };
        const params = {
            ClientId: this.clientId,
            Username: email,
            Password: password,
            UserAttributes: [
                { Name: 'email', Value: email }
            ]
        };
        try {
            console.log("signUp params ", params)
            const signUpPromise = await this.cognitoIdentity.signUp(params).promise();
            console.log("signUpPromise ", signUpPromise)
            const confirmParams = {
                Username: username,
                UserPoolId: poolId
            };
            console.log("confirmParams ", confirmParams)
            const confirmedResult = await this.cognitoIdentity.adminConfirmSignUp(confirmParams).promise();
            console.log("confirmedResult ", confirmedResult)
            return { signUpResult: confirmedResult };
        }
        catch (error) {
            console.log(`Failed to sign up: ${error}`);
            throw error;
        }
    }
}

module.exports = { AuthenticationService };