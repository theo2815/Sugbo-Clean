import { List, default_view } from '@servicenow/sdk/core'

List({
    table: 'x_1986056_sugbocle_barangay',
    view: default_view,
    columns: ['u_name', 'u_zone', 'u_latitude', 'u_longitude'],
})
