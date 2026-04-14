import { Acl } from '@servicenow/sdk/core'

Acl({
    $id: Now.ID['cc75893893500310153ffdc9dd03d632'],
    description:
        'Allow write for records in x_1986056_sugbocle_barangay, for users with role x_1986056_sugbocle.admin.',
    localOrExisting: 'Existing',
    type: 'record',
    operation: 'write',
    roles: ['x_1986056_sugbocle.admin'],
    table: 'x_1986056_sugbocle_barangay',
})
