exports.handler = async (event) => {
    console.log("http event ", event)
    const httpMethod = event.requestContext.http.method
    const httpPath = event.requestContext.http.path
    console.log("httpMethod ", httpMethod)
    console.log("httpPath ", httpPath)


    if (httpMethod === 'GET' && httpPath === '/hello') {
        console.log("inside success ")
        const successResponse = {
            statusCode: 200,
            message: 'Hello from Lambda',
        };
        return successResponse;
    } else {
        console.log("inside failure ")
        const failedResponse = {
            statusCode: 400,
            message: `Bad request syntax or unsupported method. Request path: ${httpPath}. HTTP method: ${httpMethod}`
        };
        return failedResponse;
    }
};