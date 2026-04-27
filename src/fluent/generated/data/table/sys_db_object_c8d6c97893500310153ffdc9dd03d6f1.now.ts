import { DateTimeColumn, IntegerColumn, StringColumn, Table } from '@servicenow/sdk/core'

export const x_1986056_sugbocle_chatbot_rate_limit = Table({
    actions: ['read', 'update', 'create', 'delete'],
    allowClientScripts: true,
    allowNewFields: true,
    allowUiActions: true,
    allowWebServiceAccess: true,
    attributes: {
        enforce_dot_walk_cross_scope_access: true,
    },
    label: 'Chatbot Rate Limit',
    name: 'x_1986056_sugbocle_chatbot_rate_limit',
    schema: {
        u_key: StringColumn({
            label: [{ label: 'Key' }],
            maxLength: 80,
        }),
        u_count: IntegerColumn({
            label: [{ label: 'Count' }],
        }),
        u_window_end: DateTimeColumn({
            label: [{ label: 'Window End' }],
        }),
    },
    index: [
        {
            name: 'idx_key',
            unique: true,
            element: 'u_key',
        },
    ],
})
