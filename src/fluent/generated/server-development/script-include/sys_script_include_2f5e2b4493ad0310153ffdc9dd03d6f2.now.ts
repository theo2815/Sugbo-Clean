import { ScriptInclude } from '@servicenow/sdk/core'

ScriptInclude({
    $id: Now.ID['2f5e2b4493ad0310153ffdc9dd03d6f2'],
    name: 'SugboGeminiClassifier',
    accessibleFrom: 'package_private',
    active: true,
    description: 'Wraps the SugboClean Gemini Classifier REST Message. Returns { severity, summary } from a report description. Called from the Flow Designer Classify-on-Create flow.',
    script: Now.include('./sys_script_include_2f5e2b4493ad0310153ffdc9dd03d6f2.server.js'),
})
