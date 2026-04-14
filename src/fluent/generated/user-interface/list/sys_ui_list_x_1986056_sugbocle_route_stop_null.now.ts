import { List, default_view } from '@servicenow/sdk/core'

List({
    table: 'x_1986056_sugbocle_route_stop',
    view: default_view,
    columns: ['u_barangay', 'u_hauler', 'u_estimated_arrival', 'u_stop_order', 'u_stop_status'],
})
