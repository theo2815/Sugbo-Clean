import { Acl } from '@servicenow/sdk/core'

Acl({
    $id: Now.ID['f1c5857893500310153ffdc9dd03d654'],
    description: 'Allow write for records in x_1986056_sugbocle_hauler, for users with role x_1986056_sugbocle.admin.',
    localOrExisting: 'Existing',
    type: 'record',
    operation: 'write',
    roles: ['x_1986056_sugbocle.admin'],
    table: 'x_1986056_sugbocle_hauler',
})
