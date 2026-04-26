(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var barangayId = request.queryParams.barangay_id;
    var status = request.queryParams.status;
    var list = [];
    var gr = new GlideRecord('x_1986056_sugbocle_report');

    if (barangayId) gr.addQuery('u_barangay', barangayId);
    if (status) gr.addQuery('u_status', status);

    gr.orderByDesc('sys_created_on');
    gr.query();

    while (gr.next()) {
        var dupSysId = gr.getValue('u_potential_duplicate_of');
        var dupCode = '';
        if (dupSysId) {
            var dupGr = new GlideRecord('x_1986056_sugbocle_report');
            if (dupGr.get(dupSysId)) dupCode = dupGr.getValue('u_report_code');
        }
        list.push({
            sys_id: gr.getUniqueValue(),
            report_code: gr.getValue('u_report_code'),
            barangay: gr.getDisplayValue('u_barangay'),
            missed_date: gr.getValue('u_missed_date'),
            waste_type: gr.getValue('u_waste_type'),
            status: gr.getValue('u_status'),
            email: gr.getValue('u_email'),
            description: gr.getValue('u_description'),
            ai_severity: gr.getValue('u_ai_severity'),
            ai_summary: gr.getValue('u_ai_summary'),
            description_lang: gr.getValue('u_description_lang'),
            description_en: gr.getValue('u_description_en'),
            created_on: gr.getValue('sys_created_on'),
            potential_duplicate_of: dupCode,
            potential_duplicate_of_id: dupSysId || '',
            duplicate_reason: gr.getValue('u_duplicate_reason') || ''
        });
    }

    response.setBody({ result: list });

})(request, response);