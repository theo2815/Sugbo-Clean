import { Acl } from '@servicenow/sdk/core'

Acl({
    $id: Now.ID['5c75893893500310153ffdc9dd03d65e'],
    description:
        'Allow delete for records in x_1986056_sugbocle_barangay, for users with role x_1986056_sugbocle.admin.',
    localOrExisting: 'Existing',
    type: 'record',
    operation: 'delete',
    roles: ['x_1986056_sugbocle.admin'],
    table: 'x_1986056_sugbocle_barangay',
})
