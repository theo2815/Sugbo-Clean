import { Table } from '@servicenow/sdk/core'

export const x_1986056_sugbocle_waste_item = Table({
    actions: ['read', 'update', 'create'],
    allowClientScripts: true,
    allowNewFields: true,
    allowUiActions: true,
    allowWebServiceAccess: true,
    attributes: {
        enforce_dot_walk_cross_scope_access: true,
    },
    label: 'Waste Item',
    name: 'x_1986056_sugbocle_waste_item',
    schema: {},
})
