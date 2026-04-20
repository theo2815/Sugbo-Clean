import { DateTimeColumn, ReferenceColumn, StringColumn, Table } from '@servicenow/sdk/core'

export const x_1986056_sugbocle_reminder_subscription = Table({
    actions: ['read', 'update', 'create'],
    allowClientScripts: true,
    allowNewFields: true,
    allowUiActions: true,
    allowWebServiceAccess: true,
    attributes: {
        enforce_dot_walk_cross_scope_access: true,
    },
    label: 'Reminder Subscription',
    name: 'x_1986056_sugbocle_reminder_subscription',
    schema: {
        u_schedule: ReferenceColumn({
            label: [
                {
                    label: 'Schedule',
                },
            ],
            referenceTable: 'x_1986056_sugbocle_schedule',
        }),
        u_last_sent_at: DateTimeColumn({
            label: [
                {
                    label: 'Last Sent At',
                },
            ],
        }),
        u_unsubscribe_token: StringColumn({
            label: [
                {
                    label: 'Unsubscribe Token',
                },
            ],
            maxLength: 32,
        }),
    },
})
