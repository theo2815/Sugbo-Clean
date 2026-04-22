(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

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

    try {
        var answer = new SugboChatbot().ask(question);
        if (!answer) {
            response.setStatus(502);
            response.setBody({ error: { message: 'The assistant is unavailable right now. Please try again in a moment.' } });
            return;
        }
        response.setStatus(200);
        response.setBody({ result: { answer: answer } });
    } catch (e) {
        gs.error('[ChatbotAsk] exception: ' + e);
        response.setStatus(500);
        response.setBody({ error: { message: 'Unexpected error' } });
    }

})(request, response);
