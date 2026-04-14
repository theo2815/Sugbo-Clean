import { List, default_view } from '@servicenow/sdk/core'

List({
    table: 'x_1986056_sugbocle_waste_item',
    view: default_view,
    columns: ['u_name', 'u_bin_color', 'u_bin_type', 'u_disposal_instructions'],
})
