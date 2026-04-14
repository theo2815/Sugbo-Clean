import { Acl } from '@servicenow/sdk/core'

Acl({
    $id: Now.ID['bb36c9b893500310153ffdc9dd03d64a'],
    description:
        'Allow delete for records in x_1986056_sugbocle_route_stop, for users with role x_1986056_sugbocle.admin.',
    localOrExisting: 'Existing',
    type: 'record',
    operation: 'delete',
    roles: ['x_1986056_sugbocle.admin'],
    table: 'x_1986056_sugbocle_route_stop',
})
