var SugboGeminiClassifier = Class.create();
SugboGeminiClassifier.prototype = {
    initialize: function () {},

    type: 'SugboGeminiClassifier',

    SEVERITIES: ['Low', 'Medium', 'High', 'Critical'],
    LANGUAGES: ['en', 'ceb', 'tl', 'mixed'],

    DUPLICATE_LOOKBACK_DAYS: 7,
    DUPLICATE_MAX_CANDIDATES: 15,
    DUPLICATE_PROMPT: [
        "You compare a new resident waste-pickup report against recent open reports from the same barangay.",
        "Decide if the NEW report describes the SAME physical incident as one of the candidates.",
        "Different incidents in the same barangay are common — when in doubt, return 'none'.",
        "Before returning a match, internally verify both reports share specific overlapping facts (location cue, waste type, event). Do not match on generic similarity alone.",
        "Return JSON with keys 'match' (a sys_id from the candidate list, or the literal string 'none') and 'reason'.",
        "'reason' is a short admin-facing summary of the shared problem in 15 words or fewer. Plain English. Do NOT quote either report. Do NOT include sys_ids, report codes, or the words 'report' / 'candidate' / 'overlap'. Describe only the core issue.",
        "Example reason: 'Uncollected garbage pile near the elementary school blocking the sidewalk.'",
        "NEVER invent a sys_id. The match value must appear verbatim in the candidate list."
    ].join(' '),

    classify: function (description, barangay, wasteType) {
        var apiKey = gs.getProperty('x_1986056_sugbocle.gemini.api_key');
        if (!apiKey) {
            gs.error('[SugboGemini] api key property is empty');
            return { severity: '', summary: '', language: '', translation: '' };
        }
        if (!description) {
            return { severity: '', summary: '', language: '', translation: '' };
        }

        try {
            var r = new sn_ws.RESTMessageV2('SugboClean Gemini Classifier', 'classify_report_severity');
            r.setStringParameterNoEscape('apiKey', apiKey);
            r.setStringParameter('description', description);
            r.setStringParameter('barangay', barangay || 'Unknown');
            r.setStringParameter('wasteType', wasteType || 'Unknown');

            var resp = r.execute();
            var status = resp.getStatusCode();
            var body = resp.getBody();

            if (status !== 200) {
                gs.error('[SugboGemini] HTTP ' + status + ' body=' + body);
                return { severity: '', summary: '', language: '', translation: '' };
            }

            var envelope = JSON.parse(body);
            var text = '';
            if (envelope && envelope.candidates && envelope.candidates[0] &&
                envelope.candidates[0].content && envelope.candidates[0].content.parts &&
                envelope.candidates[0].content.parts[0]) {
                text = envelope.candidates[0].content.parts[0].text || '';
            }
            if (!text) {
                gs.error('[SugboGemini] no text in response: ' + body);
                return { severity: '', summary: '', language: '', translation: '' };
            }

            var parsed = JSON.parse(text);
            var severity = String(parsed.severity || '').trim();
            var summary = String(parsed.summary || '').trim();
            var language = String(parsed.language || '').trim().toLowerCase();
            var translation = String(parsed.translation || '').trim();
            if (this.SEVERITIES.indexOf(severity) === -1) severity = '';
            if (this.LANGUAGES.indexOf(language) === -1) language = '';
            if (summary.length > 240) summary = summary.substring(0, 240);
            if (translation.length > 4000) translation = translation.substring(0, 4000);
            // Model occasionally emits a rewritten translation even for English input.
            // The empty-string guard makes the admin UI fall back to the original.
            if (language === 'en') translation = '';

            return {
                severity: severity,
                summary: summary,
                language: language,
                translation: translation,
            };
        } catch (e) {
            gs.error('[SugboGemini] exception: ' + e);
            return { severity: '', summary: '', language: '', translation: '' };
        }
    },

    classifyAndUpdate: function (reportSysId) {
        if (!reportSysId) return;
        var gr = new GlideRecord('x_1986056_sugbocle_report');
        if (!gr.get(reportSysId)) {
            gs.error('[SugboGemini] report not found: ' + reportSysId);
            return;
        }
        var result = this.classify(
            gr.getValue('u_description'),
            gr.getDisplayValue('u_barangay'),
            gr.getDisplayValue('u_waste_type')
        );
        var dup = this.detectDuplicate(
            reportSysId,
            gr.getValue('u_description'),
            gr.getValue('u_barangay')
        );
        if (!result.severity && !result.summary && !result.language && !dup.match) return;
        if (result.severity) gr.setValue('u_ai_severity', result.severity);
        if (result.summary) gr.setValue('u_ai_summary', result.summary);
        if (result.language) gr.setValue('u_description_lang', result.language);
        if (result.translation) gr.setValue('u_description_en', result.translation);
        if (dup.match) {
            gr.setValue('u_potential_duplicate_of', dup.match);
            if (dup.reason) gr.setValue('u_duplicate_reason', dup.reason);
        }
        gr.update();
    },

    detectDuplicate: function (reportSysId, description, barangaySysId) {
        var empty = { match: '', reason: '' };
        if (!reportSysId || !description || !barangaySysId) return empty;
        var apiKey = gs.getProperty('x_1986056_sugbocle.gemini.api_key');
        if (!apiKey) return empty;

        var candidates = [];
        var validIds = {};
        var gr = new GlideRecord('x_1986056_sugbocle_report');
        gr.addQuery('u_barangay', barangaySysId);
        gr.addQuery('u_status', 'IN', 'Pending,In Progress');
        gr.addQuery('sys_id', '!=', reportSysId);
        gr.addQuery('sys_created_on', '>=', gs.daysAgoStart(this.DUPLICATE_LOOKBACK_DAYS));
        gr.orderByDesc('sys_created_on');
        gr.setLimit(this.DUPLICATE_MAX_CANDIDATES);
        gr.query();
        while (gr.next()) {
            var sid = gr.getUniqueValue();
            validIds[sid] = true;
            candidates.push({
                sys_id: sid,
                code: gr.getValue('u_report_code'),
                description: gr.getValue('u_description'),
                missed_date: gr.getValue('u_missed_date')
            });
        }
        if (candidates.length === 0) return empty;

        try {
            var r = new sn_ws.RESTMessageV2('SugboClean Gemini Classifier', 'detect_duplicate');
            r.setStringParameterNoEscape('apiKey', apiKey);
            var body = {
                contents: [{ parts: [{
                    text: this.DUPLICATE_PROMPT +
                        '\n\nNew report description:\n' + description +
                        '\n\nCandidate reports (JSON array):\n' + JSON.stringify(candidates)
                }] }],
                generationConfig: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: 'OBJECT',
                        properties: {
                            match: { type: 'STRING' },
                            reason: { type: 'STRING' }
                        },
                        required: ['match']
                    }
                }
            };
            r.setRequestBody(JSON.stringify(body));

            var resp = r.execute();
            var status = resp.getStatusCode();
            var respBody = resp.getBody();
            if (status !== 200) {
                gs.error('[SugboGemini-dup] HTTP ' + status + ' body=' + respBody);
                return empty;
            }
            var envelope = JSON.parse(respBody);
            if (envelope && envelope.promptFeedback && envelope.promptFeedback.blockReason) return empty;

            var text = '';
            if (envelope && envelope.candidates && envelope.candidates[0] &&
                envelope.candidates[0].content && envelope.candidates[0].content.parts &&
                envelope.candidates[0].content.parts[0]) {
                text = envelope.candidates[0].content.parts[0].text || '';
            }
            if (!text) return empty;

            var parsed = JSON.parse(text);
            var match = String(parsed.match || '').trim();
            var reason = String(parsed.reason || '').trim();
            if (!match || match === 'none') return empty;
            if (!validIds[match]) {
                gs.warn('[SugboGemini-dup] model returned non-candidate sys_id: ' + match);
                return empty;
            }
            if (reason.length > 500) reason = reason.substring(0, 500);
            gs.info('[SugboGemini-dup] flagged ' + reportSysId + ' as duplicate of ' + match + ' — reason: ' + reason);
            return { match: match, reason: reason };
        } catch (e) {
            gs.error('[SugboGemini-dup] exception: ' + e);
            return { match: '', reason: '' };
        }
    },
};
