import { BusinessRule } from '@servicenow/sdk/core'

BusinessRule({
    $id: Now.ID['e7134735931c0b10153ffdc9dd03d6de'],
    name: 'Sync Route Stop Hauler',
    table: 'x_1986056_sugbocle_route_stop',
    when: 'before',
    action: ['update', 'insert'],
    script: Now.include('./sys_script_e7134735931c0b10153ffdc9dd03d6de.server.js'),
})
