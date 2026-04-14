import { Acl } from '@servicenow/sdk/core'

Acl({
    $id: Now.ID['e416c1b893500310153ffdc9dd03d6a7'],
    description: 'Allow read for records in x_1986056_sugbocle_report, for users with role x_1986056_sugbocle.admin.',
    localOrExisting: 'Existing',
    type: 'record',
    operation: 'read',
    roles: ['x_1986056_sugbocle.admin'],
    table: 'x_1986056_sugbocle_report',
})
