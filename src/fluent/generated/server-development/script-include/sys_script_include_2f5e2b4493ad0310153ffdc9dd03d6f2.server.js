var SugboGeminiClassifier = Class.create();
SugboGeminiClassifier.prototype = {
    initialize: function () {},

    type: 'SugboGeminiClassifier',

    SEVERITIES: ['Low', 'Medium', 'High', 'Critical'],
    LANGUAGES: ['en', 'ceb', 'tl', 'mixed'],

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
        if (!result.severity && !result.summary && !result.language) return;
        if (result.severity) gr.setValue('u_ai_severity', result.severity);
        if (result.summary) gr.setValue('u_ai_summary', result.summary);
        if (result.language) gr.setValue('u_description_lang', result.language);
        if (result.translation) gr.setValue('u_description_en', result.translation);
        gr.update();
    },
};
