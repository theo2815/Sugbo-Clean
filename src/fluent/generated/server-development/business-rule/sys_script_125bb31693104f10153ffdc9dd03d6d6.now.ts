import { BusinessRule } from '@servicenow/sdk/core'

BusinessRule({
    $id: Now.ID['125bb31693104f10153ffdc9dd03d6d6'],
    name: 'SugboClean: Generate Unsubscribe Token',
    table: 'x_1986056_sugbocle_reminder_subscription',
    when: 'before',
    action: ['update', 'delete', 'insert', 'query'],
    script: Now.include('./sys_script_125bb31693104f10153ffdc9dd03d6d6.server.js'),
})
