(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var list = [];
    var gr = new GlideRecord('x_1986056_sugbocle_hauler');
    gr.orderBy('u_name');
    gr.query();

    while (gr.next()) {
        list.push({
            sys_id: gr.getUniqueValue(),
            name: gr.getValue('u_name'),
            contact_number: gr.getValue('u_contact_number'),
            areas_covered: gr.getValue('u_areas_covered')
        });
    }

    response.setBody({ result: list });

})(request, response);