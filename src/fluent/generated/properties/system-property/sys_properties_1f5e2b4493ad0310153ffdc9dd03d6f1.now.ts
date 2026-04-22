import { Property } from '@servicenow/sdk/core'

Property({
    $id: Now.ID['1f5e2b4493ad0310153ffdc9dd03d6f1'],
    name: 'x_1986056_sugbocle.gemini.api_key',
    type: 'password2',
    value: '',
    description: 'Google Gemini API key consumed by SugboGeminiClassifier. Set the value in PDI; never commit it.',
    isPrivate: true,
    ignoreCache: true,
    roles: {
        read: ['admin'],
        write: ['admin'],
    },
})
