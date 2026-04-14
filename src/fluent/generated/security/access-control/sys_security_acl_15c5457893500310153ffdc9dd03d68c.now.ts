import { Acl } from '@servicenow/sdk/core'

Acl({
    $id: Now.ID['15c5457893500310153ffdc9dd03d68c'],
    description: 'Allow create for records in x_1986056_sugbocle_hauler, for users with role x_1986056_sugbocle.admin.',
    localOrExisting: 'Existing',
    type: 'record',
    operation: 'create',
    roles: ['x_1986056_sugbocle.admin'],
    table: 'x_1986056_sugbocle_hauler',
})
