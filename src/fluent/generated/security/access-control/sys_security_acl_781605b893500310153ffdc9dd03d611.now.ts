import { Acl } from '@servicenow/sdk/core'

Acl({
    $id: Now.ID['781605b893500310153ffdc9dd03d611'],
    description: 'Allow write for records in x_1986056_sugbocle_report, for users with role x_1986056_sugbocle.admin.',
    localOrExisting: 'Existing',
    type: 'record',
    operation: 'write',
    roles: ['x_1986056_sugbocle.admin'],
    table: 'x_1986056_sugbocle_report',
})
