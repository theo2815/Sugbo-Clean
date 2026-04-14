(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var haulerId = request.queryParams.hauler_id;
    var list = [];
    var gr = new GlideRecord('x_1986056_sugbocle_route_stop');

    if (haulerId) {
        gr.addQuery('u_hauler', haulerId);
    }

    gr.orderBy('u_stop_order');
    gr.query();

    while (gr.next()) {
        list.push({
            sys_id: gr.getUniqueValue(),
            hauler: gr.getDisplayValue('u_hauler'),
            barangay: gr.getDisplayValue('u_barangay'),
            stop_order: gr.getValue('u_stop_order'),
            estimated_arrival: gr.getValue('u_estimated_arrival'),
            stop_status: gr.getValue('u_stop_status')
        });
    }

    response.setBody({ result: list });

})(request, response);