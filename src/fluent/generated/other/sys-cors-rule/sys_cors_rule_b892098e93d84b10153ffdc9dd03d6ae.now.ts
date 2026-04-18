import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['b892098e93d84b10153ffdc9dd03d6ae'],
    table: 'sys_cors_rule',
    data: {
        access_control_allow_credentials: 'true',
        access_control_allow_headers: 'Content-Type,Accept,Authorization',
        active: 'true',
        delete: 'false',
        domain: 'http://localhost:3000',
        for_embeddables: 'false',
        get: 'true',
        max_age: '0',
        name: 'SugboClean OAuth CORS',
        patch: 'false',
        post: 'true',
        put: 'false',
        rest_api: '090c5ee353721110c733ddeeff7b1299',
        use_resource_path: 'false',
    },
})
