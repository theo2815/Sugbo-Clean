import { Acl } from '@servicenow/sdk/core'

Acl({
    $id: Now.ID['798609f893500310153ffdc9dd03d66f'],
    description:
        'Allow read for records in x_1986056_sugbocle_reminder_subscription, for users with role x_1986056_sugbocle.admin.',
    localOrExisting: 'Existing',
    type: 'record',
    operation: 'read',
    roles: ['x_1986056_sugbocle.admin'],
    table: 'x_1986056_sugbocle_reminder_subscription',
})
