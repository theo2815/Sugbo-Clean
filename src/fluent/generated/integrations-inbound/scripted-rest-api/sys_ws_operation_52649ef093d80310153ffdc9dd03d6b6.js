(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var body = request.body.data;
    var gr = new GlideRecord('x_1986056_sugbocle_reminder_subscription');

    // Check if already subscribed
    gr.addQuery('u_email', body.email);
    gr.addQuery('u_barangay', body.barangay);
    gr.query();

    if (gr.next()) {
        response.setBody({ result: { message: 'Already subscribed', sys_id: gr.getUniqueValue() } });
        return;
    }

    gr.initialize();
    gr.setValue('u_email', body.email);
    gr.setValue('u_barangay', body.barangay);
    gr.setValue('u_active', true);
    gr.insert();

    response.setStatus(201);
    response.setBody({
        result: {
            sys_id: gr.getUniqueValue(),
            message: 'Subscribed successfully'
        }
    });

})(request, response);