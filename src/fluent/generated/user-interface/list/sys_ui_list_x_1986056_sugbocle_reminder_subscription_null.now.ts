import { List, default_view } from '@servicenow/sdk/core'

List({
    table: 'x_1986056_sugbocle_reminder_subscription',
    view: default_view,
    columns: ['u_barangay', 'u_schedule', 'u_email', 'u_active', 'u_unsubscribe_token', 'u_last_sent_at'],
})
