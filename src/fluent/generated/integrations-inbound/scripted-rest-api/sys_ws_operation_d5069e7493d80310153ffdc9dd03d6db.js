(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var body = request.body.data;
    var gr = new GlideRecord('x_1986056_sugbocle_route_stop');
    gr.initialize();
    gr.setValue('u_hauler', body.hauler);
    gr.setValue('u_barangay', body.barangay);
    gr.setValue('u_stop_order', body.stop_order);
    gr.setValue('u_estimated_arrival', body.estimated_arrival);
    gr.setValue('u_stop_status', body.stop_status || 'Not Arrived');
    gr.insert();

    response.setStatus(201);
    response.setBody({ result: { sys_id: gr.getUniqueValue(), message: 'Created' } });

})(request, response);