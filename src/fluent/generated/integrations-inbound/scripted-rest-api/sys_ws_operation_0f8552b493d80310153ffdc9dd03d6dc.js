(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var sysId = request.pathParams.sys_id;
    var body = request.body.data;
    var gr = new GlideRecord('x_1986056_sugbocle_hauler');

    if (gr.get(sysId)) {
        if (body.name) gr.setValue('u_name', body.name);
        if (body.contact_number) gr.setValue('u_contact_number', body.contact_number);
        if (body.areas_covered) gr.setValue('u_areas_covered', body.areas_covered);
        gr.update();
        response.setBody({ result: { sys_id: gr.getUniqueValue(), message: 'Updated' } });
    } else {
        response.setStatus(404);
        response.setBody({ error: 'Hauler not found' });
    }

})(request, response);