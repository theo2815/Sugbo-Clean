(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var sysId = request.pathParams.sys_id;
    var body = request.body.data;
    var gr = new GlideRecord('x_1986056_sugbocle_barangay');

    if (gr.get(sysId)) {
        if (body.name) gr.setValue('u_name', body.name);
        if (body.zone) gr.setValue('u_zone', body.zone);
        if (body.latitude !== undefined) gr.setValue('u_latitude', body.latitude);
        if (body.longitude !== undefined) gr.setValue('u_longitude', body.longitude);
        gr.update();
        response.setBody({ result: { sys_id: gr.getUniqueValue(), message: 'Updated' } });
    } else {
        response.setStatus(404);
        response.setBody({ error: 'Barangay not found' });
    }

})(request, response);