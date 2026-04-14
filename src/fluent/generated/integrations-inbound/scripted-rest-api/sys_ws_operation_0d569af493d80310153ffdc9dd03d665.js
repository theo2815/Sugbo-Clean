(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var sysId = request.pathParams.sys_id;
    var body = request.body.data;
    var gr = new GlideRecord('x_1986056_sugbocle_waste_item');

    if (gr.get(sysId)) {
        if (body.name) gr.setValue('u_name', body.name);
        if (body.bin_type) gr.setValue('u_bin_type', body.bin_type);
        if (body.bin_color) gr.setValue('u_bin_color', body.bin_color);
        if (body.disposal_instructions) gr.setValue('u_disposal_instructions', body.disposal_instructions);
        gr.update();
        response.setBody({ result: { sys_id: gr.getUniqueValue(), message: 'Updated' } });
    } else {
        response.setStatus(404);
        response.setBody({ error: 'Waste item not found' });
    }

})(request, response);