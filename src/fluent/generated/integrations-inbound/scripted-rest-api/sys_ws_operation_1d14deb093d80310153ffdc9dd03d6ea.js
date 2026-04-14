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
                email: gr.getValue('u_email')
            }
        });
    } else {
        response.setStatus(404);
        response.setBody({ error: 'Report not found' });
    }

})(request, response);