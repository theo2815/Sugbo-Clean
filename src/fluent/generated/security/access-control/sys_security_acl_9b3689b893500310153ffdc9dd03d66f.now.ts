import { Acl } from '@servicenow/sdk/core'

Acl({
    $id: Now.ID['9b3689b893500310153ffdc9dd03d66f'],
    description:
        'Allow create for records in x_1986056_sugbocle_route_stop, for users with role x_1986056_sugbocle.admin.',
    localOrExisting: 'Existing',
    type: 'record',
    operation: 'create',
    roles: ['x_1986056_sugbocle.admin'],
    table: 'x_1986056_sugbocle_route_stop',
})
