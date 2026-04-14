import { List, default_view } from '@servicenow/sdk/core'

List({
    table: 'x_1986056_sugbocle_report',
    view: default_view,
    columns: [
        'u_report_code',
        'u_barangay',
        'u_email',
        'u_missed_date',
        'u_status',
        'u_waste_type',
        'u_photo',
        'u_description',
    ],
})
