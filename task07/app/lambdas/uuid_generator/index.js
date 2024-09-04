const AWS = require('aws-sdk');
const uuid = require('uuid');
const s3 = new AWS.S3();
const BUCKET_NAME = 'cmtr-bd1b882e-uuid-storage-test'; // Replace with your actual S3 bucket name

exports.handler = async (event) => {
    try {
        // Get current time in ISO format for filename (without milliseconds)
        const now = new Date();
        const startTime = now.toISOString().replace(/\.\d+Z$/, 'Z'); // Remove milliseconds

        const uuids = Array.from({ length: 10 }, () => uuid.v4());
        const fileContent = JSON.stringify({
            ids: uuids
        }, null, 2);

        // Define the file name including execution start time (matching the expected format)
        const fileName = `${startTime}`;

        const params = {
            Bucket: BUCKET_NAME,
            Key: fileName,
            Body: fileContent,
            ContentType: 'application/json'
        };
        console.log("params is ",params)
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
