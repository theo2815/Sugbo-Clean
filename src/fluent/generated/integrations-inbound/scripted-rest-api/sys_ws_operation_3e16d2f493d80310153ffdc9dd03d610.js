(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var sysId = request.pathParams.sys_id;
    var body = request.body.data;
    var gr = new GlideRecord('x_1986056_sugbocle_route_stop');

    if (gr.get(sysId)) {
        if (body.hauler) gr.setValue('u_hauler', body.hauler);
        if (body.barangay) gr.setValue('u_barangay', body.barangay);
        if (body.stop_order) gr.setValue('u_stop_order', body.stop_order);
        if (body.estimated_arrival) gr.setValue('u_estimated_arrival', body.estimated_arrival);
        if (body.stop_status) gr.setValue('u_stop_status', body.stop_status);
        gr.update();
        response.setBody({ result: { sys_id: gr.getUniqueValue(), message: 'Updated' } });
    } else {
        response.setStatus(404);
        response.setBody({ error: 'Route stop not found' });
    }

})(request, response);