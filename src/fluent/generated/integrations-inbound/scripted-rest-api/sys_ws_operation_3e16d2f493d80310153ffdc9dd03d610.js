(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var sysId = request.pathParams.sys_id;
    var body = request.body.data;
    var gr = new GlideRecord('x_1986056_sugbocle_route_stop');

    if (gr.get(sysId)) {
        // Do NOT allow changing u_barangay or u_schedule on update
        // Require delete + recreate for those
        if (body.label !== undefined) gr.setValue('u_label', body.label);
        if (body.latitude !== undefined) gr.setValue('u_latitude', body.latitude);
        if (body.longitude !== undefined) gr.setValue('u_longitude', body.longitude);
        if (body.stop_order !== undefined) gr.setValue('u_stop_order', body.stop_order);
        if (body.point_type) gr.setValue('u_point_type', body.point_type);
        if (body.stop_status) gr.setValue('u_stop_status', body.stop_status);
        if (body.offset_minutes !== undefined) gr.setValue('u_offset_minutes', body.offset_minutes);
        gr.update();
        response.setBody({ result: { sys_id: gr.getUniqueValue(), message: 'Updated' } });
    } else {
        response.setStatus(404);
        response.setBody({ error: 'Route stop not found' });
    }

})(request, response);