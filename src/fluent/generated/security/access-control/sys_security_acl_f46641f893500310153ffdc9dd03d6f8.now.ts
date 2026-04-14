import { Acl } from '@servicenow/sdk/core'

Acl({
    $id: Now.ID['f46641f893500310153ffdc9dd03d6f8'],
    description:
        'Allow delete for records in x_1986056_sugbocle_waste_item, for users with role x_1986056_sugbocle.admin.',
    localOrExisting: 'Existing',
    type: 'record',
    operation: 'delete',
    roles: ['x_1986056_sugbocle.admin'],
    table: 'x_1986056_sugbocle_waste_item',
})
