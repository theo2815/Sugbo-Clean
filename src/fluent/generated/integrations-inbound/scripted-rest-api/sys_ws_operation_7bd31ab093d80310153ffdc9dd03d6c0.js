(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var barangayId = request.queryParams.barangay_id;
    var list = [];
    var gr = new GlideRecord('x_1986056_sugbocle_schedule');

    if (barangayId) {
        gr.addQuery('u_barangay', barangayId);
    }

    gr.query();

    while (gr.next()) {
        list.push({
            sys_id: gr.getUniqueValue(),
			barangay: {
				value: gr.getValue('u_barangay'),
				display_value: gr.getDisplayValue('u_barangay')
			},
			hauler: {
				value: gr.getValue('u_hauler'),
				display_value: gr.getDisplayValue('u_hauler')
			},
            waste_type: gr.getValue('u_waste_type'),
            day_of_week: gr.getValue('u_day_of_week'),
            time_window_start: gr.getValue('u_time_window_start'),
            time_window_end: gr.getValue('u_time_window_end')
        });
    }

    response.setBody({ result: list });

})(request, response);