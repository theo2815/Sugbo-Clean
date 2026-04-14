import { List, default_view } from '@servicenow/sdk/core'

List({
    table: 'x_1986056_sugbocle_hauler',
    view: default_view,
    columns: ['u_name', 'u_areas_covered', 'u_contact_number'],
})
