import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['3ed716f893d80310153ffdc9dd03d681'],
    table: 'sys_cors_rule',
    data: {
        access_control_allow_credentials: 'true',
        access_control_allow_headers: 'Content-Type,Accept,Authorization',
        active: 'true',
        delete: 'true',
        domain: 'https://dev375738.service-now.com',
        for_embeddables: 'false',
        get: 'true',
        max_age: '0',
        name: 'SugboClean CORS',
        patch: 'true',
        post: 'true',
        put: 'true',
        rest_api: 'def2963093d80310153ffdc9dd03d6e1',
        use_resource_path: 'false',
    },
})
