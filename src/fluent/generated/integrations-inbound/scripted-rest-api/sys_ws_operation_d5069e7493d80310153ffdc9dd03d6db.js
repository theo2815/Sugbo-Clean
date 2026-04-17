(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var body = request.body.data;
    var gr = new GlideRecord('x_1986056_sugbocle_route_stop');
    gr.initialize();
    gr.setValue('u_hauler', body.hauler);
    gr.setValue('u_barangay', body.barangay);
    gr.setValue('u_label', body.label || '');
    gr.setValue('u_latitude', body.latitude || '');
    gr.setValue('u_longitude', body.longitude || '');
    gr.setValue('u_stop_order', body.stop_order);
    gr.setValue('u_point_type', body.point_type || 'Stop');
    gr.setValue('u_estimated_arrival', body.estimated_arrival);
    gr.setValue('u_stop_status', body.stop_status || 'Not Arrived');
    gr.insert();

    response.setStatus(201);
    response.setBody({
        result: {
            sys_id: gr.getUniqueValue(),
            label: gr.getValue('u_label'),
            message: 'Created'
        }
    });

})(request, response);