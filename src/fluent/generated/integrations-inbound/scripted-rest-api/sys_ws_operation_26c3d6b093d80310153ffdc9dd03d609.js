(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var barangayId = request.queryParams.barangay_id;
    var list = [];
    var gr = new GlideRecord('x_1986056_sugbocle_hauler');

    if (barangayId) {
        gr.addQuery('u_barangay', barangayId);
    }

    gr.orderBy('u_name');
    gr.query();

    while (gr.next()) {
        list.push({
            sys_id: gr.getUniqueValue(),
            name: gr.getValue('u_name'),
            contact_number: gr.getValue('u_contact_number'),
            areas_covered: gr.getValue('u_areas_covered'),
            barangay: gr.getDisplayValue('u_barangay'),
            barangay_id: gr.getValue('u_barangay')
        });
    }

    response.setBody({ result: list });

})(request, response);