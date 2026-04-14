import { Acl } from '@servicenow/sdk/core'

Acl({
    $id: Now.ID['1fe50d7893500310153ffdc9dd03d6cf'],
    description: 'Allow read for records in x_1986056_sugbocle_schedule, for users with role x_1986056_sugbocle.admin.',
    localOrExisting: 'Existing',
    type: 'record',
    operation: 'read',
    roles: ['x_1986056_sugbocle.admin'],
    table: 'x_1986056_sugbocle_schedule',
})
