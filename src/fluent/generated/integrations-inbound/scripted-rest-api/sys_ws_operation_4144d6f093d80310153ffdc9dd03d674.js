(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var search = request.queryParams.search;
    var binType = request.queryParams.bin_type;
    var list = [];
    var gr = new GlideRecord('x_1986056_sugbocle_waste_item');

    if (search) {
        gr.addQuery('u_name', 'CONTAINS', search);
    }
    if (binType) {
        gr.addQuery('u_bin_type', binType);
    }

    gr.orderBy('u_name');
    gr.query();

    while (gr.next()) {
        list.push({
            sys_id: gr.getUniqueValue(),
            name: gr.getValue('u_name'),
            bin_type: gr.getValue('u_bin_type'),
            bin_color: gr.getValue('u_bin_color'),
            disposal_instructions: gr.getValue('u_disposal_instructions')
        });
    }

    response.setBody({ result: list });

})(request, response);