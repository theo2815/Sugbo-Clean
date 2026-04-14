import { List, default_view } from '@servicenow/sdk/core'

List({
    table: 'x_1986056_sugbocle_schedule',
    view: default_view,
    columns: ['u_barangay', 'u_hauler', 'u_time_window_start', 'u_time_window_end', 'u_day_of_week'],
})
