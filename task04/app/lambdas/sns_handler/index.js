exports.handler = async (event) => {

    console.log("sns event in lambda ", event)
    console.log("Received event:", JSON.stringify(event, null, 2));

    // Process each SNS record from the event
    for (const record of event.Records) {
        // Extract the SNS message
        const snsMessage = record.Sns;
        const messageBody = snsMessage.Message;

        // Log the SNS message details
        console.log("SNS Message Details:");
        console.log("Message ID:", snsMessage.MessageId);
        console.log("Message Body:", messageBody);
        console.log("Message Timestamp:", snsMessage.Timestamp);
        console.log("Message Subject:", snsMessage.Subject || "No Subject");
    }
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};
