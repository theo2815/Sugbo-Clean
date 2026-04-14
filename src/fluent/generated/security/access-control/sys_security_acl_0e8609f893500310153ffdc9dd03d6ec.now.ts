import { Acl } from '@servicenow/sdk/core'

Acl({
    $id: Now.ID['0e8609f893500310153ffdc9dd03d6ec'],
    description:
        'Allow delete for records in x_1986056_sugbocle_reminder_subscription, for users with role x_1986056_sugbocle.admin.',
    localOrExisting: 'Existing',
    type: 'record',
    operation: 'delete',
    roles: ['x_1986056_sugbocle.admin'],
    table: 'x_1986056_sugbocle_reminder_subscription',
})
