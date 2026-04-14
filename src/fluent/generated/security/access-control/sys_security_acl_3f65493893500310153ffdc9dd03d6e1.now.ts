import { Acl } from '@servicenow/sdk/core'

Acl({
    $id: Now.ID['3f65493893500310153ffdc9dd03d6e1'],
    description: 'Allow read for records in x_1986056_sugbocle_barangay, for users with role x_1986056_sugbocle.admin.',
    localOrExisting: 'Existing',
    type: 'record',
    operation: 'read',
    roles: ['x_1986056_sugbocle.admin'],
    table: 'x_1986056_sugbocle_barangay',
})
