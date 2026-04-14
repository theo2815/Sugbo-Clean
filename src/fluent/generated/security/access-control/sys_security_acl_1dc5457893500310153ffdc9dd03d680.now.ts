import { Acl } from '@servicenow/sdk/core'

Acl({
    $id: Now.ID['1dc5457893500310153ffdc9dd03d680'],
    description:
        'Allow read for records in x_1986056_sugbocle_hauler, for users with role x_1986056_sugbocle.resident.',
    localOrExisting: 'Existing',
    type: 'record',
    operation: 'read',
    roles: ['x_1986056_sugbocle.resident'],
    table: 'x_1986056_sugbocle_hauler',
})
