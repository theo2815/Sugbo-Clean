import { Acl } from '@servicenow/sdk/core'

Acl({
    $id: Now.ID['6365493893500310153ffdc9dd03d65a'],
    description:
        'Allow create for records in x_1986056_sugbocle_barangay, for users with role x_1986056_sugbocle.admin.',
    localOrExisting: 'Existing',
    type: 'record',
    operation: 'create',
    roles: ['x_1986056_sugbocle.admin'],
    table: 'x_1986056_sugbocle_barangay',
})
