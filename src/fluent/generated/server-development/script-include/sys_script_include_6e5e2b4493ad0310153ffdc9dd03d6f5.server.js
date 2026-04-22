var SugboChatbot = Class.create();
SugboChatbot.prototype = {
    initialize: function () {},

    type: 'SugboChatbot',

    MAX_QUESTION_LEN: 500,
    MAX_ANSWER_LEN: 1200,

    SYSTEM_PROMPT: [
        "You are SugboClean's resident assistant. Answer questions about waste pickup schedules, waste sorting, and how to use the app.",
        "Use ONLY the data provided below. If the answer is not in the data, say so honestly — do not invent schedules, barangays, or waste types.",
        "Reply in the same language as the question (English, Cebuano/Bisaya, or Tagalog).",
        "Keep replies to 2–3 sentences.",
        "When natural, suggest a related action: subscribe to reminders, file a missed-pickup report, check the waste sorting guide.",
        "Never give medical, legal, or emergency advice — direct to LGU hotline instead."
    ].join(' '),

    ask: function (question) {
        var q = String(question || '').trim();
        if (!q) return '';
        if (q.length > this.MAX_QUESTION_LEN) q = q.substring(0, this.MAX_QUESTION_LEN);

        var apiKey = gs.getProperty('x_1986056_sugbocle.gemini.api_key');
        if (!apiKey) {
            gs.error('[SugboChatbot] api key property is empty');
            return '';
        }

        var contextJson;
        try {
            contextJson = this._buildContext();
        } catch (e) {
            gs.error('[SugboChatbot] context build failed: ' + e);
            return '';
        }

        try {
            var r = new sn_ws.RESTMessageV2('SugboClean Gemini Classifier', 'chatbot_answer');
            r.setStringParameterNoEscape('apiKey', apiKey);

            // Build the full Gemini body in JS and send it raw — avoids PDI-side
            // Escape JSON quirks when the grounding context contains braces/quotes.
            var body = {
                contents: [{
                    parts: [{
                        text: 'Grounding data (JSON):\n' + contextJson + '\n\nUser question: ' + q
                    }]
                }],
                generationConfig: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: 'OBJECT',
                        properties: {
                            answer: { type: 'STRING' }
                        },
                        required: ['answer']
                    }
                }
            };
            r.setRequestBody(JSON.stringify(body));

            var resp = r.execute();
            var status = resp.getStatusCode();
            var body = resp.getBody();

            if (status !== 200) {
                gs.error('[SugboChatbot] HTTP ' + status + ' body=' + body);
                return '';
            }

            var envelope = JSON.parse(body);
            var text = '';
            if (envelope && envelope.candidates && envelope.candidates[0] &&
                envelope.candidates[0].content && envelope.candidates[0].content.parts &&
                envelope.candidates[0].content.parts[0]) {
                text = envelope.candidates[0].content.parts[0].text || '';
            }
            if (!text) {
                gs.error('[SugboChatbot] no text in response: ' + body);
                return '';
            }

            var parsed = JSON.parse(text);
            var answer = String(parsed.answer || '').trim();
            if (answer.length > this.MAX_ANSWER_LEN) answer = answer.substring(0, this.MAX_ANSWER_LEN);
            return answer;
        } catch (e) {
            gs.error('[SugboChatbot] exception: ' + e);
            return '';
        }
    },

    _buildContext: function () {
        var payload = {
            system: this.SYSTEM_PROMPT,
            barangays: this._loadBarangays(),
            schedules: this._loadSchedules(),
            waste_items: this._loadWasteItems()
        };
        return JSON.stringify(payload);
    },

    _loadBarangays: function () {
        var out = [];
        var gr = new GlideRecord('x_1986056_sugbocle_barangay');
        gr.orderBy('u_name');
        gr.query();
        while (gr.next()) {
            out.push({
                name: gr.getValue('u_name'),
                zone: gr.getValue('u_zone')
            });
        }
        return out;
    },

    _loadSchedules: function () {
        var out = [];
        var gr = new GlideRecord('x_1986056_sugbocle_schedule');
        gr.query();
        while (gr.next()) {
            out.push({
                barangay: gr.getDisplayValue('u_barangay'),
                hauler: gr.getDisplayValue('u_hauler'),
                waste_type: gr.getValue('u_waste_type'),
                day_of_week: gr.getDisplayValue('u_day_of_week'),
                time_window_start: gr.getValue('u_time_window_start'),
                time_window_end: gr.getValue('u_time_window_end')
            });
        }
        return out;
    },

    _loadWasteItems: function () {
        var out = [];
        var gr = new GlideRecord('x_1986056_sugbocle_waste_item');
        gr.orderBy('u_name');
        gr.query();
        while (gr.next()) {
            out.push({
                name: gr.getValue('u_name'),
                bin_type: gr.getValue('u_bin_type'),
                bin_color: gr.getValue('u_bin_color'),
                disposal_instructions: gr.getValue('u_disposal_instructions')
            });
        }
        return out;
    }
};
