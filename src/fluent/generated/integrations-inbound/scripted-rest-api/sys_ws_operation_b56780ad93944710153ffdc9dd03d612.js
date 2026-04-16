(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var body = request.body.data;
    var gr = new GlideRecord('x_1986056_sugbocle_barangay');
    gr.initialize();
    gr.setValue('u_name', body.name);
    gr.setValue('u_zone', body.zone);
    gr.setValue('u_latitude', body.latitude || '');
    gr.setValue('u_longitude', body.longitude || '');
    gr.insert();

    response.setStatus(201);
    response.setBody({
        result: {
            sys_id: gr.getUniqueValue(),
            name: gr.getValue('u_name')
        }
    });

})(request, response);