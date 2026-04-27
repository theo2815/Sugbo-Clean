(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var RATE_LIMIT = 10;          // requests per window per IP
    var WINDOW_MS = 60 * 1000;    // 1 minute fixed window

    var body = request.body.data || {};
    var question = String(body.question || '').trim();

    if (!question) {
        response.setStatus(400);
        response.setBody({ error: { message: 'Question is required' } });
        return;
    }

    if (question.length > 500) {
        response.setStatus(400);
        response.setBody({ error: { message: 'Question is too long (max 500 characters)' } });
        return;
    }

    // Fixed-window rate limit keyed on (ip, minute_bucket). Bursts at the
    // window boundary are accepted by design — for capstone abuse-prevention,
    // breaking the curl-loop pattern is the goal, not perfect smoothing.
    var ip = 'unknown';
    try {
        var sess = gs.getSession();
        if (sess && sess.getClientIP) ip = String(sess.getClientIP() || 'unknown');
    } catch (ipErr) {
        // Fall through with 'unknown' — applies a shared bucket to anyone
        // we can't identify, which is the safe direction.
    }

    var nowMs = new GlideDateTime().getNumericValue();
    var bucket = Math.floor(nowMs / WINDOW_MS);
    var key = ip + '|' + bucket;

    var rl = new GlideRecord('x_1986056_sugbocle_chatbot_rate_limit');
    rl.addQuery('u_key', key);
    rl.setLimit(1);
    rl.query();

    if (rl.next()) {
        var count = parseInt(rl.getValue('u_count'), 10) || 0;
        var windowEndMs = new GlideDateTime(rl.getValue('u_window_end')).getNumericValue();

        if (windowEndMs > nowMs && count >= RATE_LIMIT) {
            var retryAfter = Math.max(1, Math.ceil((windowEndMs - nowMs) / 1000));
            response.setStatus(429);
            response.setHeader('Retry-After', String(retryAfter));
            response.setBody({ error: { message: 'Too many questions in a short time. Please try again in a moment.' } });
            return;
        }

        if (windowEndMs > nowMs) {
            rl.setValue('u_count', count + 1);
        } else {
            // Same key, expired window — reset (rare; cleanup job usually deletes first).
            rl.setValue('u_count', 1);
            var resetEnd = new GlideDateTime();
            resetEnd.setNumericValue(nowMs + WINDOW_MS);
            rl.setValue('u_window_end', resetEnd);
        }
        rl.update();
    } else {
        var ins = new GlideRecord('x_1986056_sugbocle_chatbot_rate_limit');
        ins.initialize();
        ins.setValue('u_key', key);
        ins.setValue('u_count', 1);
        var endGdt = new GlideDateTime();
        endGdt.setNumericValue(nowMs + WINDOW_MS);
        ins.setValue('u_window_end', endGdt);
        var insertedSysId;
        try {
            insertedSysId = ins.insert();
        } catch (insertErr) {
            insertedSysId = null;
        }
        // Lost the insert race against another concurrent request — re-query
        // and treat as cache hit (increment or 429). Relies on the unique
        // index on u_key to make duplicate inserts fail deterministically.
        if (!insertedSysId) {
            var retry = new GlideRecord('x_1986056_sugbocle_chatbot_rate_limit');
            retry.addQuery('u_key', key);
            retry.setLimit(1);
            retry.query();
            if (retry.next()) {
                var retryCount = parseInt(retry.getValue('u_count'), 10) || 0;
                var retryWindowEndMs = new GlideDateTime(retry.getValue('u_window_end')).getNumericValue();
                if (retryWindowEndMs > nowMs && retryCount >= RATE_LIMIT) {
                    var retryAfter2 = Math.max(1, Math.ceil((retryWindowEndMs - nowMs) / 1000));
                    response.setStatus(429);
                    response.setHeader('Retry-After', String(retryAfter2));
                    response.setBody({ error: { message: 'Too many questions in a short time. Please try again in a moment.' } });
                    return;
                }
                retry.setValue('u_count', retryCount + 1);
                retry.update();
            }
        }
    }

    try {
        var result = new SugboChatbot().ask(question);

        if (!result || !result.answer) {
            var status = (result && result.status) || 502;
            var message = (result && result.error) || 'The assistant is unavailable right now. Please try again in a moment.';
            response.setStatus(status);
            response.setBody({ error: { message: message } });
            return;
        }

        response.setStatus(200);
        response.setBody({ result: { answer: result.answer, action: result.action || 'none' } });
    } catch (e) {
        gs.error('[ChatbotAsk] exception: ' + e);
        response.setStatus(500);
        response.setBody({ error: { message: 'Unexpected error' } });
    }

})(request, response);
