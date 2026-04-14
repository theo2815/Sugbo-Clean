import { Acl } from '@servicenow/sdk/core'

Acl({
    $id: Now.ID['6dc5457893500310153ffdc9dd03d6c4'],
    description: 'Allow read for records in x_1986056_sugbocle_hauler, for users with role x_1986056_sugbocle.admin.',
    localOrExisting: 'Existing',
    type: 'record',
    operation: 'read',
    roles: ['x_1986056_sugbocle.admin'],
    table: 'x_1986056_sugbocle_hauler',
})
