import { ChoiceColumn, StringColumn, Table } from '@servicenow/sdk/core'

export const x_1986056_sugbocle_report = Table({
    actions: ['read', 'update', 'create'],
    allowClientScripts: true,
    allowNewFields: true,
    allowUiActions: true,
    allowWebServiceAccess: true,
    attributes: {
        enforce_dot_walk_cross_scope_access: true,
    },
    label: 'Report',
    name: 'x_1986056_sugbocle_report',
    schema: {
        u_ai_severity: ChoiceColumn({
            choices: {
                Low: { label: 'Low', sequence: 0 },
                Medium: { label: 'Medium', sequence: 1 },
                High: { label: 'High', sequence: 2 },
                Critical: { label: 'Critical', sequence: 3 },
            },
            dropdown: 'dropdown_with_none',
            label: [{ label: 'AI Severity' }],
        }),
        u_ai_summary: StringColumn({
            label: [{ label: 'AI Summary' }],
            maxLength: 240,
        }),
        u_description_lang: StringColumn({
            label: [{ label: 'Description Language' }],
            maxLength: 8,
        }),
        u_description_en: StringColumn({
            label: [{ label: 'Description (English)' }],
            maxLength: 4000,
        }),
    },
})
