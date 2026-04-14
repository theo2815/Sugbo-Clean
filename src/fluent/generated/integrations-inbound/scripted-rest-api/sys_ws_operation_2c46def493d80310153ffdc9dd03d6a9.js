(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var body = request.body.data;
    var gr = new GlideRecord('x_1986056_sugbocle_waste_item');
    gr.initialize();
    gr.setValue('u_name', body.name);
    gr.setValue('u_bin_type', body.bin_type);
    gr.setValue('u_bin_color', body.bin_color);
    gr.setValue('u_disposal_instructions', body.disposal_instructions);
    gr.insert();

    response.setStatus(201);
    response.setBody({ result: { sys_id: gr.getUniqueValue(), message: 'Created' } });

})(request, response);