exports.handler = async (event) => {
    if (event.httpMethod === 'GET' && event.path === '/hello') {
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
            message: `Bad request syntax or unsupported method. Request path: ${event.path}. HTTP method: ${event.httpMethod}`
        };
    }
};
