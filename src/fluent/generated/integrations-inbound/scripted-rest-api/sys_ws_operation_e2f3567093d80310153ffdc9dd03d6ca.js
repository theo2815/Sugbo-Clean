(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var body = request.body.data;
    var description = body.description ? String(body.description).trim() : '';

    if (!description) {
        response.setStatus(400);
        response.setBody({ error: 'Description is required.' });
        return;
    }

    var gr = new GlideRecord('x_1986056_sugbocle_report');
    gr.initialize();
    gr.setValue('u_barangay', body.barangay);
    gr.setValue('u_missed_date', body.missed_date);
    gr.setValue('u_waste_type', body.waste_type);
    gr.setValue('u_email', body.email || '');
    gr.setValue('u_description', description);
    gr.setValue('u_status', 'Pending');
    gr.insert();

    response.setStatus(201);
    response.setBody({
        result: {
            sys_id: gr.getUniqueValue(),
            report_code: gr.getValue('u_report_code')
        }
    });

})(request, response);