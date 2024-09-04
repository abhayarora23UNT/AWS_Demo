const AWS = require('aws-sdk');
const uuid = require('uuid');
const s3 = new AWS.S3();
const BUCKET_NAME = 'cmtr-bd1b882e-uuid-storage-test'; // Replace with your S3 bucket name

exports.handler = async (event) => {
    // Get current time in ISO format for filename
    const startTime = new Date().toISOString();
    
    // Generate 10 random UUIDs
    const uuids = Array.from({ length: 10 }, () => uuid.v4());
    
    // Create JSON content with UUIDs
    const fileContent = JSON.stringify({
        ids: uuids
    }, null, 2); // Pretty print with indentation of 2 spaces

    // Define the file name including execution start time
    const fileName = `${startTime}.json`;

    // Parameters for S3 upload
    const params = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: fileContent,
        ContentType: 'application/json'
    };

    try {
        // Upload file to S3
        await s3.putObject(params).promise();
        console.log(`File uploaded successfully: ${fileName}`);

        return {
            statusCode: 200,
            body: JSON.stringify(`File uploaded successfully: ${fileName}`)
        };
    } catch (error) {
        console.error('Error uploading file to S3:', error);

        return {
            statusCode: 500,
            body: JSON.stringify('Failed to upload file to S3')
        };
    }
};
