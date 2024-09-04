const AWS = require('aws-sdk');
const uuid = require('uuid');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const auditTable = 'cmtr-bd1b882e-Audit-test';

exports.handler = async (event) => {
    const now = new Date().toISOString();

    for (const record of event.Records) {
        if (record.eventName === 'INSERT') {
            // Handle INSERT event
            const newItem = record.dynamodb.NewImage;
            const itemKey = newItem.key.S;
            const newValue = newItem.value.N;

            const auditItem = {
                id: uuid.v4(),
                itemKey: itemKey,
                modificationTime: now,
                newValue: {
                    key: itemKey,
                    value: parseInt(newValue, 10)
                }
            };

            await dynamodb.put({
                TableName: auditTable,
                Item: auditItem
            }).promise();

        } else if (record.eventName === 'MODIFY') {
            // Handle MODIFY event
            const oldItem = record.dynamodb.OldImage;
            const newItem = record.dynamodb.NewImage;

            const itemKey = newItem.key.S;
            const oldValue = oldItem.value.N;
            const newValue = newItem.value.N;

            const auditItem = {
                id: uuid.v4(),
                itemKey: itemKey,
                modificationTime: now,
                updatedAttribute: 'value',
                oldValue: parseInt(oldValue, 10),
                newValue: parseInt(newValue, 10)
            };

            await dynamodb.put({
                TableName: auditTable,
                Item: auditItem
            }).promise();
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify('Audit logs successfully created')
    };
};
