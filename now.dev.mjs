import { servicenowFrontEndPlugins, watch } from '@servicenow/isomorphic-rollup'

export default async ({ rootDir, config, fs, path, logger, credential }) => {
    const clientDir = path.join(rootDir, config.clientDir)
    const staticContentDir = path.join(rootDir, config.staticContentDir)
    fs.rmSync(staticContentDir, { recursive: true, force: true })
    const watcher = watch({
        fs,
        input: path.join(clientDir, '**', '*.html'),
        plugins: servicenowFrontEndPlugins({
            dev: true,
            scope: config.scope,
            rootDir: clientDir,
            watchPaths: [staticContentDir],
            // Extend NowSDK's built-in proxyPaths with /oauth_token.do so the PKCE
            // token exchange is same-origin to the dev server and bypasses the
            // /oauth_token.do CORS limitation (sys_cors_rule is REST-API-scoped).
            proxyPaths: [
                '/api',
                '/amb',
                '/scripts/',
                '/images/@servicenow/',
                '/uxasset/externals',
                '/$uxappimmutables.do',
                '/uxta',
                '/oauth_token.do',
            ],
            credential,
        }),
        output: {
            dir: staticContentDir,
            sourcemap: true,
        },
    })

    return new Promise((resolve, reject) => {
        watcher.on('event', (event) => {
            if (event.error) {
                reject(event.error)
            } else if (event.result) {
                logger.info(`Finished watch build in ${event.duration}ms`)
                event.result.close()
            }
        })
    })
}
