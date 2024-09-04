const AWS = require('aws-sdk');
const uuid = require('uuid');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const auditTable = 'cmtr-bd1b882e-Audit-test';

const createAuditItem = (record, now) => {
    const newItem = record.dynamodb.NewImage;
    const itemKey = newItem.key.S;
    const newValue = parseInt(newItem.value.N, 10);

    return {
        id: uuid.v4(),
        itemKey: itemKey,
        modificationTime: now,
        newValue: {
            key: itemKey,
            value: newValue
        }
    };
};

const createModifyAuditItem = (record, now) => {
    const oldItem = record.dynamodb.OldImage;
    const newItem = record.dynamodb.NewImage;

    return {
        id: uuid.v4(),
        itemKey: newItem.key.S,
        modificationTime: now,
        updatedAttribute: 'value',
        oldValue: parseInt(oldItem.value.N, 10),
        newValue: parseInt(newItem.value.N, 10)
    };
};

const writeAuditItem = async (auditItem) => {
    try {
        console.log("+++lambda writeAuditItem is ", auditItem);
        await dynamodb.put({
            TableName: auditTable,
            Item: auditItem
        }).promise();
    } catch (error) {
        console.error(`Error writing audit log for ${auditItem.itemKey}:`, error);
        throw new Error(`Failed to write audit log for ${auditItem.itemKey}`);
    }
};

exports.handler = async (event) => {
    const now = new Date().toISOString();

    try {
        console.log("+++lambda event is ", event);
        for (const record of event.Records) {
            let auditItem;

            if (record.eventName === 'INSERT') {
                auditItem = createAuditItem(record, now);
            } else if (record.eventName === 'MODIFY') {
                auditItem = createModifyAuditItem(record, now);
            }

            if (auditItem) {
                await writeAuditItem(auditItem);
            }
        }
    } catch (error) {
        console.error('Error processing DynamoDB Stream event:', error);
        return {
            statusCode: 500,
            body: JSON.stringify('Failed to process DynamoDB Stream event')
        };
    }

    return {
        statusCode: 200,
        body: JSON.stringify('Audit logs successfully created')
    };
};
