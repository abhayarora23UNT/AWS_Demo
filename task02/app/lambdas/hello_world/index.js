exports.handler = async (event) => {
    const httpMethod = event.requestContext.http.method
    const httpPath = event.requestContext.http.path
    const buildResponse = (statusCodeVal, messageVal) => ({
        statusCode: statusCodeVal,
        body: JSON.stringify({ statusCode: statusCodeVal, message: messageVal }),
    });

    if (httpMethod === 'GET' && httpPath === '/hello') {
        return buildResponse(200, 'Hello from Lambda');
    } else {
        return buildResponse(
            400,
            `Bad request syntax or unsupported method. Request path: ${httpPath}. HTTP method: ${httpMethod}`
        );
    }
};