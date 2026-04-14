(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var sysId = request.pathParams.sys_id;
    var body = request.body.data;
    var gr = new GlideRecord('x_1986056_sugbocle_schedule');

    if (gr.get(sysId)) {
        if (body.barangay) gr.setValue('u_barangay', body.barangay);
        if (body.hauler) gr.setValue('u_hauler', body.hauler);
        if (body.waste_type) gr.setValue('u_waste_type', body.waste_type);
        if (body.day_of_week) gr.setValue('u_day_of_week', body.day_of_week);
        if (body.time_window_start) gr.setValue('u_time_window_start', body.time_window_start);
        if (body.time_window_end) gr.setValue('u_time_window_end', body.time_window_end);
        gr.update();
        response.setBody({ result: { sys_id: gr.getUniqueValue(), message: 'Updated' } });
    } else {
        response.setStatus(404);
        response.setBody({ error: 'Schedule not found' });
    }

})(request, response);