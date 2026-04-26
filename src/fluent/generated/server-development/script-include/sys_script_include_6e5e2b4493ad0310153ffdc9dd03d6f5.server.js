var SugboChatbot = Class.create();
SugboChatbot.prototype = {
    initialize: function () {},

    type: 'SugboChatbot',

    MAX_QUESTION_LEN: 500,
    MAX_ANSWER_LEN: 1200,

    ALLOWED_ACTIONS: ['subscribe', 'report', 'track', 'waste_guide', 'none'],

    SYSTEM_PROMPT: [
        "You are SugboClean's resident assistant. Answer questions about waste pickup schedules, waste sorting, and how to use the app.",
        "Use ONLY the data provided below. If the answer is not in the data, say so honestly — do not invent schedules, barangays, or waste types.",
        "Reply in the same language as the question (English, Cebuano/Bisaya, or Tagalog).",
        "Keep the 'answer' field to 2–3 sentences.",
        "Also set an 'action' field to ONE of: 'subscribe' (signing up for pickup reminders, /schedule), 'report' (filing a missed-pickup report, /report), 'track' (checking a report status by code, /track), 'waste_guide' (waste sorting guide, /waste-guide), or 'none' (no specific page applies).",
        "Pick the action that best matches what the resident should do next. Use 'none' for greetings, refusals, off-topic chatter, or general-info answers with no clear next step.",
        "Never give medical, legal, or emergency advice — direct to the LGU hotline instead."
    ].join(' '),

    ask: function (question) {
        var q = String(question || '').trim();
        if (!q) return { answer: '', error: 'empty_question', status: 400 };
        if (q.length > this.MAX_QUESTION_LEN) q = q.substring(0, this.MAX_QUESTION_LEN);

        var apiKey = gs.getProperty('x_1986056_sugbocle.gemini.api_key');
        if (!apiKey) {
            gs.error('[SugboChatbot] api key property is empty');
            return { answer: '', error: 'The AI key is not configured on the server.', status: 500 };
        }

        var contextJson;
        try {
            contextJson = this._buildContext(q);
        } catch (e) {
            gs.error('[SugboChatbot] context build failed: ' + e);
            return { answer: '', error: 'Failed to assemble grounding data.', status: 500 };
        }

        try {
            var r = new sn_ws.RESTMessageV2('SugboClean Gemini Classifier', 'chatbot_answer');
            r.setStringParameterNoEscape('apiKey', apiKey);

            // Build the full Gemini body in JS and send it raw — avoids PDI-side
            // Escape JSON quirks when the grounding context contains braces/quotes.
            var requestBody = {
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
                            answer: { type: 'STRING' },
                            action: { type: 'STRING', enum: this.ALLOWED_ACTIONS }
                        },
                        required: ['answer', 'action']
                    }
                }
            };
            r.setRequestBody(JSON.stringify(requestBody));

            var resp = r.execute();
            var status = resp.getStatusCode();
            var responseBody = resp.getBody();

            if (status !== 200) {
                gs.error('[SugboChatbot] Gemini HTTP ' + status + ' body=' + responseBody);
                if (status === 429) {
                    return { answer: '', error: 'Too many questions right now — please wait a moment and try again.', status: 429 };
                }
                if (status === 400) {
                    return { answer: '', error: 'The AI could not process that question. Try rephrasing.', status: 502 };
                }
                if (status >= 500) {
                    return { answer: '', error: 'The AI service is temporarily unavailable. Please try again shortly.', status: 502 };
                }
                return { answer: '', error: 'Upstream AI error (HTTP ' + status + ').', status: 502 };
            }

            var envelope = JSON.parse(responseBody);

            // Safety-block path: Gemini returns 200 but blocks content — surface a
            // specific message instead of the generic "Bad Gateway".
            if (envelope && envelope.promptFeedback && envelope.promptFeedback.blockReason) {
                gs.error('[SugboChatbot] prompt blocked: ' + envelope.promptFeedback.blockReason);
                return { answer: '', error: 'That question was blocked by the AI safety filter. Please try another.', status: 502 };
            }

            var text = '';
            var finishReason = '';
            if (envelope && envelope.candidates && envelope.candidates[0]) {
                finishReason = envelope.candidates[0].finishReason || '';
                if (envelope.candidates[0].content && envelope.candidates[0].content.parts &&
                    envelope.candidates[0].content.parts[0]) {
                    text = envelope.candidates[0].content.parts[0].text || '';
                }
            }
            if (!text) {
                gs.error('[SugboChatbot] no text in response (finishReason=' + finishReason + '): ' + responseBody);
                if (finishReason === 'SAFETY' || finishReason === 'RECITATION') {
                    return { answer: '', error: 'That response was filtered out by the AI. Please try another question.', status: 502 };
                }
                return { answer: '', error: 'The AI returned an empty response. Please try again.', status: 502 };
            }

            var parsed;
            try {
                parsed = JSON.parse(text);
            } catch (pe) {
                gs.error('[SugboChatbot] answer JSON parse failed: ' + pe + ' text=' + text);
                return { answer: '', error: 'The AI returned an unreadable response.', status: 502 };
            }

            var answer = String(parsed.answer || '').trim();
            if (!answer) {
                return { answer: '', error: 'The AI returned no answer. Please try again.', status: 502 };
            }
            if (answer.length > this.MAX_ANSWER_LEN) answer = answer.substring(0, this.MAX_ANSWER_LEN);

            // Whitelist the action — responseSchema enum guarantees shape but the
            // model can still drop the field on safety/length cutoffs.
            var action = String(parsed.action || 'none').trim().toLowerCase();
            if (this.ALLOWED_ACTIONS.indexOf(action) === -1) action = 'none';

            return { answer: answer, action: action, error: null, status: 200 };
        } catch (e) {
            gs.error('[SugboChatbot] exception: ' + e);
            return { answer: '', error: 'Unexpected error contacting the AI service.', status: 500 };
        }
    },

    _buildContext: function (question) {
        var qLower = String(question || '').toLowerCase();
        var allBarangays = this._loadBarangays();
        var mentionedIds = this._findMentionedBarangays(qLower, allBarangays);

        var payload = {
            system: this.SYSTEM_PROMPT,
            barangays: allBarangays.map(function (b) {
                return { name: b.name, zone: b.zone };
            }),
            waste_items: this._loadWasteItems()
        };

        // Token-aware filtering: when the user names a specific barangay, only
        // ship that barangay's schedules + route stops. Otherwise ship schedules
        // but skip route_stops (which explode quickly — one row per stop per
        // schedule across the whole city).
        if (mentionedIds.length) {
            payload.schedules = this._loadSchedules(mentionedIds);
            payload.route_stops = this._loadRouteStops(mentionedIds);
        } else {
            payload.schedules = this._loadSchedules(null);
        }

        return JSON.stringify(payload);
    },

    _findMentionedBarangays: function (qLower, barangays) {
        var matched = [];
        for (var i = 0; i < barangays.length; i++) {
            var name = String(barangays[i].name || '').toLowerCase();
            if (name && qLower.indexOf(name) !== -1) {
                matched.push(barangays[i].sys_id);
            }
        }
        return matched;
    },

    _loadBarangays: function () {
        var out = [];
        var gr = new GlideRecord('x_1986056_sugbocle_barangay');
        gr.orderBy('u_name');
        gr.query();
        while (gr.next()) {
            out.push({
                sys_id: gr.getUniqueValue(),
                name: gr.getValue('u_name'),
                zone: gr.getValue('u_zone')
            });
        }
        return out;
    },

    _loadSchedules: function (barangaySysIds) {
        var out = [];
        var gr = new GlideRecord('x_1986056_sugbocle_schedule');
        if (barangaySysIds && barangaySysIds.length) {
            gr.addQuery('u_barangay', 'IN', barangaySysIds.join(','));
        }
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

    _loadRouteStops: function (barangaySysIds) {
        if (!barangaySysIds || !barangaySysIds.length) return [];
        var out = [];
        var gr = new GlideRecord('x_1986056_sugbocle_route_stop');
        gr.addQuery('u_barangay', 'IN', barangaySysIds.join(','));
        gr.query();
        while (gr.next()) {
            var startTime = gr.getValue('u_schedule.u_time_window_start');
            var offset = parseInt(gr.getValue('u_offset_minutes') || '0', 10);
            out.push({
                barangay: gr.getDisplayValue('u_barangay'),
                schedule: gr.getDisplayValue('u_schedule'),
                estimated_arrival: this._addMinutesToTime(startTime, offset)
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
    },

    // Mirrors etaFromSchedule() in src/utils/helpers.js so the chatbot answers
    // match what the resident sees in the ScheduleChecker map popups.
    _addMinutesToTime: function (hhmmss, minutes) {
        if (!hhmmss) return '';
        var parts = String(hhmmss).split(':');
        if (parts.length < 2) return hhmmss;
        var h = parseInt(parts[0], 10);
        var m = parseInt(parts[1], 10);
        if (isNaN(h) || isNaN(m)) return hhmmss;
        var total = h * 60 + m + (minutes || 0);
        total = ((total % 1440) + 1440) % 1440;
        var nh = Math.floor(total / 60);
        var nm = total % 60;
        return (nh < 10 ? '0' + nh : String(nh)) + ':' + (nm < 10 ? '0' + nm : String(nm));
    }
};
