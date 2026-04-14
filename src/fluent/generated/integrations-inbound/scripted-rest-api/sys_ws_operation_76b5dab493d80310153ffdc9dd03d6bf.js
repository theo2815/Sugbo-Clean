(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var body = request.body.data;
    var gr = new GlideRecord('x_1986056_sugbocle_schedule');
    gr.initialize();
    gr.setValue('u_barangay', body.barangay);
    gr.setValue('u_hauler', body.hauler);
    gr.setValue('u_waste_type', body.waste_type);
    gr.setValue('u_day_of_week', body.day_of_week);
    gr.setValue('u_time_window_start', body.time_window_start);
    gr.setValue('u_time_window_end', body.time_window_end);
    gr.insert();

    response.setStatus(201);
    response.setBody({ result: { sys_id: gr.getUniqueValue(), message: 'Created' } });

})(request, response);