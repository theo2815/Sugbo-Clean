import { Acl } from '@servicenow/sdk/core'

Acl({
    $id: Now.ID['a986c5f893500310153ffdc9dd03d663'],
    description:
        'Allow create for records in x_1986056_sugbocle_reminder_subscription, for users with role x_1986056_sugbocle.admin.',
    localOrExisting: 'Existing',
    type: 'record',
    operation: 'create',
    roles: ['x_1986056_sugbocle.admin'],
    table: 'x_1986056_sugbocle_reminder_subscription',
})
