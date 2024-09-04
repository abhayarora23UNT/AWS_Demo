const AWS = require('aws-sdk');
const uuid = require('uuid');
const s3 = new AWS.S3();
const BUCKET_NAME = 'cmtr-bd1b882e-uuid-storage-test'; // Replace with your S3 bucket name

exports.handler = async (event) => {
    console.log("lambda event is ")
    const startTime = new Date().toISOString().replace(/[:.]/g, '-'); // Format start time for filename

    // Generate 10 random UUIDs
    const uuids = Array.from({ length: 10 }, () => uuid.v4());

    // Create file content
    const fileContent = uuids.join('\n'); // Join UUIDs with newline for better readability

    // Define the file name including execution start time
    const fileName = `uuids-${startTime}.txt`;

    // Parameters for S3 upload
    const params = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: fileContent,
        ContentType: 'text/plain'
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
