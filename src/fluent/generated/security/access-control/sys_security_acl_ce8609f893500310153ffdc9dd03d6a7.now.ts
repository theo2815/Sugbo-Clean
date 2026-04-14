import { Acl } from '@servicenow/sdk/core'

Acl({
    $id: Now.ID['ce8609f893500310153ffdc9dd03d6a7'],
    description:
        'Allow write for records in x_1986056_sugbocle_reminder_subscription, for users with role x_1986056_sugbocle.admin.',
    localOrExisting: 'Existing',
    type: 'record',
    operation: 'write',
    roles: ['x_1986056_sugbocle.admin'],
    table: 'x_1986056_sugbocle_reminder_subscription',
})
