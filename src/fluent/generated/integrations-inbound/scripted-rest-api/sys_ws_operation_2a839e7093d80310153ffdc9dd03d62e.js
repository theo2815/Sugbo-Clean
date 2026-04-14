(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var list = [];
    var gr = new GlideRecord('x_1986056_sugbocle_barangay');
    gr.orderBy('u_name');
    gr.query();

    while (gr.next()) {
        list.push({
            sys_id: gr.getUniqueValue(),
            name: gr.getValue('u_name'),
            zone: gr.getValue('u_zone')
        });
    }

    response.setBody({ result: list });

})(request, response);