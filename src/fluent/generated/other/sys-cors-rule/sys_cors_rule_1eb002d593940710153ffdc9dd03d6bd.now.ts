import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['1eb002d593940710153ffdc9dd03d6bd'],
    table: 'sys_cors_rule',
    data: {
        access_control_allow_credentials: 'true',
        access_control_allow_headers: 'Authorization, Content-Type, Accept',
        active: 'true',
        delete: 'true',
        domain: 'http://localhost:3000',
        for_embeddables: 'false',
        get: 'true',
        max_age: '3600',
        name: 'SuboClean Cors  Local 3000',
        patch: 'true',
        post: 'true',
        put: 'true',
        rest_api: 'def2963093d80310153ffdc9dd03d6e1',
        use_resource_path: 'false',
    },
})
