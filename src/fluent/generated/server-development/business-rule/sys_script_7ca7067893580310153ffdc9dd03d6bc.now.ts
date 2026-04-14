import { BusinessRule } from '@servicenow/sdk/core'

BusinessRule({
    $id: Now.ID['7ca7067893580310153ffdc9dd03d6bc'],
    name: 'Generate Report Code',
    table: 'x_1986056_sugbocle_report',
    when: 'before',
    action: ['insert'],
    script: Now.include('./sys_script_7ca7067893580310153ffdc9dd03d6bc.server.js'),
})
