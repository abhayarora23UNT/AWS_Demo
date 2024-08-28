exports.handler = async (event) => {
    
     // Log the entire event for debugging purposes
     console.log("lambda event ",event)
     console.log("Received event:", JSON.stringify(event, null, 2));
    
     // Process each record from the event
     for (const record of event.Records) {
         // Extract the message body
         const messageBody = record.body;
         
         // Log the message body
         console.log("Message Body:", messageBody);
     }
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};
