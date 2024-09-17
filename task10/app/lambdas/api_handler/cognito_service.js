
const AWS = require("aws-sdk");
const poolId = process.env.CUPId;

class AuthenticationService {
    constructor() {
        this.cognitoIdentity = new AWS.CognitoIdentityServiceProvider({ region: 'eu-central-1' });
        this.clientId = undefined;
    }

    initializeClientId = async () => {
        console.log("poolId is ", poolId)
        const params = { UserPoolId: poolId, MaxResults: 1 };
        console.log("initializeClientId cognitoIdentity obj ", this.cognitoIdentity)
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
        const signUpParams = {
            ClientId: this.clientId,
            Username: email,
            Password: password,
            UserAttributes: [
                // { Name: 'given_name', Value: firstName },
                // { Name: 'family_name', Value: lastName },
                { Name: "email", Value: email, },
            ],
            //MessageAction: 'SUPPRESS'
        };
        try {
            console.log("cognitoIdentity obj ", this.cognitoIdentity)

            console.log("adminCreateUserParam params ", adminCreateUserParam)
            const adminCreateUserPromise = await this.cognitoIdentity.adminCreateUser(adminCreateUserParam).promise();
            console.log("adminCreateUserPromise ", adminCreateUserPromise)

            console.log("signUp params ", signUpParams)
            const signUpPromise = await this.cognitoIdentity.signUp(signUpParams).promise();
            console.log("signUpPromise ", signUpPromise)
        
            // const confirmParams = {
            //     Username: username,
            //     UserPoolId: poolId
            // };
            // console.log("confirmParams ", confirmParams)
            // const confirmedResult = await this.cognitoIdentity.adminConfirmSignUp(confirmParams).promise();
            // console.log("confirmedResult ", confirmedResult)
            // return { signUpResult: confirmedResult };
        }
        catch (error) {
            console.log(`Failed to sign up: ${error}`);
            throw error;
        }
    }
}

module.exports = { AuthenticationService };