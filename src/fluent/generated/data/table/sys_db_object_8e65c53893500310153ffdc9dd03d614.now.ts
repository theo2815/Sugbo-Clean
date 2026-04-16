import { FloatColumn, Table } from '@servicenow/sdk/core'

export const x_1986056_sugbocle_barangay = Table({
    actions: ['read', 'update', 'create'],
    allowClientScripts: true,
    allowNewFields: true,
    allowUiActions: true,
    allowWebServiceAccess: true,
    attributes: {
        enforce_dot_walk_cross_scope_access: true,
    },
    label: 'Barangay',
    name: 'x_1986056_sugbocle_barangay',
    schema: {
        u_longitude: FloatColumn({
            label: [
                {
                    label: 'longitude',
                },
            ],
            maxLength: 255,
        }),
        u_latitude: FloatColumn({
            label: [
                {
                    label: 'latitude',
                },
            ],
            maxLength: 255,
        }),
    },
})
