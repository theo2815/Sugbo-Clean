import { Acl } from '@servicenow/sdk/core'

Acl({
    $id: Now.ID['e986c5f893500310153ffdc9dd03d6cf'],
    description:
        'Allow read for records in x_1986056_sugbocle_reminder_subscription, for users with role x_1986056_sugbocle.resident.',
    localOrExisting: 'Existing',
    type: 'record',
    operation: 'read',
    roles: ['x_1986056_sugbocle.resident'],
    table: 'x_1986056_sugbocle_reminder_subscription',
})
