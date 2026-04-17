import { ChoiceColumn, FloatColumn, StringColumn, Table } from '@servicenow/sdk/core'

export const x_1986056_sugbocle_route_stop = Table({
    actions: ['read', 'update', 'create'],
    allowClientScripts: true,
    allowNewFields: true,
    allowUiActions: true,
    allowWebServiceAccess: true,
    attributes: {
        enforce_dot_walk_cross_scope_access: true,
    },
    label: 'Route Stop',
    name: 'x_1986056_sugbocle_route_stop',
    schema: {
        u_latitude: FloatColumn({
            label: [
                {
                    label: 'latitude',
                },
            ],
            maxLength: 40,
        }),
        u_label: StringColumn({
            label: [
                {
                    label: 'label',
                },
            ],
            maxLength: 100,
        }),
        u_point_type: ChoiceColumn({
            choices: {
                stop: {
                    label: 'stop',
                    sequence: 1,
                },
                start: {
                    label: 'start',
                    sequence: 0,
                },
                end: {
                    label: 'end',
                    sequence: 2,
                },
            },
            dropdown: 'dropdown_without_none',
            label: [
                {
                    label: 'point_type',
                },
            ],
        }),
        u_longitude: FloatColumn({
            label: [
                {
                    label: 'longitude',
                },
            ],
            maxLength: 40,
        }),
    },
})
