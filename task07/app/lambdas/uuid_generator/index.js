const AWS = require('aws-sdk');
const uuid = require('uuid');
const s3 = new AWS.S3();
const BUCKET_NAME = 'cmtr-bd1b882e-uuid-storage-test';

exports.handler = async (event) => {
    
    const startTime = new Date().toISOString();
    console.log("lambda event is ",event)
    console.log("startTime is ",startTime)

    const uuids = Array.from({ length: 10 }, () => uuid.v4());
    const fileContent = JSON.stringify({
        ids: uuids
    }, null, 2); 

    const fileName = `${startTime}.json`;
    const params = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: fileContent,
        ContentType: 'application/json'
    };

    try {
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
