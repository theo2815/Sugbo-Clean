import { Acl } from '@servicenow/sdk/core'

Acl({
    $id: Now.ID['9c6641f893500310153ffdc9dd03d66e'],
    description:
        'Allow read for records in x_1986056_sugbocle_waste_item, for users with role x_1986056_sugbocle.admin.',
    localOrExisting: 'Existing',
    type: 'record',
    operation: 'read',
    roles: ['x_1986056_sugbocle.admin'],
    table: 'x_1986056_sugbocle_waste_item',
})
