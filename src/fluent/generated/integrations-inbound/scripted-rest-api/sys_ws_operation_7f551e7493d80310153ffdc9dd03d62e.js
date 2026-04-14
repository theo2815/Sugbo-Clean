(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var body = request.body.data;
    var gr = new GlideRecord('x_1986056_sugbocle_hauler');
    gr.initialize();
    gr.setValue('u_name', body.name);
    gr.setValue('u_contact_number', body.contact_number);
    gr.setValue('u_areas_covered', body.areas_covered);
    gr.insert();

    response.setStatus(201);
    response.setBody({
        result: {
            sys_id: gr.getUniqueValue(),
            name: gr.getValue('u_name')
        }
    });

})(request, response);