import { ReferenceColumn, Table } from '@servicenow/sdk/core'

export const x_1986056_sugbocle_hauler = Table({
    actions: ['read', 'update', 'create'],
    allowClientScripts: true,
    allowNewFields: true,
    allowUiActions: true,
    allowWebServiceAccess: true,
    attributes: {
        enforce_dot_walk_cross_scope_access: true,
    },
    label: 'Hauler',
    name: 'x_1986056_sugbocle_hauler',
    schema: {
        u_barangay: ReferenceColumn({
            label: [
                {
                    label: 'barangay',
                },
            ],
            referenceTable: 'x_1986056_sugbocle_barangay',
        }),
    },
    index: [
        {
            name: 'index',
            unique: false,
            element: 'u_barangay',
        },
    ],
})
