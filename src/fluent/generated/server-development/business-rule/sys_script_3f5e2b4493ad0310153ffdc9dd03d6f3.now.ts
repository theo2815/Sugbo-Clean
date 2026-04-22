import { BusinessRule } from '@servicenow/sdk/core'

BusinessRule({
    $id: Now.ID['3f5e2b4493ad0310153ffdc9dd03d6f3'],
    name: 'Classify Report With Gemini',
    table: 'x_1986056_sugbocle_report',
    when: 'async',
    action: ['insert'],
    active: true,
    description: 'Async: calls SugboGeminiClassifier to set u_ai_severity + u_ai_summary on every newly inserted report. Skipped when description is empty.',
    condition: '!current.u_description.nil()',
    script: Now.include('./sys_script_3f5e2b4493ad0310153ffdc9dd03d6f3.server.js'),
})
