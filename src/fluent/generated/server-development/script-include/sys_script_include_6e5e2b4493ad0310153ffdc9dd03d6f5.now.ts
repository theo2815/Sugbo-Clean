import { ScriptInclude } from '@servicenow/sdk/core'

ScriptInclude({
    $id: Now.ID['6e5e2b4493ad0310153ffdc9dd03d6f5'],
    name: 'SugboChatbot',
    accessibleFrom: 'package_private',
    active: true,
    description: 'Resident chatbot assistant. Bundles barangay/schedule/waste_item rows as grounding context and calls the SugboClean Gemini Classifier REST Message (method chatbot_answer) for a bilingual answer. Returns the answer string or empty on failure.',
    script: Now.include('./sys_script_include_6e5e2b4493ad0310153ffdc9dd03d6f5.server.js'),
})
