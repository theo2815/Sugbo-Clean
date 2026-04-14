import { Acl } from '@servicenow/sdk/core'

Acl({
    $id: Now.ID['6b3689b893500310153ffdc9dd03d6b4'],
    description:
        'Allow read for records in x_1986056_sugbocle_route_stop, for users with role x_1986056_sugbocle.admin.',
    localOrExisting: 'Existing',
    type: 'record',
    operation: 'read',
    roles: ['x_1986056_sugbocle.admin'],
    table: 'x_1986056_sugbocle_route_stop',
})
