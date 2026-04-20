import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['d63cb31693104f10153ffdc9dd03d655'],
    table: 'sysevent_register',
    data: {
        derived_priority: 100,
        description: 'Fires when a pickup-reminder email should be sent. parm1 = recipient email, parm2 = schedule',
        event_name: 'x_1986056_sugbocle.pickup_reminder',
        priority: 100,
        suffix: 'pickup_reminder',
        table: 'x_1986056_sugbocle_reminder_subscription',
    },
})
