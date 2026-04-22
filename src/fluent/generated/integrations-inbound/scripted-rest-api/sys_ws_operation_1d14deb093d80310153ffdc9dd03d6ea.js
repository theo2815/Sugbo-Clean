(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var code = request.pathParams.report_code;
    var gr = new GlideRecord('x_1986056_sugbocle_report');
    gr.addQuery('u_report_code', code);
    gr.query();

    if (gr.next()) {
        response.setBody({
            result: {
                sys_id: gr.getUniqueValue(),
                report_code: gr.getValue('u_report_code'),
                barangay: gr.getDisplayValue('u_barangay'),
                missed_date: gr.getValue('u_missed_date'),
                waste_type: gr.getValue('u_waste_type'),
                status: gr.getValue('u_status'),
                description: gr.getValue('u_description'),
                email: gr.getValue('u_email'),
                ai_severity: gr.getValue('u_ai_severity'),
                ai_summary: gr.getValue('u_ai_summary'),
                description_lang: gr.getValue('u_description_lang'),
                description_en: gr.getValue('u_description_en')
            }
        });
    } else {
        response.setStatus(404);
        response.setBody({ error: 'Report not found' });
    }

})(request, response);