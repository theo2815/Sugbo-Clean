import { Acl } from '@servicenow/sdk/core'

Acl({
    $id: Now.ID['f18609f893500310153ffdc9dd03d678'],
    description:
        'Allow create for records in x_1986056_sugbocle_reminder_subscription, for users with role x_1986056_sugbocle.resident.',
    localOrExisting: 'Existing',
    type: 'record',
    operation: 'create',
    roles: ['x_1986056_sugbocle.resident'],
    table: 'x_1986056_sugbocle_reminder_subscription',
})
