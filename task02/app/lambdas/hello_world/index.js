exports.handler = async (event) => {
    console.log("http event ",event)
    const httpMethod=event.requestContext.http.method
    const httpPath=event.requestContext.http.path
    console.log("httpMethod ",httpMethod)
    console.log("httpPath ",httpPath)
    if (httpMethod === 'GET' && httpPath === '/hello') {
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            message: 'Hello from Lambda'
        };
    } else {
        return {
            statusCode: 404,
            headers: {
                'Content-Type': 'application/json'
            },
            message: `Bad request syntax or unsupported method. Request path: ${httpPath}. HTTP method: ${httpMethod}`
        };
    }
};